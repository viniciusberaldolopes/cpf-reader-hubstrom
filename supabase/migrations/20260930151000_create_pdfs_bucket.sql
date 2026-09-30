-- O Supabase é usado somente para armazenar os PDFs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pdfs', 'pdfs', true, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Upload publico de PDFs" on storage.objects;
create policy "Upload publico de PDFs"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'pdfs');

drop policy if exists "Rollback de PDFs" on storage.objects;
create policy "Rollback de PDFs"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'pdfs');
