-- Shared helpers for pgTAP tests, included by each test file with \ir.
-- Everything here is created inside the test's transaction and rolled back.

create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to authenticated;

-- Create an auth user (the on_auth_user_created trigger makes the profile).
create or replace function tests.create_user(uid uuid, name text)
returns uuid
language sql
as $$
  insert into auth.users (id, email, aud, role, raw_user_meta_data)
  values (uid, lower(name) || '@example.test', 'authenticated', 'authenticated',
          jsonb_build_object('full_name', name));
  select uid;
$$;

-- Act as a signed-in user for the statements that follow (until `reset role`).
create or replace function tests.as_user(uid uuid)
returns void
language sql
as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;

-- Ids of requests the current role can see, as a sorted array.
create or replace function tests.visible_requests()
returns uuid[]
language sql
as $$
  select coalesce(array_agg(id order by id), '{}') from public.prayer_requests;
$$;

grant execute on all functions in schema tests to authenticated;
