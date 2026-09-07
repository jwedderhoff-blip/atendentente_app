-- Bucket público para imagens de capa dos estabelecimentos
insert into storage.buckets (id, name, public)
values ('establishment-covers', 'establishment-covers', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode visualizar (bucket público)
create policy "Public cover read"
  on storage.objects for select
  using (bucket_id = 'establishment-covers');

-- Autenticados podem fazer upload
create policy "Authenticated cover upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'establishment-covers');

-- Autenticados podem atualizar
create policy "Authenticated cover update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'establishment-covers');

-- Autenticados podem deletar
create policy "Authenticated cover delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'establishment-covers');
