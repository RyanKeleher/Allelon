-- Answered prayer, notifications, check-ins, push tokens, reports, moderation.
begin;
\ir helpers.inc

select plan(24);

select tests.create_user('00000000-0000-0000-0000-0000000000f1', 'Ava');    -- author
select tests.create_user('00000000-0000-0000-0000-0000000000f2', 'Eli');    -- follower who prays
select tests.create_user('00000000-0000-0000-0000-0000000000f3', 'Kim');    -- stranger who prays for a World request
select tests.create_user('00000000-0000-0000-0000-0000000000f4', 'Mod');    -- moderator
update public.profiles set is_moderator = true where id = '00000000-0000-0000-0000-0000000000f4';

insert into public.follows (follower_id, followee_id, status) values
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-0000000000f1', 'accepted');

create temp table t (k text primary key, v uuid) on commit drop;
grant all on t to authenticated;

select tests.as_user('00000000-0000-0000-0000-0000000000f1');
insert into t values
  ('req', public.create_prayer_request('Job interview Friday', array['followers'])),
  ('anon', public.create_prayer_request('Healing for my dad', array['world'], p_is_anonymous => true, p_country_code => 'US'));

-- Eli prays and responds; Kim prays for the anonymous World request.
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
insert into public.prayers (request_id) select v from t where k = 'req';
insert into public.responses (request_id, body) select v, 'Praying!' from t where k = 'req';
select tests.as_user('00000000-0000-0000-0000-0000000000f3');
insert into public.prayers (request_id) select v from t where k = 'anon';

-- ---------------------------------------------------------------------------
-- Responses and follow requests notify the right person
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000f1');
select is((select count(*)::int from public.notifications where kind = 'response'), 1,
  'the author is notified when someone responds');
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.notifications), 0, 'responders are not notified about their own response');

select tests.as_user('00000000-0000-0000-0000-0000000000f3');
insert into public.follows (followee_id) values ('00000000-0000-0000-0000-0000000000f1');
select tests.as_user('00000000-0000-0000-0000-0000000000f1');
select is((select count(*)::int from public.notifications where kind = 'follow_request'), 1,
  'a follow request notifies the person being followed');

-- ---------------------------------------------------------------------------
-- Answered prayer
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select throws_ok(format($$ select public.mark_request_answered(%L, 'nope') $$, (select v from t where k = 'req')),
  '42501', null, 'only the author can mark a request answered');

select tests.as_user('00000000-0000-0000-0000-0000000000f1');
select public.mark_request_answered((select v from t where k = 'req'), 'Got the job!');
select public.mark_request_answered((select v from t where k = 'anon'), 'He is home.');
select is((select status::text from public.prayer_requests where id = (select v from t where k = 'req')), 'answered',
  'the request is marked answered');

select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.notifications where kind = 'answered'), 1,
  'everyone who prayed is told it was answered');
select tests.as_user('00000000-0000-0000-0000-0000000000f3');
select is((select actor_id from public.notifications where kind = 'answered'), null,
  'answered notifications for anonymous requests do not reveal the author');

select tests.as_user('00000000-0000-0000-0000-0000000000f1');
select public.mark_request_answered((select v from t where k = 'req'), 'Got the job! Start Monday.');
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.notifications where kind = 'answered'), 1,
  'editing the update does not notify people a second time');

select tests.as_user('00000000-0000-0000-0000-0000000000f1');
select public.reopen_request((select v from t where k = 'req'));
select is((select answered_at from public.prayer_requests where id = (select v from t where k = 'req')), null,
  'the author can reopen a request marked answered by mistake');

-- ---------------------------------------------------------------------------
-- Check-ins
-- ---------------------------------------------------------------------------
reset role;
select is((select count(*)::int from public.checkin_reminders where user_id = '00000000-0000-0000-0000-0000000000f2'), 0,
  'marking answered cleared the pending check-in');

-- Eli prays again on a fresh request; make it due now and run the job.
select tests.as_user('00000000-0000-0000-0000-0000000000f1');
insert into t values ('req2', public.create_prayer_request('Exams next week', array['followers']));
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
insert into public.prayers (request_id) select v from t where k = 'req2';
reset role;
select is((select due_at::date - now()::date from public.checkin_reminders
           where request_id = (select v from t where k = 'req2')), 3,
  'praying schedules a check-in 3 days out by default');
update public.checkin_reminders set due_at = now() - interval '1 minute';
select is(private.send_due_checkins(), 1, 'due check-ins become notifications');
select is(private.send_due_checkins(), 0, 'each check-in is sent only once');

update public.profiles set checkins_enabled = false where id = '00000000-0000-0000-0000-0000000000f2';
select tests.as_user('00000000-0000-0000-0000-0000000000f1');
insert into t values ('req3', public.create_prayer_request('New neighbors', array['followers']));
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
insert into public.prayers (request_id) select v from t where k = 'req3';
reset role;
select is((select count(*)::int from public.checkin_reminders where request_id = (select v from t where k = 'req3')), 0,
  'no check-ins are scheduled for people who turned them off');

select throws_ok($$ set local role authenticated; select private.send_due_checkins() $$, '42501', null,
  'clients cannot run the check-in job');
reset role;

-- Losing access hides notifications about that request.
delete from public.follows where follower_id = '00000000-0000-0000-0000-0000000000f2';
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.notifications), 0,
  'notifications about requests you can no longer see disappear');

-- ---------------------------------------------------------------------------
-- Push tokens
-- ---------------------------------------------------------------------------
select public.register_push_token('ExponentPushToken[eli]', 'ios');
select tests.as_user('00000000-0000-0000-0000-0000000000f3');
select public.register_push_token('ExponentPushToken[eli]', 'android');
select is((select count(*)::int from public.push_tokens), 1, 'a device that changes hands moves to the new account');
select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.push_tokens), 0, 'and the previous account no longer has it');

-- ---------------------------------------------------------------------------
-- Reports and moderation
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000f3');
insert into public.reports (target_type, target_id, reason) select 'request', v, 'spam' from t where k = 'anon';
select is((select count(*)::int from public.reports), 1, 'reporters see their own report');
select throws_ok($$ select * from public.moderation_queue() $$, '42501', null, 'non-moderators cannot open the queue');

select tests.as_user('00000000-0000-0000-0000-0000000000f2');
select is((select count(*)::int from public.reports), 0, 'other people cannot see who reported what');

select tests.as_user('00000000-0000-0000-0000-0000000000f4');
select is((select content from public.moderation_queue() limit 1), 'Healing for my dad', 'moderators see reported content');
select public.resolve_report('request', (select v from t where k = 'anon'), 'hide');

select tests.as_user('00000000-0000-0000-0000-0000000000f3');
select is((select count(*)::int from public.prayer_requests where id = (select v from t where k = 'anon')), 0,
  'hidden content disappears for everyone else');
select throws_ok($$ update public.profiles set is_moderator = true where id = auth.uid() $$, '42501', null,
  'people cannot make themselves moderators');

reset role;
select * from finish();
rollback;
