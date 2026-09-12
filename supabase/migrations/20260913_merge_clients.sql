-- ============================================================================
-- Mesclar clientes duplicados (mantém um, migra tudo do outro e o remove)
-- ============================================================================
-- Quando o mesmo aluno aparece duas vezes (ex.: cadastro manual + reserva pelo
-- app com nome diferente), o dono mescla os dois: reservas, matrículas,
-- mensalidades e movimentações de caixa passam para o cliente mantido, e o
-- duplicado é excluído. Só o dono do estabelecimento pode mesclar.
--
-- Rode este bloco no SQL Editor do Supabase.

create or replace function merge_clients(p_keep uuid, p_remove uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_est uuid;
begin
  if p_keep = p_remove then
    raise exception 'Selecione dois clientes diferentes';
  end if;

  select establishment_id into v_est from clients where id = p_keep;
  if v_est is null then
    raise exception 'Cliente a manter não encontrado';
  end if;

  if not exists (
    select 1 from establishments e where e.id = v_est and e.owner_id = auth.uid()
  ) then
    raise exception 'Sem permissão para mesclar clientes deste estabelecimento';
  end if;

  if not exists (
    select 1 from clients where id = p_remove and establishment_id = v_est
  ) then
    raise exception 'Cliente duplicado inválido';
  end if;

  update appointments       set client_id = p_keep where client_id = p_remove;
  update memberships         set client_id = p_keep where client_id = p_remove;
  update membership_charges  set client_id = p_keep where client_id = p_remove;
  update cash_movements      set client_id = p_keep where client_id = p_remove;

  delete from clients where id = p_remove;
end;
$$;

grant execute on function merge_clients(uuid, uuid) to authenticated;
