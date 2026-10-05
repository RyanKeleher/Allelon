-- Prayer requests, audiences, responses, and "I prayed".
--
-- The single source of truth for who may read a request is
-- private.can_view_request(). Every policy that touches request content
-- (requests, audiences, responses, prayers, photos) calls it.

create type public.request_kind as enum ('request', 'moment');
create type public.request_status as enum ('open', 'answered');
create type public.audience_type as enum ('followers', 'close_friends', 'group', 'world');

create table public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- What other people may know about the author: null for anonymous posts.
  -- author_id itself is not selectable by clients (see grants below).
  author_public_id uuid generated always as (case when is_anonymous then null else author_id end) stored,
  kind public.request_kind not null default 'request',
  moment_label text check (char_length(moment_label) <= 30),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  photo_path text,
  passion_id text references public.passions (id),
  status public.request_status not null default 'open',
  answered_at timestamptz,
  answered_update text check (char_length(answered_update) <= 4000),
  is_anonymous boolean not null default false,
  country_code char(2) references public.countries (code),
  language text,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'request' or status = 'open'),
  check ((status = 'answered') = (answered_at is not null)),
  check (kind = 'moment' or moment_label is null)
);
create index prayer_requests_author_idx on public.prayer_requests (author_id, created_at desc);
create index prayer_requests_created_idx on public.prayer_requests (created_at desc);
create index prayer_requests_country_idx on public.prayer_requests (country_code, created_at desc);

create trigger prayer_requests_updated_at
  before update on public.prayer_requests
  for each row execute function private.set_updated_at();

create table public.prayer_audiences (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  audience_type public.audience_type not null,
  group_id uuid references public.groups (id) on delete cascade,
  check ((audience_type = 'group') = (group_id is not null))
);
create unique index prayer_audiences_unique_idx
  on public.prayer_audiences (request_id, audience_type, coalesce(group_id, '00000000-0000-0000-0000-000000000000'));
create index prayer_audiences_group_idx on public.prayer_audiences (group_id) where group_id is not null;
create index prayer_audiences_world_idx on public.prayer_audiences (request_id) where audience_type = 'world';

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  is_private boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);
create index responses_request_idx on public.responses (request_id, created_at);

-- "I prayed": at most one row per person, request, and day.
create table public.prayers (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  prayed_on date not null default current_date,
  prayed_at timestamptz not null default now(),
  unique (request_id, user_id, prayed_on)
);
create index prayers_user_idx on public.prayers (user_id, prayed_at desc);

-- ---------------------------------------------------------------------------
-- Visibility
-- ---------------------------------------------------------------------------

