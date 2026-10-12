-- Phase 4: answered prayer, notifications, gentle check-ins, push delivery,
-- reports and moderation, and Grow content.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------------
-- Preferences and roles on profiles
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column checkins_enabled boolean not null default true,
  add column checkin_after_days int not null default 3 check (checkin_after_days between 1 and 14),
  add column push_enabled boolean not null default true,
  -- Moderators can review reports and hide content. Not client-writable.
  add column is_moderator boolean not null default false;

grant update (checkins_enabled, checkin_after_days, push_enabled) on public.profiles to authenticated;

create function private.is_moderator(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_moderator from public.profiles where id = uid), false);
$$;

-- ---------------------------------------------------------------------------
-- Notifications (in-app inbox; push is a separate delivery step)
-- ---------------------------------------------------------------------------

create type public.notification_kind as enum ('answered', 'response', 'checkin', 'follow_request', 'join_request');

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  actor_id uuid references public.profiles (id) on delete cascade,
  request_id uuid references public.prayer_requests (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  pushed_at timestamptz
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unpushed_idx on public.notifications (created_at) where pushed_at is null;

alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- People only see their own notifications, and never about requests they can
-- no longer see (e.g. after being removed from a group or blocked).
create policy "own notifications" on public.notifications
  for select to authenticated
  using (
    user_id = auth.uid()
    and (request_id is null or private.can_view_request(request_id, auth.uid()))
    and (actor_id is null or not private.is_blocked_between(actor_id, auth.uid()))
  );
create policy "mark own notifications read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dismiss own notifications" on public.notifications
  for delete to authenticated using (user_id = auth.uid());

-- Someone responded to my request (not my own replies; private responses too,
-- since the author is always allowed to read them).
create function private.notify_on_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author uuid := private.request_author(new.request_id);
begin
  if author is not null and author <> new.author_id then
    insert into public.notifications (user_id, kind, actor_id, request_id)
    values (author, 'response', new.author_id, new.request_id);
  end if;
  return new;
end;
$$;
create trigger responses_notify after insert on public.responses
  for each row execute function private.notify_on_response();

create function private.notify_on_follow_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending' then
    insert into public.notifications (user_id, kind, actor_id)
    values (new.followee_id, 'follow_request', new.follower_id);
  end if;
  return new;
end;
$$;
create trigger follows_notify after insert on public.follows
  for each row execute function private.notify_on_follow_request();

create function private.notify_on_join_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (user_id, kind, actor_id, group_id)
  select m.user_id, 'join_request', new.user_id, new.group_id
  from public.group_members m
  where m.group_id = new.group_id and m.role = 'admin';
  return new;
end;
$$;
create trigger join_requests_notify after insert on public.group_join_requests
  for each row execute function private.notify_on_join_request();

-- ---------------------------------------------------------------------------
-- Answered prayer
-- ---------------------------------------------------------------------------

-- Marks one of my requests answered (or edits the update). Everyone who prayed
-- for it and can still see it is told once.
create function public.mark_request_answered(p_request_id uuid, p_update text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.prayer_requests;
begin
  select * into r from public.prayer_requests where id = p_request_id;
  if r.id is null or r.author_id <> auth.uid() then
    raise exception 'only the author can mark a request answered' using errcode = '42501';
  end if;
  if r.kind <> 'request' then
    raise exception 'only prayer requests can be marked answered' using errcode = '22023';
  end if;

  update public.prayer_requests
  set status = 'answered',
      answered_at = coalesce(answered_at, now()),
      answered_update = nullif(btrim(coalesce(p_update, '')), '')
  where id = p_request_id;

  if r.status = 'open' then
    insert into public.notifications (user_id, kind, actor_id, request_id)
    -- author_public_id is null for anonymous requests, so the author stays anonymous.
    select distinct p.user_id, 'answered'::public.notification_kind, r.author_public_id, r.id
    from public.prayers p
    where p.request_id = r.id
      and p.user_id <> r.author_id
      and private.can_view_request(r.id, p.user_id);
    -- Pending check-ins for an answered request are no longer needed.
    delete from public.checkin_reminders where request_id = r.id and sent_at is null;
  end if;
end;
$$;

-- Reopens a request marked answered by mistake.
create function public.reopen_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.prayer_requests
  set status = 'open', answered_at = null, answered_update = null
  where id = p_request_id and author_id = auth.uid();
  if not found then
    raise exception 'only the author can reopen a request' using errcode = '42501';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Gentle check-ins
-- ---------------------------------------------------------------------------

-- After I pray for someone's request, an optional reminder N days later
-- nudges me to check in with them. One per person and request.
create table public.checkin_reminders (
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_id uuid not null references public.prayer_requests (id) on delete cascade,
  due_at timestamptz not null,
  sent_at timestamptz,
  primary key (user_id, request_id)
);
create index checkin_reminders_due_idx on public.checkin_reminders (due_at) where sent_at is null;

alter table public.checkin_reminders enable row level security;
revoke all on public.checkin_reminders from anon, authenticated;

create function private.schedule_checkin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  prefs public.profiles;
begin
  select * into prefs from public.profiles where id = new.user_id;
  if prefs.checkins_enabled and private.request_author(new.request_id) <> new.user_id then
    insert into public.checkin_reminders (user_id, request_id, due_at)
    values (new.user_id, new.request_id, now() + make_interval(days => prefs.checkin_after_days))
    on conflict (user_id, request_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger prayers_schedule_checkin after insert on public.prayers
  for each row execute function private.schedule_checkin();

-- Turns due reminders into notifications, but only for open requests the
-- person can still see and only if they still want check-ins.
create function private.send_due_checkins()
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  with due as (
    update public.checkin_reminders c
    set sent_at = now()
    where c.sent_at is null and c.due_at <= now()
    returning c.user_id, c.request_id
  )
  insert into public.notifications (user_id, kind, actor_id, request_id)
  select d.user_id, 'checkin', r.author_public_id, d.request_id
  from due d
  join public.prayer_requests r on r.id = d.request_id
  join public.profiles p on p.id = d.user_id
  where r.status = 'open'
    and p.checkins_enabled
    and private.can_view_request(d.request_id, d.user_id);
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Push tokens and delivery
-- ---------------------------------------------------------------------------

create table public.push_tokens (
  token text primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from anon, authenticated;
grant select, delete on public.push_tokens to authenticated;
grant insert (token, platform), update (platform, updated_at) on public.push_tokens to authenticated;

create policy "own push tokens" on public.push_tokens
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- A device that changes hands moves its token to the new account.
create function public.register_push_token(p_token text, p_platform text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (p_token, auth.uid(), p_platform, now())
  on conflict (token) do update set user_id = auth.uid(), platform = excluded.platform, updated_at = now();
$$;

-- Every minute: queue due check-ins, then ask the send-push Edge Function to
-- deliver anything not yet pushed. The function URL and service key come from
-- Vault (see README: "Push notifications"); without them only the in-app
-- inbox is used.
create function private.dispatch_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_url text;
  service_key text;
begin
  perform private.send_due_checkins();
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or service_key is null then
    return;
  end if;
  if exists (select 1 from public.notifications where pushed_at is null and created_at > now() - interval '1 day') then
    perform net.http_post(
      url := base_url || '/functions/v1/send-push',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || service_key),
      body := '{}'::jsonb
    );
  end if;
end;
$$;

select cron.schedule('allelon-dispatch-notifications', '* * * * *', $$select private.dispatch_notifications()$$);

-- ---------------------------------------------------------------------------
-- Reports and moderation
-- ---------------------------------------------------------------------------

create type public.report_target as enum ('request', 'response', 'profile');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'harassment', 'hate', 'self_harm', 'sexual', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_open_idx on public.reports (created_at) where status = 'open';

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (target_type, target_id, reason, details) on public.reports to authenticated;

create policy "reporters see own reports, moderators see all" on public.reports
  for select to authenticated
  using (reporter_id = auth.uid() or private.is_moderator(auth.uid()));
create policy "anyone signed in can report" on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

-- Moderator queue with the reported content inline. Moderators may read
-- reported content even where visibility rules would otherwise hide it.
create function public.moderation_queue()
returns table (
  report_id bigint,
  target_type public.report_target,
  target_id uuid,
  reason text,
  details text,
  report_count bigint,
  content text,
  content_author uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator(auth.uid()) then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  return query
  select min(rp.id), rp.target_type, rp.target_id, min(rp.reason), string_agg(nullif(rp.details, ''), ' / '),
         count(*), coalesce(pr.body, rs.body, pf.display_name || ' (@' || coalesce(pf.handle, '') || ') ' || pf.bio),
         coalesce(pr.author_id, rs.author_id, pf.id), min(rp.created_at)
  from public.reports rp
  left join public.prayer_requests pr on rp.target_type = 'request' and pr.id = rp.target_id
  left join public.responses rs on rp.target_type = 'response' and rs.id = rp.target_id
  left join public.profiles pf on rp.target_type = 'profile' and pf.id = rp.target_id
  where rp.status = 'open'
  group by rp.target_type, rp.target_id, pr.body, rs.body, pf.display_name, pf.handle, pf.bio, pr.author_id, rs.author_id, pf.id
  order by count(*) desc, min(rp.created_at);
end;
$$;

-- action: 'hide' hides the request/response (profiles: hides all their World
-- posts); 'dismiss' closes the reports without action.
create function public.resolve_report(p_target_type public.report_target, p_target_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_moderator(auth.uid()) then
    raise exception 'moderators only' using errcode = '42501';
  end if;
  if p_action not in ('hide', 'dismiss') then
    raise exception 'unknown action' using errcode = '22023';
  end if;
  if p_action = 'hide' then
    if p_target_type = 'request' then
      update public.prayer_requests set hidden_at = now() where id = p_target_id;
    elsif p_target_type = 'response' then
      update public.responses set hidden_at = now() where id = p_target_id;
    else
      update public.prayer_requests r set hidden_at = now()
      where r.author_id = p_target_id
        and exists (select 1 from public.prayer_audiences a where a.request_id = r.id and a.audience_type = 'world');
    end if;
  end if;
  update public.reports
  set status = case when p_action = 'hide' then 'actioned' else 'dismissed' end::public.report_status,
      resolved_by = auth.uid(), resolved_at = now()
  where target_type = p_target_type and target_id = p_target_id and status = 'open';
end;
$$;

-- ---------------------------------------------------------------------------
-- Grow: curated resources (content is added in a separate migration)
-- ---------------------------------------------------------------------------

create type public.grow_kind as enum ('scripture', 'practice', 'link', 'video');

create table public.grow_items (
  id text primary key,
  kind public.grow_kind not null,
  title text not null,
  body text not null default '',
  reference text,
  source_name text not null,
  source_url text not null,
  sort_order int not null default 0
);

alter table public.grow_items enable row level security;
revoke all on public.grow_items from anon, authenticated;
grant select on public.grow_items to authenticated;
create policy "grow is readable" on public.grow_items for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Privileges for new RPCs
-- ---------------------------------------------------------------------------

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'mark_request_answered(uuid, text)',
    'reopen_request(uuid)',
    'register_push_token(text, text)',
    'moderation_queue()',
    'resolve_report(public.report_target, uuid, text)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
end;
$$;

-- Internal jobs are not callable by clients.
revoke execute on function private.send_due_checkins() from public, anon, authenticated;
revoke execute on function private.dispatch_notifications() from public, anon, authenticated;
