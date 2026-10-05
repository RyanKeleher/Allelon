-- Who can see a prayer request, a response, and the people around it.
begin;
\ir helpers.inc

select plan(44);

-- ---------------------------------------------------------------------------
-- Cast
--   ann   author
--   fred  accepted follower
--   pam   pending follower (asked, not yet accepted)
--   cara  accepted follower on Ann's close friends list
--   gus   member of Ann's Bible study group, does not follow her
--   nora  stranger
--   ben   was a follower, then Ann blocked him
-- ---------------------------------------------------------------------------
select tests.create_user('00000000-0000-0000-0000-00000000000a', 'Ann');
select tests.create_user('00000000-0000-0000-0000-00000000000f', 'Fred');
select tests.create_user('00000000-0000-0000-0000-0000000000a1', 'Pam');
select tests.create_user('00000000-0000-0000-0000-00000000000c', 'Cara');
select tests.create_user('00000000-0000-0000-0000-0000000000a6', 'Gus');
select tests.create_user('00000000-0000-0000-0000-0000000000ee', 'Nora');
select tests.create_user('00000000-0000-0000-0000-00000000000b', 'Ben');

insert into public.follows (follower_id, followee_id, status) values
  ('00000000-0000-0000-0000-00000000000f', '00000000-0000-0000-0000-00000000000a', 'accepted'),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000000a', 'pending'),
  ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000a', 'accepted'),
  ('00000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000a', 'accepted');

insert into public.close_friends (owner_id, friend_id) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c');

insert into public.groups (id, name, created_by) values
  ('00000000-0000-0000-0000-0000000000b1', 'Thursday Bible Study', '00000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000b2', 'Basketball Team', '00000000-0000-0000-0000-0000000000a6');
insert into public.group_members (group_id, user_id, role) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a6', 'member'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a6', 'admin');

-- Ann posts one request per audience, through the same RPC the app uses.
select tests.as_user('00000000-0000-0000-0000-00000000000a');
create temp table req (name text primary key, id uuid) on commit drop;
grant all on req to authenticated;
insert into req values
  ('followers', public.create_prayer_request('For my followers', array['followers'])),
  ('close',     public.create_prayer_request('For close friends', array['close_friends'])),
  ('group',     public.create_prayer_request('For the Bible study', array[]::text[], array['00000000-0000-0000-0000-0000000000b1'::uuid])),
  ('world',     public.create_prayer_request('For the world', array['world'], p_country_code => 'US')),
  ('multi',     public.create_prayer_request('Close friends and group', array['close_friends'], array['00000000-0000-0000-0000-0000000000b1'::uuid])),
  ('anon',      public.create_prayer_request('Anonymous to the world', array['world'], p_is_anonymous => true, p_country_code => 'US')),
  ('hidden',    public.create_prayer_request('Hidden by moderators', array['world']));
reset role;

update public.prayer_requests set hidden_at = now() where id = (select id from req where name = 'hidden');
insert into public.blocks (blocker_id, blocked_id) values
  ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b');

create function pg_temp.ids(variadic names text[]) returns uuid[] language sql as $$
  select coalesce(array_agg(id order by id), '{}') from req where name = any(names);
$$;
grant execute on function pg_temp.ids to authenticated;

-- ---------------------------------------------------------------------------
-- Request visibility, one row per person
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000a');
select is(tests.visible_requests(), pg_temp.ids('followers','close','group','world','multi','anon','hidden'),
  'author sees all of her own requests, including hidden ones');

select tests.as_user('00000000-0000-0000-0000-00000000000f');
select is(tests.visible_requests(), pg_temp.ids('followers','world','anon'),
  'accepted follower sees followers + world requests only');
select ok(not (pg_temp.ids('close') <@ tests.visible_requests()),
  'accepted follower does NOT see close-friends request');
select ok(not (pg_temp.ids('group') <@ tests.visible_requests()),
  'follower who is not a group member does NOT see group request');

select tests.as_user('00000000-0000-0000-0000-0000000000a1');
select is(tests.visible_requests(), pg_temp.ids('world','anon'),
  'pending follower sees only world requests');

