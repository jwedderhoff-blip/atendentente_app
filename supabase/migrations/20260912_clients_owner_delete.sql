-- ============================================================================
-- Dono pode gerenciar (inclusive excluir) os clientes do próprio estabelecimento
-- ============================================================================
-- A exclusão manual de clientes no painel precisa de uma policy de DELETE.
-- Esta policy também cobre select/update do dono. O public_insert (anon criando
-- cliente ao agendar) continua valendo em paralelo.
--
-- Rode no SQL Editor do Supabase.

drop policy if exists "owner_all" on clients;
create policy "owner_all" on clients for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
) with check (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
