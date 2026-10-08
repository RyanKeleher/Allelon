-- Demo people and prayer requests for trying the app locally.
-- Not run by `supabase db reset`. Load it after a reset with:
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/demo.sql
-- Every demo account signs in with password "allelon-demo" (password sign-in
-- is for local demos and screenshots only; the app itself uses email codes).

begin;

create temp table demo_people (id uuid, email text, name text, handle text, bio text) on commit drop;
insert into demo_people values
  ('d0000000-0000-0000-0000-000000000001', 'grace@demo.allelon.app',  'Grace Miller',  'gracemiller',  'Seeking God''s face daily.'),
  ('d0000000-0000-0000-0000-000000000002', 'james@demo.allelon.app',  'James Okafor',  'jamesokafor',  'Father, husband, believer.'),
  ('d0000000-0000-0000-0000-000000000003', 'yuki@demo.allelon.app',   'Yuki Tanaka',   'yukitanaka',   'Finding rest in Him.'),
  ('d0000000-0000-0000-0000-000000000004', 'rachel@demo.allelon.app', 'Rachel Kim',    'rachelkim',    'Clinging to grace every day.'),
  ('d0000000-0000-0000-0000-000000000005', 'daniel@demo.allelon.app', 'Daniel Mensah', 'danielmensah', 'Builder. Dreamer.');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
       extensions.crypt('allelon-demo', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', name), now(), now(),
       '', '', '', ''
from demo_people;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id::text, id, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from demo_people;

update public.profiles p
set handle = d.handle, bio = d.bio, country_code = 'US', onboarded_at = now()
from demo_people d where p.id = d.id;

-- Grace, James, Yuki, and Rachel all follow each other. Daniel has asked to follow Grace.
insert into public.follows (follower_id, followee_id, status, accepted_at)
select a.id, b.id, 'accepted', now()
from demo_people a, demo_people b
where a.id <> b.id and a.handle <> 'danielmensah' and b.handle <> 'danielmensah';
insert into public.follows (follower_id, followee_id, status)
values ('d0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'pending');

-- Close friends: Grace trusts Yuki and Rachel; James trusts Grace.
insert into public.close_friends (owner_id, friend_id) values
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003'),
  ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004'),
  ('d0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001');

insert into public.groups (id, name, icon, created_by) values
  ('d1000000-0000-0000-0000-000000000001', 'Thursday Bible Study', '📖', 'd0000000-0000-0000-0000-000000000001');
insert into public.group_members (group_id, user_id, role) values
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'admin'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'member'),
  ('d1000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'member');

insert into public.prayer_requests (id, author_id, kind, moment_label, body, passion_id, country_code, language, created_at) values
  ('d2000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'request', null,
   'My marriage has been under strain. Asking my closest people to stand in the gap with us this month.', 'family', null, 'en', now() - interval '2 hours'),
  ('d2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'request', null,
   'Leading worship on Sunday and feeling inadequate. Pray I would disappear and only Jesus is seen.', 'faith', null, 'en', now() - interval '5 hours'),
  ('d2000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'moment', 'Milestone',
   'Thesis defense booked for next month. Two years of prayer brought me here.', 'school', null, 'en', now() - interval '9 hours'),
  ('d2000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'request', null,
   'Pray about our study''s direction this season. We want to feel led, not just scheduled.', 'community', null, 'en', now() - interval '1 day'),
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000001', 'request', null,
   'Stepping into new leadership at church. I feel completely inadequate, and I know that is where He works.', 'faith', null, 'en', now() - interval '3 days'),
  ('d2000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000004', 'request', null,
   'For the families displaced by this week''s floods: shelter, clean water, and neighbors who show up.', 'peace', 'US', 'en', now() - interval '4 days');

-- World requests in other languages, for the globe and translation.
insert into public.prayer_requests (id, author_id, kind, body, passion_id, country_code, language, created_at) values
  ('d2000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000005', 'request',
   'Orem pela minha mãe, que começa a quimioterapia na segunda-feira. Que ela sinta a paz de Deus.', 'health', 'BR', 'pt', now() - interval '6 hours'),
  ('d2000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', 'request',
   '다음 주에 새 직장을 시작합니다. 동료들과 좋은 관계를 맺고 빛이 될 수 있도록 기도해 주세요.', 'work', 'KR', 'ko', now() - interval '20 hours');

insert into public.prayer_audiences (request_id, audience_type, group_id) values
  ('d2000000-0000-0000-0000-000000000001', 'close_friends', null),
  ('d2000000-0000-0000-0000-000000000002', 'followers', null),
  ('d2000000-0000-0000-0000-000000000003', 'followers', null),
  ('d2000000-0000-0000-0000-000000000004', 'group', 'd1000000-0000-0000-0000-000000000001'),
  ('d2000000-0000-0000-0000-000000000005', 'followers', null),
  ('d2000000-0000-0000-0000-000000000005', 'close_friends', null),
  ('d2000000-0000-0000-0000-000000000006', 'followers', null),
  ('d2000000-0000-0000-0000-000000000006', 'world', null),
  ('d2000000-0000-0000-0000-000000000007', 'world', null),
  ('d2000000-0000-0000-0000-000000000008', 'world', null);

insert into public.responses (request_id, author_id, body, is_private, created_at) values
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002',
   'I was there when you first said yes to this. He has been preparing you longer than you know.', false, now() - interval '2 days'),
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004',
   'Praying Isaiah 41:10 over you this week. Coffee Thursday?', true, now() - interval '1 day'),
  ('d2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001',
   'Lord, let Yuki rest in You and lead from that rest.', false, now() - interval '3 hours');

insert into public.prayers (request_id, user_id, prayed_at) values
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', now() - interval '2 days'),
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', now() - interval '2 days'),
  ('d2000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', now() - interval '1 day'),
  ('d2000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', now() - interval '3 hours');

commit;
