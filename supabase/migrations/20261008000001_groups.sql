-- Phase 2: prayer groups with invite codes and admin-approved joining,
-- group feeds, realtime, and the "prayed together" history on profiles.
--
-- Membership only ever changes through the RPCs below, so every rule
-- (who may invite, who may approve, what happens when the last admin leaves)
-- lives in one place and is covered by supabase/tests/groups.test.sql.

create function private.is_group_admin(gid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members where group_id = gid and user_id = uid and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Invites and join requests
-- ---------------------------------------------------------------------------

-- Short, unambiguous codes (no 0/O, 1/I/L) that are easy to read aloud.
create function private.new_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes bytea := extensions.gen_random_bytes(8);
  code text := '';
begin
  for i in 0..7 loop
    code := code || substr(alphabet, 1 + (get_byte(bytes, i) % length(alphabet)), 1);
  end loop;
  return code;
end;
$$;

create table public.group_invites (
  code text primary key default private.new_invite_code(),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
create index group_invites_group_idx on public.group_invites (group_id);

create table public.group_join_requests (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  invite_code text references public.group_invites (code) on delete set null,
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

alter table public.group_invites enable row level security;
alter table public.group_join_requests enable row level security;
revoke all on public.group_invites, public.group_join_requests from anon, authenticated;

-- Admins see their groups' invite codes; members don't need them.
grant select on public.group_invites to authenticated;
create policy "admins read invites" on public.group_invites
  for select to authenticated using (private.is_group_admin(group_id, auth.uid()));

-- Requesters see their own pending requests; admins see requests to their groups.
grant select on public.group_join_requests to authenticated;
create policy "requester and admins read join requests" on public.group_join_requests
  for select to authenticated
  using (user_id = auth.uid() or private.is_group_admin(group_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- Group RPCs
-- ---------------------------------------------------------------------------

create function public.create_group(p_name text, p_icon text default null, p_description text default '')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  insert into public.groups (name, icon, description, created_by)
  values (btrim(p_name), coalesce(nullif(btrim(p_icon), ''), U&'\+01F64F'), coalesce(btrim(p_description), ''), uid)
  returning id into gid;
  insert into public.group_members (group_id, user_id, role) values (gid, uid, 'admin');
  return gid;
end;
$$;

-- Returns the group's active invite code, creating one if needed. Admins only.
create function public.group_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c text;
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can invite' using errcode = '42501';
  end if;
  select code into c from public.group_invites
  where group_id = p_group_id and revoked_at is null
  order by created_at desc limit 1;
  if c is null then
    insert into public.group_invites (group_id, created_by) values (p_group_id, auth.uid()) returning code into c;
  end if;
  return c;
end;
$$;

-- Revokes all current codes and issues a fresh one (e.g. if a link was shared too widely).
create function public.reset_group_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can reset the invite' using errcode = '42501';
  end if;
  update public.group_invites set revoked_at = now() where group_id = p_group_id and revoked_at is null;
  return public.group_invite_code(p_group_id);
end;
$$;

-- What someone holding an invite code may see before joining: the group's
-- name, icon, description and size, plus where they stand. Never the members
-- or the prayer list.
create function public.group_for_invite(p_code text)
returns table (
  group_id uuid,
  name text,
  icon text,
  description text,
  member_count int,
  is_member boolean,
  has_pending_request boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.icon, g.description,
         (select count(*)::int from public.group_members m where m.group_id = g.id),
         private.is_group_member(g.id, auth.uid()),
         exists (select 1 from public.group_join_requests r where r.group_id = g.id and r.user_id = auth.uid())
  from public.group_invites i
  join public.groups g on g.id = i.group_id
  where i.code = upper(btrim(p_code)) and i.revoked_at is null and auth.uid() is not null;
$$;

create function public.request_to_join_group(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  inv public.group_invites;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select * into inv from public.group_invites where code = upper(btrim(p_code)) and revoked_at is null;
  if inv.code is null then
    raise exception 'that invite code is not valid' using errcode = 'P0002';
  end if;
  if private.is_group_member(inv.group_id, uid) then
    return inv.group_id;
  end if;
  insert into public.group_join_requests (group_id, user_id, invite_code)
  values (inv.group_id, uid, inv.code)
  on conflict (group_id, user_id) do nothing;
  return inv.group_id;
end;
$$;

create function public.respond_to_join_request(p_group_id uuid, p_user_id uuid, p_approve boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can approve members' using errcode = '42501';
  end if;
  delete from public.group_join_requests where group_id = p_group_id and user_id = p_user_id;
  if not found then
    raise exception 'no pending request' using errcode = 'P0002';
  end if;
  if p_approve then
    insert into public.group_members (group_id, user_id, role)
    values (p_group_id, p_user_id, 'member')
    on conflict do nothing;
  end if;
end;
$$;

create function public.cancel_join_request(p_group_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.group_join_requests where group_id = p_group_id and user_id = auth.uid();
$$;

-- Keeps a group from being left without an admin: if the last admin leaves or
-- is removed, the longest-standing member becomes admin; an empty group is deleted.
create function private.ensure_group_has_admin(gid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.group_members where group_id = gid) then
    delete from public.groups where id = gid;
  elsif not exists (select 1 from public.group_members where group_id = gid and role = 'admin') then
    update public.group_members set role = 'admin'
    where (group_id, user_id) = (
      select group_id, user_id from public.group_members
      where group_id = gid order by joined_at, user_id limit 1
    );
  end if;
end;
$$;

create function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.group_members where group_id = p_group_id and user_id = auth.uid();
  perform private.ensure_group_has_admin(p_group_id);
end;
$$;

create function public.remove_group_member(p_group_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can remove members' using errcode = '42501';
  end if;
  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
  perform private.ensure_group_has_admin(p_group_id);
end;
$$;

create function public.set_group_member_role(p_group_id uuid, p_user_id uuid, p_role public.group_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can change roles' using errcode = '42501';
  end if;
  update public.group_members set role = p_role where group_id = p_group_id and user_id = p_user_id;
  perform private.ensure_group_has_admin(p_group_id);
end;
$$;

create function public.update_group(p_group_id uuid, p_name text, p_icon text, p_description text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_group_admin(p_group_id, auth.uid()) then
    raise exception 'only group admins can edit the group' using errcode = '42501';
  end if;
  update public.groups
  set name = btrim(p_name),
      icon = coalesce(nullif(btrim(p_icon), ''), icon),
      description = coalesce(btrim(p_description), '')
  where id = p_group_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Feeds
-- ---------------------------------------------------------------------------

-- A group's shared prayer list. security invoker: RLS on request_cards and
-- its tables decides visibility, so a non-member gets nothing.
create function public.group_feed(p_group_id uuid, p_before timestamptz default null, p_limit int default 30)
returns setof public.request_cards
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.request_cards c
  where exists (
      select 1 from public.prayer_audiences a
      where a.request_id = c.id and a.audience_type = 'group' and a.group_id = p_group_id
    )
    and (p_before is null or c.created_at < p_before)
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
$$;

-- Requests by another person that I have prayed for, newest first: the
-- "what we've prayed through together" thread on their profile.
create function public.prayed_together(p_person uuid)
returns setof public.request_cards
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.request_cards c
  where c.author_id = p_person
    and c.id in (select p.request_id from public.prayers p where p.user_id = auth.uid())
  order by c.created_at desc
  limit 50;
$$;

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'create_group(text, text, text)',
    'group_invite_code(uuid)',
    'reset_group_invite_code(uuid)',
    'group_for_invite(text)',
    'request_to_join_group(text)',
    'respond_to_join_request(uuid, uuid, boolean)',
    'cancel_join_request(uuid)',
    'leave_group(uuid)',
    'remove_group_member(uuid, uuid)',
    'set_group_member_role(uuid, uuid, public.group_role)',
    'update_group(uuid, text, text, text)',
    'group_feed(uuid, timestamptz, int)',
    'prayed_together(uuid)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;

grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

-- Group screens listen for new audience rows (a request shared to the group)
-- and responses. Realtime applies RLS before delivering a change, so people
-- only hear about rows they could read. prayer_requests itself is not
-- published: its author_id column is deliberately unreadable by clients.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.prayer_audiences, public.responses, public.group_join_requests;
  end if;
end;
$$;
