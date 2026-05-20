-- ============================================================
-- ArremataMarília — M2: app_settings + Storage buckets
-- ============================================================

-- Tabela de configurações da aplicação (key-value)
create table if not exists app_settings (
  key   text primary key,
  value text not null
);

-- Somente admins podem ler/alterar as configurações
alter table app_settings enable row level security;

create policy "app_settings_admin_all" on app_settings
  for all using (is_admin());

-- Valor padrão: auto-aprovação de verificações ativada
insert into app_settings (key, value)
values ('auto_approve_verifications', 'true')
on conflict (key) do nothing;

-- ============================================================
-- Storage buckets
-- Rode no painel Supabase Storage se ainda não existirem:
--
-- 1. Bucket "listing-photos" (público):
--    INSERT INTO storage.buckets (id, name, public)
--    VALUES ('listing-photos', 'listing-photos', true)
--    ON CONFLICT DO NOTHING;
--
-- 2. Bucket "identity-docs" (privado):
--    INSERT INTO storage.buckets (id, name, public)
--    VALUES ('identity-docs', 'identity-docs', false)
--    ON CONFLICT DO NOTHING;
-- ============================================================

-- Política de storage para identity-docs:
-- Usuário só pode fazer upload na própria pasta
-- Admin pode ler qualquer arquivo

-- Inserir buckets (pode falhar silenciosamente se já existirem)
insert into storage.buckets (id, name, public)
values ('identity-docs', 'identity-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

-- Políticas de storage para identity-docs
create policy "identity_docs_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'identity-docs' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "identity_docs_read_admin" on storage.objects
  for select using (
    bucket_id = 'identity-docs' and is_admin()
  );

-- Política de storage para listing-photos (leitura pública, upload autenticado)
create policy "listing_photos_read_public" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "listing_photos_upload_authenticated" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos' and auth.role() = 'authenticated'
  );

create policy "listing_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'listing-photos' and auth.uid()::text = owner
  );