-- A viewer can read a request if they wrote it, or if it is not hidden, no
-- block stands between them, and at least one audience admits them:
--   followers      -> viewer is an accepted follower of the author
--   close_friends  -> viewer is on the author's close friends list
--   group          -> viewer is a member of that group
--   world          -> everyone signed in
create function private.can_view_request(req_id uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select viewer is not null and exists (
    select 1
    from public.prayer_requests r
    where r.id = req_id
      and (
        r.author_id = viewer
        or (
          r.hidden_at is null
          and not private.is_blocked_between(r.author_id, viewer)
          and exists (
            select 1
            from public.prayer_audiences a
            where a.request_id = r.id
              and (
                a.audience_type = 'world'
                or (a.audience_type = 'followers' and private.is_accepted_follower(viewer, r.author_id))
                or (a.audience_type = 'close_friends' and private.is_close_friend(r.author_id, viewer))
                or (a.audience_type = 'group' and private.is_group_member(a.group_id, viewer))
              )
          )
        )
      )
  );
$$;

create function private.request_author(req_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select author_id from public.prayer_requests where id = req_id;
$$;

-- ---------------------------------------------------------------------------
-- Privileges and policies
-- ---------------------------------------------------------------------------

alter table public.prayer_requests enable row level security;
alter table public.prayer_audiences enable row level security;
alter table public.responses enable row level security;
alter table public.prayers enable row level security;

revoke all on public.prayer_requests, public.prayer_audiences, public.responses, public.prayers
  from anon, authenticated;

-- Requests are created only through create_prayer_request() so the request and
-- its audiences are written atomically and validated together.
-- author_id is deliberately not selectable; clients use author_public_id.
grant select (
  id, author_public_id, kind, moment_label, body, photo_path, passion_id, status,
  answered_at, answered_update, is_anonymous, country_code, language, hidden_at,
  created_at, updated_at
) on public.prayer_requests to authenticated;
grant update (body, passion_id, moment_label) on public.prayer_requests to authenticated;
grant delete on public.prayer_requests to authenticated;

create policy "visible requests are readable" on public.prayer_requests
  for select to authenticated
  using (private.can_view_request(id, auth.uid()));
create policy "authors edit their requests" on public.prayer_requests
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy "authors delete their requests" on public.prayer_requests
  for delete to authenticated
  using (author_id = auth.uid());

-- Audiences: the author sees all of them. Other viewers see the non-group
-- audiences of requests they can read, and only the groups they belong to
-- (so a request never reveals which other groups its author is in).
grant select on public.prayer_audiences to authenticated;

create policy "audiences readable by permitted viewers" on public.prayer_audiences
  for select to authenticated
  using (
    private.request_author(request_id) = auth.uid()
    or (
      private.can_view_request(request_id, auth.uid())
      and (audience_type <> 'group' or private.is_group_member(group_id, auth.uid()))
    )
  );

-- Responses: public ones are readable by anyone who can read the request;
-- private ones only by their sender and the request's author. Responses from
-- people on either side of a block are not shown.
grant select (id, request_id, author_id, body, is_private, created_at) on public.responses to authenticated;
grant insert (request_id, body, is_private) on public.responses to authenticated;
grant delete on public.responses to authenticated;

create policy "responses readable by permitted viewers" on public.responses
  for select to authenticated
  using (
    hidden_at is null
    and private.can_view_request(request_id, auth.uid())
    and not private.is_blocked_between(author_id, auth.uid())
    and (
      not is_private
      or author_id = auth.uid()
      or private.request_author(request_id) = auth.uid()
    )
  );
create policy "viewers respond to visible requests" on public.responses
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and private.can_view_request(request_id, auth.uid())
    and not private.is_blocked_between(private.request_author(request_id), auth.uid())
  );
create policy "senders delete their responses" on public.responses
  for delete to authenticated
  using (author_id = auth.uid());

-- Prayers: each person sees their own taps; the request's author sees who
-- prayed (encouragement for them, never a public tally).
grant select (id, request_id, user_id, prayed_on, prayed_at) on public.prayers to authenticated;
grant insert (request_id) on public.prayers to authenticated;

create policy "prayers readable by self and author" on public.prayers
  for select to authenticated
  using (user_id = auth.uid() or private.request_author(request_id) = auth.uid());
create policy "viewers pray for visible requests" on public.prayers
  for insert to authenticated
  with check (user_id = auth.uid() and private.can_view_request(request_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- Creating a request
-- ---------------------------------------------------------------------------

-- p_audiences holds any of 'followers', 'close_friends', 'world'; groups are
-- passed separately in p_group_ids. Anonymity is allowed only for posts shared
-- with the World and nobody else.
create function public.create_prayer_request(
  p_body text,
  p_audiences text[] default array['followers'],
  p_group_ids uuid[] default '{}',
  p_kind public.request_kind default 'request',
  p_moment_label text default null,
  p_passion_id text default null,
  p_photo_path text default null,
  p_is_anonymous boolean default false,
  p_country_code char(2) default null,
  p_language text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  req_id uuid;
  aud text;
  gid uuid;
  has_world boolean := 'world' = any(coalesce(p_audiences, '{}'));
  profile public.profiles;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  p_group_ids := coalesce(p_group_ids, '{}');
  p_audiences := coalesce(p_audiences, '{}');

  if cardinality(p_audiences) + cardinality(p_group_ids) = 0 then
    raise exception 'choose at least one audience' using errcode = '22023';
  end if;

  foreach aud in array p_audiences loop
    if aud not in ('followers', 'close_friends', 'world') then
      raise exception 'unknown audience %', aud using errcode = '22023';
    end if;
  end loop;

  foreach gid in array p_group_ids loop
    if not private.is_group_member(gid, uid) then
      raise exception 'not a member of group %', gid using errcode = '42501';
    end if;
  end loop;

  if p_is_anonymous and (not has_world or cardinality(p_audiences) <> 1 or cardinality(p_group_ids) <> 0) then
    raise exception 'anonymous posts must be shared with the World only' using errcode = '22023';
  end if;

  if p_photo_path is not null and split_part(p_photo_path, '/', 1) <> uid::text then
    raise exception 'photo must be uploaded to your own folder' using errcode = '42501';
  end if;

  select * into profile from public.profiles where id = uid;

  insert into public.prayer_requests (
    author_id, kind, moment_label, body, photo_path, passion_id, is_anonymous, country_code, language
  ) values (
    uid,
    coalesce(p_kind, 'request'),
    case when p_kind = 'moment' then nullif(btrim(p_moment_label), '') end,
    btrim(p_body),
    p_photo_path,
    p_passion_id,
    coalesce(p_is_anonymous, false),
    case when has_world then coalesce(p_country_code, profile.country_code) end,
    coalesce(p_language, profile.preferred_language)
  )
  returning id into req_id;

  insert into public.prayer_audiences (request_id, audience_type)
  select req_id, a::public.audience_type from (select distinct unnest(p_audiences) as a) s;

  insert into public.prayer_audiences (request_id, audience_type, group_id)
  select req_id, 'group', g from (select distinct unnest(p_group_ids) as g) s;

  return req_id;
end;
$$;

revoke execute on function public.create_prayer_request from public, anon;
grant execute on function public.create_prayer_request to authenticated;

-- ---------------------------------------------------------------------------
-- Card view and feeds
-- ---------------------------------------------------------------------------

create function private.is_my_request(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.prayer_requests where id = req_id and author_id = auth.uid());
$$;

-- Everything a request card needs, in one row. security_invoker means every
-- table underneath is read with the caller's RLS, so this view can never show
-- more than the caller could read directly.
create view public.request_cards
with (security_invoker = true)
as
select
  r.id,
  r.author_public_id as author_id,
  p.display_name as author_name,
  p.handle as author_handle,
  p.avatar_url as author_avatar_url,
  r.kind,
  r.moment_label,
  r.body,
  r.photo_path,
  r.passion_id,
  r.status,
  r.answered_at,
  r.answered_update,
  r.is_anonymous,
  r.country_code,
  r.language,
  r.created_at,
  mine.is_mine,
  coalesce((
    select jsonb_agg(jsonb_build_object('type', a.audience_type, 'group_id', a.group_id, 'group_name', g.name)
                     order by a.audience_type, g.name)
    from public.prayer_audiences a
    left join public.groups g on g.id = a.group_id
    where a.request_id = r.id
  ), '[]'::jsonb) as audiences,
  exists (
    select 1 from public.prayers pr where pr.request_id = r.id and pr.user_id = auth.uid()
  ) as prayed_by_me,
  -- Only the author gets a count; for anyone else it is null.
  case when mine.is_mine then (select count(*) from public.prayers pr where pr.request_id = r.id) end as prayer_count,
  (select count(*) from public.responses rs where rs.request_id = r.id) as response_count
from public.prayer_requests r
cross join lateral (select private.is_my_request(r.id) as is_mine) mine
left join public.profiles p on p.id = r.author_public_id;

revoke all on public.request_cards from anon, authenticated;
grant select on public.request_cards to authenticated;

-- Home: requests visible to me from people I follow (and my own), newest first.
-- Keyset pagination on created_at; the client stops when a page comes back short.
create function public.home_feed(p_before timestamptz default null, p_limit int default 20)
returns setof public.request_cards
language sql
stable
security invoker
set search_path = ''
as $$
  select c.*
  from public.request_cards c
  where (p_before is null or c.created_at < p_before)
    and (
      c.is_mine
      or c.author_id in (
        select f.followee_id from public.follows f
        where f.follower_id = auth.uid() and f.status = 'accepted'
      )
    )
  order by c.created_at desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

revoke execute on function public.home_feed from public, anon;
grant execute on function public.home_feed to authenticated;

grant execute on all functions in schema private to authenticated;
