insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "media_public_read" on storage.objects for select
  using (bucket_id = 'media');
create policy "media_authenticated_upload" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "media_owner_delete" on storage.objects for delete
  using (bucket_id = 'media' and auth.uid() = owner);
