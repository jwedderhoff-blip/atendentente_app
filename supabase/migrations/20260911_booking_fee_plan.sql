-- ============================================================================
-- Plano por agendamento (taxa por atendimento concluído)
-- ============================================================================
-- Um novo tipo de plano cobra uma taxa a cada agendamento CONCLUÍDO: fixa
-- (ex.: R$ 0,50) ou percentual (ex.: 5% do preço do serviço). A taxa pode ser
-- repassada ao cliente ou descontada do estabelecimento (definido no plano).
-- Cada cobrança vira uma linha em booking_charges; um gatilho grava/estorna
-- automaticamente conforme o status do agendamento. Uma função devolve o
-- resumo mensal por estabelecimento para o superadmin.
--
-- Rode este bloco INTEIRO no SQL Editor do Supabase. Se der erro em alguma
-- linha, me mande a mensagem — o Supabase desfaz o bloco todo quando falha.

-- 1) Novo billing_type e campos de taxa no plano ----------------------------
alter table plans drop constraint if exists plans_billing_type_check;
alter table plans add constraint plans_billing_type_check
  check (billing_type in ('monthly','package','por_agendamento'));

alter table plans add column if not exists booking_fee_type text
  check (booking_fee_type in ('fixo','percentual'));
alter table plans add column if not exists booking_fee_value numeric(10,2);
alter table plans add column if not exists booking_fee_charge_to text
  check (booking_fee_charge_to in ('cliente','estabelecimento'));

-- 2) Livro-caixa de cobranças por agendamento -------------------------------
create table if not exists booking_charges (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete cascade unique,
  plan_id uuid references plans(id),
  service_price numeric(10,2),
  fee_type text,
  fee_value numeric(10,2),
  charge_to text,
  fee_amount numeric(10,2) not null default 0,
  reference_month date not null,
  created_at timestamptz default now()
);

create index if not exists booking_charges_est_month
  on booking_charges (establishment_id, reference_month);

alter table booking_charges enable row level security;

drop policy if exists "owner_read_own" on booking_charges;
create policy "owner_read_own" on booking_charges for select using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

drop policy if exists "admin_all" on booking_charges;
create policy "admin_all" on booking_charges for all using (
  exists (select 1 from admins where user_id = auth.uid())
) with check (
  exists (select 1 from admins where user_id = auth.uid())
);

-- 3) Gatilho: grava a taxa ao concluir, estorna ao sair de concluído --------
create or replace function apply_booking_fee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan_id uuid;
  v_plan    plans%rowtype;
  v_price   numeric(10,2);
  v_amount  numeric(10,2);
begin
  -- Estorno: deixou de estar concluído
  if tg_op = 'UPDATE' and old.status = 'concluido' and new.status <> 'concluido' then
    delete from booking_charges where appointment_id = new.id;
    return new;
  end if;

  -- Cobrança: entrou em concluído
  if new.status = 'concluido' and (tg_op = 'INSERT' or old.status is distinct from 'concluido') then
    select plan_id into v_plan_id
    from subscriptions
    where establishment_id = new.establishment_id
    order by created_at desc
    limit 1;
    if v_plan_id is null then return new; end if;

    select * into v_plan from plans where id = v_plan_id;
    if not found or v_plan.billing_type <> 'por_agendamento' then return new; end if;
    if v_plan.booking_fee_type is null or v_plan.booking_fee_value is null then return new; end if;

    select price into v_price from services where id = new.service_id;
    v_price := coalesce(v_price, 0);

    if v_plan.booking_fee_type = 'percentual' then
      v_amount := round(v_price * v_plan.booking_fee_value / 100.0, 2);
    else
      v_amount := v_plan.booking_fee_value;
    end if;

    insert into booking_charges (
      establishment_id, appointment_id, plan_id, service_price,
      fee_type, fee_value, charge_to, fee_amount, reference_month
    ) values (
      new.establishment_id, new.id, v_plan.id, v_price,
      v_plan.booking_fee_type, v_plan.booking_fee_value, v_plan.booking_fee_charge_to,
      v_amount, date_trunc('month', coalesce(new.starts_at, now()))::date
    )
    on conflict (appointment_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_booking_fee on appointments;
create trigger trg_apply_booking_fee
after insert or update of status on appointments
for each row execute function apply_booking_fee();

-- 4) Resumo mensal por estabelecimento (para o superadmin) ------------------
create or replace function admin_booking_charges_summary(p_month date)
returns table (
  establishment_id uuid,
  establishment_name text,
  charges bigint,
  total numeric,
  charge_to text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    count(bc.*),
    coalesce(sum(bc.fee_amount), 0),
    max(bc.charge_to)
  from booking_charges bc
  join establishments e on e.id = bc.establishment_id
  where bc.reference_month = date_trunc('month', p_month)::date
    and exists (select 1 from admins a where a.user_id = auth.uid())
  group by e.id, e.name
  order by 4 desc;
$$;

grant execute on function admin_booking_charges_summary(date) to authenticated;
