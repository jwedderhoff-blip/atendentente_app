-- ============================================================================
-- Contagens de profissionais e serviços por estabelecimento (para o superadmin)
-- ============================================================================
-- O superadmin precisa ver quantos profissionais e serviços cada estabelecimento
-- tem, para controlar contra o limite do plano. Uma leitura direta dessas
-- tabelas esbarra no RLS (o superadmin não é dono). Esta função roda como
-- SECURITY DEFINER (ignora o RLS) e só devolve dados para quem está na tabela
-- admins — então serve os números sem abrir as tabelas para todo mundo.
--
-- Rode no SQL Editor do Supabase (é uma função só; se der "Success", está feito).

create or replace function admin_establishment_counts()
returns table (establishment_id uuid, professionals bigint, services bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    (select count(*) from professionals p where p.establishment_id = e.id),
    (select count(*) from services      s where s.establishment_id = e.id)
  from establishments e
  where exists (select 1 from admins a where a.user_id = auth.uid());
$$;

grant execute on function admin_establishment_counts() to authenticated;
