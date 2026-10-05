-- Storage buckets.
--
-- request-photos: private. Uploads go to "<user id>/<file>". A photo is
-- readable by its uploader and by anyone who can read a request that uses it.
-- avatars: public read, users write only inside their own folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('request-photos', 'request-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
on conflict (id) do nothing;

create function private.can_view_photo(object_name text, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.prayer_requests r
    where r.photo_path = object_name
      and private.can_view_request(r.id, viewer)
  );
$$;

grant execute on function private.can_view_photo to authenticated;

create policy "users upload request photos to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'request-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "request photos readable by permitted viewers" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'request-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or private.can_view_photo(name, auth.uid())
    )
  );

create policy "users delete own request photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'request-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users manage own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users replace own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