select tests.as_user('00000000-0000-0000-0000-00000000000c');
select is(tests.visible_requests(), pg_temp.ids('followers','close','world','multi','anon'),
  'close friend sees followers, close friends, multi-audience, and world');

select tests.as_user('00000000-0000-0000-0000-0000000000a6');
select is(tests.visible_requests(), pg_temp.ids('group','world','multi','anon'),
  'group member sees group, multi-audience (via group), and world');
select ok(not (pg_temp.ids('followers') <@ tests.visible_requests()),
  'group member who does not follow does NOT see followers request');

select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select is(tests.visible_requests(), pg_temp.ids('world','anon'),
  'stranger sees only world requests');

select tests.as_user('00000000-0000-0000-0000-00000000000b');
select is(tests.visible_requests(), '{}'::uuid[],
  'blocked user sees nothing from the author, not even world requests');

reset role;
select is(
  (select count(*)::int from public.follows where follower_id = '00000000-0000-0000-0000-00000000000b'),
  0, 'blocking removed the blocked user''s follow');

-- ---------------------------------------------------------------------------
-- Anonymity: nobody but the author learns who wrote an anonymous request
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select is(
  (select author_id from public.request_cards where id = (select id from req where name = 'anon')),
  null, 'request_cards hides the author of an anonymous request');
select throws_ok(
  $$ select author_id from public.prayer_requests limit 1 $$,
  '42501', null, 'clients cannot select prayer_requests.author_id directly');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
select ok(
  (select is_mine from public.request_cards where id = (select id from req where name = 'anon')),
  'the author still recognises her anonymous request as hers');

-- ---------------------------------------------------------------------------
-- Audiences never reveal groups the viewer is not in
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000c');
select is(
  (select array_agg(audience_type::text order by audience_type) from public.prayer_audiences
    where request_id = (select id from req where name = 'multi')),
  array['close_friends'], 'close friend sees the close-friends audience but not the group');

select tests.as_user('00000000-0000-0000-0000-0000000000a6');
select is(
  (select count(*)::int from public.prayer_audiences
    where request_id = (select id from req where name = 'multi') and audience_type = 'group'),
  1, 'group member sees the group audience');

-- ---------------------------------------------------------------------------
-- Responses
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000f');
insert into public.responses (request_id, body, is_private)
  values ((select id from req where name = 'followers'), 'Praying with you', false),
         ((select id from req where name = 'followers'), 'Just between us', true);
select is((select count(*)::int from public.responses), 2, 'responder sees both their public and private response');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.responses), 2, 'request author sees public and private responses');

select tests.as_user('00000000-0000-0000-0000-00000000000c');
select is(
  (select array_agg(body) from public.responses), array['Praying with you'],
  'another viewer of the request sees only the public response');

select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select is((select count(*)::int from public.responses), 0,
  'someone who cannot see the request sees none of its responses');

select throws_ok(
  format($$ insert into public.responses (request_id, body) values (%L, 'hi') $$, (select id from req where name = 'close')),
  '42501', null, 'cannot respond to a request you cannot see');

select lives_ok(
  format($$ insert into public.responses (request_id, body) values (%L, 'Praying from afar') $$, (select id from req where name = 'world')),
  'anyone can respond to a world request');

select throws_ok(
  format($$ insert into public.responses (request_id, author_id, body) values (%L, %L, 'spoof') $$,
    (select id from req where name = 'world'), '00000000-0000-0000-0000-00000000000f'),
  '42501', null, 'cannot respond as someone else');

-- ---------------------------------------------------------------------------
-- "I prayed"
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-00000000000f');
select lives_ok(
  format($$ insert into public.prayers (request_id) values (%L) $$, (select id from req where name = 'followers')),
  'follower can pray for a visible request');
select throws_ok(
  format($$ insert into public.prayers (request_id) values (%L) $$, (select id from req where name = 'followers')),
  '23505', null, 'praying twice on the same day is a no-op the client can ignore');
select throws_ok(
  format($$ insert into public.prayers (request_id) values (%L) $$, (select id from req where name = 'close')),
  '42501', null, 'cannot record a prayer for a request you cannot see');
