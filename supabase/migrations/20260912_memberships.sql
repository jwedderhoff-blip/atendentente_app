-- ============================================================================
-- Mensalidades (matrículas em turmas com cobrança mensal)
-- ============================================================================
-- memberships       = a matrícula do aluno numa turma mensal (valor, início,
--                     duração em meses; null = indeterminado).
-- membership_charges = uma cobrança por mês de referência (pendente/pago),
--                     geradas automaticamente por gatilho ao criar a matrícula.
--
-- O aluno cria a matrícula pela página pública (anon) — como já faz com
-- agendamentos. As cobranças são geradas no banco (SECURITY DEFINER), não pelo
-- cliente. O dono vê e marca como pago no painel. Pagamento por gateway fica
-- para depois; por ora o dono confirma o pagamento manualmente.
--
-- Rode este bloco INTEIRO no SQL Editor do Supabase.

-- 1) Matrícula ---------------------------------------------------------------
create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  monthly_price numeric(10,2) not null default 0,
  start_month date not null default date_trunc('month', now())::date,
  months int,  -- null = indeterminado
  status text check (status in ('ativa','cancelada')) not null default 'ativa',
  created_at timestamptz default now()
);

alter table memberships enable row level security;

drop policy if exists "public_insert" on memberships;
create policy "public_insert" on memberships for insert
  with check (status = 'ativa');

drop policy if exists "owner_all" on memberships;
create policy "owner_all" on memberships for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
) with check (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

drop policy if exists "admin_all" on memberships;
create policy "admin_all" on memberships for all using (
  exists (select 1 from admins where user_id = auth.uid())
) with check (
  exists (select 1 from admins where user_id = auth.uid())
);

-- 2) Cobranças mensais -------------------------------------------------------
create table if not exists membership_charges (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid references memberships(id) on delete cascade,
  establishment_id uuid references establishments(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  service_id uuid references services(id) on delete set null,
  reference_month date not null,
  amount numeric(10,2) not null default 0,
  status text check (status in ('pendente','pago','cancelada')) not null default 'pendente',
  paid_at timestamptz,
  created_at timestamptz default now(),
  unique (membership_id, reference_month)
);

create index if not exists membership_charges_est_month
  on membership_charges (establishment_id, reference_month);
create index if not exists membership_charges_client
  on membership_charges (client_id);

alter table membership_charges enable row level security;

drop policy if exists "owner_all" on membership_charges;
create policy "owner_all" on membership_charges for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
) with check (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

drop policy if exists "admin_all" on membership_charges;
create policy "admin_all" on membership_charges for all using (
  exists (select 1 from admins where user_id = auth.uid())
) with check (
  exists (select 1 from admins where user_id = auth.uid())
);

-- 3) Gera as cobranças mensais ao criar a matrícula --------------------------
create or replace function generate_membership_charges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  i int;
  n int;
  ref date;
begin
  -- indeterminado (months null): gera 12 meses iniciais como base
  n := coalesce(new.months, 12);
  for i in 0..(n - 1) loop
    ref := (date_trunc('month', new.start_month) + (i || ' months')::interval)::date;
    insert into membership_charges (
      membership_id, establishment_id, client_id, service_id, reference_month, amount, status
    ) values (
      new.id, new.establishment_id, new.client_id, new.service_id, ref, new.monthly_price, 'pendente'
    )
    on conflict (membership_id, reference_month) do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_generate_membership_charges on memberships;
create trigger trg_generate_membership_charges
after insert on memberships
for each row execute function generate_membership_charges();

-- 4) Resumo mensal de mensalidades por estabelecimento (superadmin) ----------
create or replace function admin_membership_summary(p_month date)
returns table (
  establishment_id uuid,
  establishment_name text,
  cobrancas bigint,
  pagas bigint,
  total numeric,
  recebido numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    count(mc.*),
    count(mc.*) filter (where mc.status = 'pago'),
    coalesce(sum(mc.amount), 0),
    coalesce(sum(mc.amount) filter (where mc.status = 'pago'), 0)
  from membership_charges mc
  join establishments e on e.id = mc.establishment_id
  where mc.reference_month = date_trunc('month', p_month)::date
    and mc.status <> 'cancelada'
    and exists (select 1 from admins a where a.user_id = auth.uid())
  group by e.id, e.name
  order by 5 desc;
$$;

grant execute on function admin_membership_summary(date) to authenticated;
