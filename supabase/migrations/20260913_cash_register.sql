-- ============================================================================
-- Frente de caixa (recebimentos) + registro permanente de movimentações
-- ============================================================================
-- Operada pelo dono e pelo login dos professores (membros). Cada recebimento
-- fica registrado com o e-mail de quem operou. Ao receber uma mensalidade em
-- aberto, a cobrança correspondente é marcada como paga automaticamente.
--
-- Rode este bloco INTEIRO no SQL Editor do Supabase.

create table if not exists cash_movements (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  membership_charge_id uuid references membership_charges(id) on delete set null,
  kind text check (kind in ('mensalidade','servico','avulso')) not null default 'avulso',
  description text,
  amount numeric(10,2) not null default 0,
  method text check (method in ('dinheiro','pix','cartao_credito','cartao_debito','outro'))
    not null default 'dinheiro',
  operator_email text,
  created_at timestamptz default now()
);

create index if not exists cash_movements_est_created
  on cash_movements (establishment_id, created_at desc);

alter table cash_movements enable row level security;

-- Dono gerencia tudo do próprio estabelecimento
drop policy if exists "owner_all" on cash_movements;
create policy "owner_all" on cash_movements for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
) with check (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

-- Membro (professor/caixa) enxerga as movimentações do estabelecimento
drop policy if exists "member_read" on cash_movements;
create policy "member_read" on cash_movements for select using (is_member(establishment_id));

-- ----------------------------------------------------------------------------
-- Função: registra um recebimento no caixa (e baixa a mensalidade, se houver).
-- SECURITY DEFINER — faz a própria checagem de permissão (dono OU membro).
-- ----------------------------------------------------------------------------
create or replace function register_cash_payment(
  p_establishment uuid,
  p_client uuid,
  p_charge uuid,
  p_kind text,
  p_description text,
  p_amount numeric,
  p_method text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_authorized boolean;
begin
  select (
    exists (select 1 from establishments e where e.id = p_establishment and e.owner_id = auth.uid())
    or is_member(p_establishment)
  ) into v_authorized;

  if not coalesce(v_authorized, false) then
    raise exception 'Sem permissão para registrar no caixa deste estabelecimento';
  end if;

  insert into cash_movements (
    establishment_id, client_id, membership_charge_id, kind, description, amount, method, operator_email
  ) values (
    p_establishment, p_client, p_charge, coalesce(p_kind, 'avulso'),
    nullif(p_description, ''), p_amount, coalesce(p_method, 'dinheiro'), v_email
  ) returning id into v_id;

  if p_charge is not null then
    update membership_charges
      set status = 'pago', paid_at = now()
      where id = p_charge and establishment_id = p_establishment;
  end if;

  return v_id;
end;
$$;

grant execute on function register_cash_payment(uuid, uuid, uuid, text, text, numeric, text) to authenticated;
