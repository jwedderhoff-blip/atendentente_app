-- ============================================================================
-- Visualizador (professor) enxerga a situação financeira dos clientes (leitura)
-- ============================================================================
-- Complementa as policies member_read: o login visualizador acessa a tela de
-- Clientes e precisa ver matrículas e mensalidades (somente leitura). Escrever
-- (marcar pago/reabrir) continua sendo só do dono, pelas policies owner_all.
--
-- Rode este bloco no SQL Editor do Supabase.

drop policy if exists "member_read" on memberships;
create policy "member_read" on memberships for select using (is_member(establishment_id));

drop policy if exists "member_read" on membership_charges;
create policy "member_read" on membership_charges for select using (is_member(establishment_id));
