-- The World: counts, country feeds, and the translation cache.
begin;
\ir helpers.inc

select plan(8);

select tests.create_user('00000000-0000-0000-0000-0000000000e1', 'Wren');   -- posts to the World
select tests.create_user('00000000-0000-0000-0000-0000000000e2', 'Vic');    -- any reader
select tests.create_user('00000000-0000-0000-0000-0000000000e3', 'Bo');     -- blocked by Wren

create temp table t (k text primary key, v uuid) on commit drop;
grant all on t to authenticated;

select tests.as_user('00000000-0000-0000-0000-0000000000e1');
insert into t values
  ('world', public.create_prayer_request('Pray for rain', array['world'], p_country_code => 'KE')),
  ('anon', public.create_prayer_request('Pray for my brother', array['world'], p_is_anonymous => true, p_country_code => 'KE')),
  ('friends', public.create_prayer_request('Followers only', array['followers'], p_country_code => 'KE'));
reset role;
insert into public.blocks (blocker_id, blocked_id)
  values ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-0000000000e3');
insert into public.request_translations (request_id, target_language, source_hash, body)
  values ((select v from t where k = 'world'), 'es', 'x', 'Oren por lluvia');

select tests.as_user('00000000-0000-0000-0000-0000000000e2');
select is((select open_requests from public.world_counts() where country_code = 'KE'), 2,
  'world_counts counts World requests (including anonymous) but not followers-only ones');
select is((select count(*)::int from public.world_feed('ke')), 2, 'world_feed returns the country''s World requests');
select ok(not exists (select 1 from public.world_feed('KE') where id = (select v from t where k = 'friends')),
  'world_feed never includes requests that were not shared with the World');
select is((select author_id from public.world_feed('KE') where id = (select v from t where k = 'anon')), null,
  'anonymous World requests stay anonymous in the country feed');
select is((select body from public.request_translations), 'Oren por lluvia', 'readers of a request can read its translations');
select throws_ok($$ insert into public.request_translations (request_id, target_language, source_hash, body)
                    select v, 'fr', 'x', 'spoofed' from t where k = 'world' $$,
  '42501', null, 'clients cannot write translations (only the Edge Function can)');

select tests.as_user('00000000-0000-0000-0000-0000000000e3');
select is((select count(*)::int from public.world_counts()), 0, 'blocked users see no World requests from the blocker');
select is((select count(*)::int from public.request_translations), 0, 'nor their translations');

reset role;
select * from finish();
rollback;
