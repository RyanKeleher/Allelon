-- Prayer groups: creating, inviting, admin-approved joining, leaving, removal.
begin;
\ir helpers.inc

select plan(27);

-- Cast: Abby (admin), Mia (member), Joe (wants to join), Sal (stranger)
select tests.create_user('00000000-0000-0000-0000-0000000000d1', 'Abby');
select tests.create_user('00000000-0000-0000-0000-0000000000d2', 'Mia');
select tests.create_user('00000000-0000-0000-0000-0000000000d3', 'Joe');
select tests.create_user('00000000-0000-0000-0000-0000000000d4', 'Sal');

create temp table t (k text primary key, v text) on commit drop;
grant all on t to authenticated;

-- Abby creates a group and becomes its admin.
select tests.as_user('00000000-0000-0000-0000-0000000000d1');
insert into t values ('gid', public.create_group('Thursday Bible Study', null, 'We meet at 7')::text);
select is(
  (select role::text from public.group_members
    where group_id = (select v::uuid from t where k = 'gid') and user_id = auth.uid()),
  'admin', 'the creator is the group''s admin');
select is((select icon from public.groups where id = (select v::uuid from t where k = 'gid')), U&'\+01F64F',
  'a group without an icon gets the default');

insert into t values ('code', public.group_invite_code((select v::uuid from t where k = 'gid')));
select ok((select v from t where k = 'code') ~ '^[A-Z2-9]{8}$', 'invite codes are 8 readable characters');
select is(public.group_invite_code((select v::uuid from t where k = 'gid')), (select v from t where k = 'code'),
  'asking again returns the same active code');

-- Abby adds Mia directly by approving her request (Mia asks first).
select tests.as_user('00000000-0000-0000-0000-0000000000d2');
select public.request_to_join_group((select v from t where k = 'code'));
select tests.as_user('00000000-0000-0000-0000-0000000000d1');
select public.respond_to_join_request((select v::uuid from t where k = 'gid'), '00000000-0000-0000-0000-0000000000d2', true);

-- Abby posts to the group.
insert into t values ('req', public.create_prayer_request('Pray for our study', array[]::text[],
  array[(select v::uuid from t where k = 'gid')])::text);

-- ---------------------------------------------------------------------------
-- Before joining: Joe sees the invite preview but not the group itself
-- ---------------------------------------------------------------------------
select tests.as_user('00000000-0000-0000-0000-0000000000d3');
select is((select name from public.group_for_invite(lower((select v from t where k = 'code')))),
  'Thursday Bible Study', 'an invite code (any case) shows the group''s name');
select is((select member_count from public.group_for_invite((select v from t where k = 'code'))), 2,
  'the preview shows how many members there are');
select is((select count(*)::int from public.groups), 0, 'a non-member cannot read the group');
select is((select count(*)::int from public.group_members), 0, 'a non-member cannot see who is in the group');
select is((select count(*)::int from public.group_invites), 0, 'a non-member cannot read invite codes');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 0,
  'a non-member sees nothing in the group feed');

select throws_ok($$ select public.request_to_join_group('NOTACODE') $$, 'P0002', null,
  'an unknown invite code is rejected');

-- Joe asks to join: pending, still no access.
select public.request_to_join_group((select v from t where k = 'code'));
select ok((select has_pending_request from public.group_for_invite((select v from t where k = 'code'))),
  'the requester sees their request is pending');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 0,
  'a pending requester still cannot see the prayer list');
select throws_ok(
  format($$ select public.create_prayer_request('sneak', array[]::text[], array[%L::uuid]) $$, (select v from t where k = 'gid')),
  '42501', null, 'a pending requester cannot post to the group');

-- Mia (a member, not admin) cannot approve Joe or see invite codes.
select tests.as_user('00000000-0000-0000-0000-0000000000d2');
select throws_ok(
  format($$ select public.respond_to_join_request(%L, '00000000-0000-0000-0000-0000000000d3', true) $$, (select v from t where k = 'gid')),
  '42501', null, 'members who are not admins cannot approve requests');
select is((select count(*)::int from public.group_join_requests), 0, 'members cannot see other people''s join requests');
select is((select count(*)::int from public.group_invites), 0, 'members who are not admins cannot read invite codes');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 1,
  'members see the group''s prayer list');

-- Abby sees and approves Joe.
select tests.as_user('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.group_join_requests), 1, 'the admin sees the pending request');
select public.respond_to_join_request((select v::uuid from t where k = 'gid'), '00000000-0000-0000-0000-0000000000d3', true);

select tests.as_user('00000000-0000-0000-0000-0000000000d3');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 1,
  'once approved, the new member sees the prayer list');

-- ---------------------------------------------------------------------------
-- Removal, leaving, and admin succession
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$ select public.remove_group_member(%L, '00000000-0000-0000-0000-0000000000d2') $$, (select v from t where k = 'gid')),
  '42501', null, 'members cannot remove other members');

select tests.as_user('00000000-0000-0000-0000-0000000000d1');
select public.remove_group_member((select v::uuid from t where k = 'gid'), '00000000-0000-0000-0000-0000000000d3');
select tests.as_user('00000000-0000-0000-0000-0000000000d3');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 0,
  'a removed member loses access to the prayer list immediately');

-- A reset code stops the old link from working.
select tests.as_user('00000000-0000-0000-0000-0000000000d1');
insert into t values ('code2', public.reset_group_invite_code((select v::uuid from t where k = 'gid')));
select tests.as_user('00000000-0000-0000-0000-0000000000d4');
select throws_ok(format($$ select public.request_to_join_group(%L) $$, (select v from t where k = 'code')),
  'P0002', null, 'after a reset, the old invite code no longer works');

-- When the only admin leaves, the longest-standing member becomes admin.
select tests.as_user('00000000-0000-0000-0000-0000000000d1');
select public.leave_group((select v::uuid from t where k = 'gid'));
reset role;
select is(
  (select role::text from public.group_members
    where group_id = (select v::uuid from t where k = 'gid') and user_id = '00000000-0000-0000-0000-0000000000d2'),
  'admin', 'when the last admin leaves, the next member becomes admin');

select tests.as_user('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from public.group_feed((select v::uuid from t where k = 'gid'))), 1,
  'a former member still sees their own request (authors always see what they wrote)');

-- When the last member leaves, the group is deleted.
select tests.as_user('00000000-0000-0000-0000-0000000000d2');
select public.leave_group((select v::uuid from t where k = 'gid'));
reset role;
select is((select count(*)::int from public.groups where id = (select v::uuid from t where k = 'gid')), 0,
  'an empty group is deleted');

-- Direct writes to membership are never allowed.
select tests.as_user('00000000-0000-0000-0000-0000000000d4');
select throws_ok(
  $$ insert into public.group_members (group_id, user_id) select id, auth.uid() from public.groups limit 1 $$,
  '42501', null, 'nobody can add themselves to a group directly');

reset role;
select * from finish();
rollback;
