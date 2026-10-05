-- Allelon core schema: lookups, profiles, follows, blocks, close friends, groups.
--
-- Conventions
--   * Every table has RLS enabled. Privileges are revoked from anon/authenticated
--     and granted back explicitly (per column where it matters), so a table is
--     closed unless this file opens it.
--   * Helper functions that policies depend on live in the `private` schema,
--     which PostgREST does not expose. They are SECURITY DEFINER so policies
--     can consult other RLS-protected tables without recursion.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Lookups
-- ---------------------------------------------------------------------------

create table public.countries (
  code char(2) primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  lat double precision,
  lng double precision
);

create table public.passions (
  id text primary key,
  label text not null,
  icon text not null,
  sort_order int not null default 0
);

alter table public.countries enable row level security;
alter table public.passions enable row level security;
revoke all on public.countries, public.passions from anon, authenticated;
grant select on public.countries, public.passions to anon, authenticated;
create policy "lookups are public" on public.countries for select using (true);
create policy "lookups are public" on public.passions for select using (true);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  handle text unique check (handle ~ '^[a-z0-9_]{3,24}$'),
  avatar_url text,
  country_code char(2) references public.countries (code),
  preferred_language text not null default 'en' check (preferred_language ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$'),
  bio text not null default '' check (char_length(bio) <= 280),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Create a profile row for every new auth user.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Blocks
-- ---------------------------------------------------------------------------

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index blocks_blocked_idx on public.blocks (blocked_id);

create function private.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b)
       or (blocker_id = b and blocked_id = a)
  );
$$;

-- ---------------------------------------------------------------------------
-- Follows (approval required: rows start pending, the followee accepts)
-- ---------------------------------------------------------------------------

create type public.follow_status as enum ('pending', 'accepted');

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  status public.follow_status not null default 'pending',
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index follows_followee_idx on public.follows (followee_id, status);

create function private.is_accepted_follower(viewer uuid, author uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.follows
    where follower_id = viewer and followee_id = author and status = 'accepted'
  );
$$;

create function private.follows_set_accepted_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    new.accepted_at := now();
  elsif new.status <> 'accepted' then
    new.accepted_at := null;
  end if;
  return new;
end;
$$;

create trigger follows_accepted_at
  before update of status on public.follows
  for each row execute function private.follows_set_accepted_at();

-- ---------------------------------------------------------------------------
-- Close friends (private list curated by the owner from accepted followers)
-- ---------------------------------------------------------------------------

create table public.close_friends (
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, friend_id),
  check (owner_id <> friend_id)
);

create function private.is_close_friend(owner uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.close_friends where owner_id = owner and friend_id = viewer
  );
$$;

-- Someone who stops being an accepted follower leaves the close friends list.
create function private.prune_close_friends_on_follow_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.close_friends where owner_id = old.followee_id and friend_id = old.follower_id;
    return old;
  end if;
  if new.status <> 'accepted' then
    delete from public.close_friends where owner_id = new.followee_id and friend_id = new.follower_id;
  end if;
  return new;
end;
$$;

create trigger follows_prune_close_friends
  after update of status or delete on public.follows
  for each row execute function private.prune_close_friends_on_follow_change();

-- Blocking severs follows and close-friend links in both directions.
create function private.sever_on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and followee_id = new.blocked_id)
     or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  delete from public.close_friends
  where (owner_id = new.blocker_id and friend_id = new.blocked_id)
     or (owner_id = new.blocked_id and friend_id = new.blocker_id);
  return new;
end;
$$;

create trigger blocks_sever
  after insert on public.blocks
  for each row execute function private.sever_on_block();

-- ---------------------------------------------------------------------------
-- Prayer groups (Phase 1 creates the tables so visibility is complete and
-- tested from day one; group management UI and RPCs arrive in Phase 2)
-- ---------------------------------------------------------------------------

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 280),
  icon text not null default '🙏',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create type public.group_role as enum ('admin', 'member');

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create function private.is_group_member(gid uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.group_members where group_id = gid and user_id = uid);
$$;

-- ---------------------------------------------------------------------------
-- Privileges and policies
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.blocks enable row level security;
alter table public.follows enable row level security;
alter table public.close_friends enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

revoke all on public.profiles, public.blocks, public.follows, public.close_friends,
  public.groups, public.group_members from anon, authenticated;

-- Profiles: any signed-in user can find people (to follow them) unless a block
-- stands between them. Users edit only their own row and only these columns.
grant select on public.profiles to authenticated;
grant update (display_name, handle, avatar_url, country_code, preferred_language, bio, onboarded_at)
  on public.profiles to authenticated;

create policy "profiles readable unless blocked" on public.profiles
  for select to authenticated
  using (id = auth.uid() or not private.is_blocked_between(id, auth.uid()));

create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Blocks: only the blocker sees or manages their blocks.
grant select, delete on public.blocks to authenticated;
grant insert (blocked_id) on public.blocks to authenticated;

create policy "blocker reads own blocks" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());
create policy "blocker creates blocks" on public.blocks
  for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocker removes blocks" on public.blocks
  for delete to authenticated using (blocker_id = auth.uid());

-- Follows: both parties can see the edge. Requests are created pending (status
-- is not insertable); only the followee can accept; either party can remove it.
grant select, delete on public.follows to authenticated;
grant insert (followee_id) on public.follows to authenticated;
grant update (status) on public.follows to authenticated;

create policy "participants read follows" on public.follows
  for select to authenticated
  using (auth.uid() in (follower_id, followee_id));
create policy "users request to follow" on public.follows
  for insert to authenticated
  with check (
    follower_id = auth.uid()
    and status = 'pending'
    and not private.is_blocked_between(follower_id, followee_id)
  );
create policy "followee answers follow requests" on public.follows
  for update to authenticated
  using (followee_id = auth.uid())
  with check (followee_id = auth.uid());
create policy "participants remove follows" on public.follows
  for delete to authenticated
  using (auth.uid() in (follower_id, followee_id));

-- Close friends: visible to and managed by the owner only. Members must be
-- accepted followers of the owner.
grant select, delete on public.close_friends to authenticated;
grant insert (friend_id) on public.close_friends to authenticated;

create policy "owner reads close friends" on public.close_friends
  for select to authenticated using (owner_id = auth.uid());
create policy "owner adds close friends from followers" on public.close_friends
  for insert to authenticated
  with check (owner_id = auth.uid() and private.is_accepted_follower(friend_id, owner_id));
create policy "owner removes close friends" on public.close_friends
  for delete to authenticated using (owner_id = auth.uid());

-- Groups: members can see the group and its member list. Creation, invites,
-- and membership changes arrive with Phase 2 RPCs.
grant select on public.groups, public.group_members to authenticated;

create policy "members read group" on public.groups
  for select to authenticated using (private.is_group_member(id, auth.uid()));
create policy "members read membership" on public.group_members
  for select to authenticated using (private.is_group_member(group_id, auth.uid()));

grant execute on all functions in schema private to authenticated;
