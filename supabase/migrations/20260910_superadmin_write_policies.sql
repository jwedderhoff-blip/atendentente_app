-- ============================================================================
-- Permissões de escrita do Super Admin
-- ============================================================================
-- Problema: as tabelas abaixo só tinham policy "owner_all" (owner_id = auth.uid()).
-- O super admin não é dono dos estabelecimentos dos outros, então as telas de
-- /superadmin abriam normalmente (leitura é pública) mas os UPDATEs afetavam
-- zero linhas — sem erro, silenciosamente. Isto adiciona policies de escrita
-- para quem está na tabela admins.
--
-- Rode no SQL Editor do Supabase.

-- ----------------------------------------------------------------------------
-- 1) Helper is_super_admin()
--    SECURITY DEFINER para não depender do RLS da própria tabela admins —
--    uma subquery em admins dentro de uma policy é avaliada sob o RLS de
--    admins, o que torna a checagem frágil. A função contorna isso.
-- ----------------------------------------------------------------------------

create or replace function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_super_admin() to authenticated;

-- ----------------------------------------------------------------------------
-- 2) Policies de escrita
--    "with check" é obrigatório: sem ele o INSERT/UPDATE é recusado mesmo
--    quando o "using" passa.
-- ----------------------------------------------------------------------------

drop policy if exists "admin_all" on establishments;
create policy "admin_all" on establishments for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists "admin_all" on professionals;
create policy "admin_all" on professionals for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists "admin_all" on services;
create policy "admin_all" on services for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists "admin_all" on plans;
create policy "admin_all" on plans for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists "admin_all" on subscriptions;
create policy "admin_all" on subscriptions for all
  using (is_super_admin()) with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- 3) Leitura da própria linha em admins — necessária para o frontend
--    verificar se o usuário logado é super admin.
-- ----------------------------------------------------------------------------

drop policy if exists "self_read" on admins;
create policy "self_read" on admins for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Conferência: rode logado como super admin. Deve retornar true.
--   select is_super_admin();
-- ----------------------------------------------------------------------------