select is(
  (select prayer_count from public.request_cards where id = (select id from req where name = 'followers')),
  null, 'non-authors do not get a prayer count');
select ok(
  (select prayed_by_me from public.request_cards where id = (select id from req where name = 'followers')),
  'the pray-er sees that they prayed');

select tests.as_user('00000000-0000-0000-0000-00000000000c');
insert into public.prayers (request_id) values ((select id from req where name = 'followers'));
select is((select count(*)::int from public.prayers), 1, 'each person sees only their own prayers');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
select is(
  (select prayer_count from public.request_cards where id = (select id from req where name = 'followers')),
  2::bigint, 'the author sees how many people prayed');
select is((select count(*)::int from public.prayers), 2, 'the author sees who prayed for her request');

-- ---------------------------------------------------------------------------
-- Creating requests
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select throws_ok(
  $$ select public.create_prayer_request('sneaking in', array[]::text[], array['00000000-0000-0000-0000-0000000000b1'::uuid]) $$,
  '42501', null, 'cannot post to a group you are not in');
select throws_ok(
  $$ insert into public.prayer_requests (body) values ('direct insert') $$,
  '42501', null, 'requests cannot be inserted directly, only through the RPC');
select throws_ok(
  $$ select public.create_prayer_request('anon to followers', array['followers'], p_is_anonymous => true) $$,
  '22023', null, 'anonymous posts must be World-only');
select throws_ok(
  $$ select public.create_prayer_request('nobody', array[]::text[]) $$,
  '22023', null, 'a request needs at least one audience');
select throws_ok(
  $$ select public.create_prayer_request('photo', array['followers'], p_photo_path => '00000000-0000-0000-0000-00000000000a/x.jpg') $$,
  '42501', null, 'cannot attach a photo from someone else''s folder');

-- Editing and deleting someone else's request silently affects nothing.
select tests.as_user('00000000-0000-0000-0000-00000000000f');
update public.prayer_requests set body = 'tampered' where id = (select id from req where name = 'followers');
delete from public.prayer_requests where id = (select id from req where name = 'followers');
reset role;
select is((select body from public.prayer_requests where id = (select id from req where name = 'followers')),
  'For my followers', 'non-authors cannot edit or delete a request');

-- ---------------------------------------------------------------------------
-- Follows and close friends
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select throws_ok(
  $$ insert into public.follows (followee_id, status) values ('00000000-0000-0000-0000-00000000000a', 'accepted') $$,
  '42501', null, 'cannot create an already-accepted follow');
select lives_ok(
  $$ insert into public.follows (followee_id) values ('00000000-0000-0000-0000-00000000000a') $$,
  'can request to follow');
update public.follows set status = 'accepted' where followee_id = '00000000-0000-0000-0000-00000000000a';
select is(
  (select status::text from public.follows where follower_id = '00000000-0000-0000-0000-0000000000ee'),
  'pending', 'the follower cannot accept their own request');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
update public.follows set status = 'accepted' where follower_id = '00000000-0000-0000-0000-0000000000ee';
select tests.as_user('00000000-0000-0000-0000-0000000000ee');
select ok(pg_temp.ids('followers') <@ tests.visible_requests(), 'once accepted, the new follower sees followers requests');

select tests.as_user('00000000-0000-0000-0000-00000000000f');
select is((select count(*)::int from public.close_friends), 0,
  'close friends lists are private: others cannot read them');

select tests.as_user('00000000-0000-0000-0000-00000000000a');
select throws_ok(
  $$ insert into public.close_friends (friend_id) values ('00000000-0000-0000-0000-0000000000a1') $$,
  '42501', null, 'cannot add a pending follower to close friends');

-- Unfollowing removes the person from close friends, and with it their access.
select tests.as_user('00000000-0000-0000-0000-00000000000c');
delete from public.follows where followee_id = '00000000-0000-0000-0000-00000000000a';
select ok(not (pg_temp.ids('close') <@ tests.visible_requests()),
  'after unfollowing, a former close friend no longer sees close-friends requests');

reset role;
select * from finish();
rollback;
