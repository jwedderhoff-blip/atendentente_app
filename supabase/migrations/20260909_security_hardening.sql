-- ============================================================================
-- Hardening de RLS: leitura pública mínima para o fluxo de agendamento
-- + papel real de superadmin (banco), substituindo a checagem por e-mail no front
-- ============================================================================
-- IMPORTANTE: rode isto no SQL Editor do Supabase e confira o resultado antes
-- de considerar concluído. Eu não tenho como testar isto contra seu projeto real.

-- ----------------------------------------------------------------------------
-- 1) Leitura pública do necessário para o cliente final conseguir agendar
--    (estabelecimento, profissionais, serviços, horário de funcionamento).
--    Isso NÃO remove as policies "owner_all" existentes — elas continuam
--    garantindo que só o dono edita/apaga. Aqui só adicionamos permissão de
--    LEITURA pra quem não está logado (visitante agendando).
-- ----------------------------------------------------------------------------

create policy "public_read" on establishments for select using (true);
create policy "public_read" on professionals for select using (true);
create policy "public_read" on services for select using (true);
create policy "public_read" on professional_services for select using (true);

-- working_hours: tabela usada por useWorkingHours.ts / useAvailability.ts,
-- mas não existia em supabase/schema.sql — criando aqui caso ainda não exista,
-- para trazer para o controle de versão. Se já existir com colunas diferentes,
-- ajuste antes de rodar.
create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '18:00',
  break_start time,
  break_end time,
  unique (establishment_id, day_of_week)
);
alter table working_hours enable row level security;
create policy "owner_all" on working_hours for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
create policy "public_read" on working_hours for select using (true);

-- ----------------------------------------------------------------------------
-- 2) Disponibilidade de horário SEM expor dados de clientes.
--    Em vez de dar select público na tabela appointments inteira (que tem
--    nome/telefone de cliente via join e notas internas), criamos uma função
--    que devolve só os intervalos ocupados. SECURITY DEFINER = roda com
--    privilégio do dono da função, então funciona mesmo para o visitante
--    anônimo, mas só retorna o que a função explicitamente seleciona.
-- ----------------------------------------------------------------------------

create or replace function get_busy_slots(
  p_establishment_id uuid,
  p_date date,
  p_professional_id uuid default null,
  p_service_id uuid default null
)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select starts_at, ends_at
  from appointments
  where establishment_id = p_establishment_id
    and status = 'confirmado'
    and starts_at::date = p_date
    and (p_professional_id is null or professional_id = p_professional_id)
    and (p_service_id is null or service_id = p_service_id);
$$;

grant execute on function get_busy_slots(uuid, date, uuid, uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3) Permitir que o visitante crie o próprio agendamento e cliente,
--    mas travado para não poder se auto-marcar como "pago" ou definir status
--    arbitrário na criação.
-- ----------------------------------------------------------------------------

create policy "public_insert" on clients for insert
  with check (true);

create policy "public_insert" on appointments for insert
  with check (status = 'pendente' and payment_status = 'pendente');

-- ----------------------------------------------------------------------------
-- 4) Papel real de superadmin — tabela própria em vez de comparar e-mail
--    no frontend (o e-mail no frontend é só cosmético agora; a proteção
--    de verdade passa a ser esta tabela + RLS).
-- ----------------------------------------------------------------------------

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);
alter table admins enable row level security;
-- Ninguém lê/escreve essa tabela pelo cliente; só o backend/dashboard do Supabase.
-- (nenhuma policy = nenhum acesso via anon/authenticated, só via service_role)

-- Rode manualmente, substituindo pelo seu próprio user id (veja em
-- Authentication > Users no painel do Supabase):
-- insert into admins (user_id) values ('SEU_USER_ID_AQUI');

-- ----------------------------------------------------------------------------
-- 5) plans e subscriptions — não existiam no schema versionado.
--    Criando com estrutura compatível com o que useSuperAdmin.ts já espera,
--    e RLS restrito a quem está na tabela admins.
--    Se essas tabelas JÁ EXISTEM no seu Supabase com estrutura diferente,
--    NÃO rode os "create table" abaixo — ajuste manualmente e rode só as
--    policies, ou você pode duplicar/quebrar dados existentes.
-- ----------------------------------------------------------------------------

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  billing_type text check (billing_type in ('monthly','package')) not null default 'monthly',
  price_monthly numeric(10,2) not null default 0,
  price_package numeric(10,2),
  package_days int,
  max_services int,
  max_professionals int,
  max_appointments_per_month int,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  plan_id uuid references plans(id),
  status text check (status in ('trial','active','suspended','cancelled')) not null default 'trial',
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table plans enable row level security;
alter table subscriptions enable row level security;

-- Leitura pública dos planos ativos (pra mostrar preço no site, por ex.)
create policy "public_read_active" on plans for select using (is_active = true);

-- Só admin (tabela admins) mexe em plano e assinatura
create policy "admin_all" on plans for all using (
  exists (select 1 from admins where user_id = auth.uid())
);
create policy "admin_all" on subscriptions for all using (
  exists (select 1 from admins where user_id = auth.uid())
);

-- Dono do estabelecimento pode ao menos VER a própria assinatura (não editar)
create policy "owner_read_own" on subscriptions for select using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

-- ----------------------------------------------------------------------------
-- 6) establishments.status — usado por useAllEstablishments/updateStatus mas
--    não existia na tabela original. Adicionando de forma segura.
-- ----------------------------------------------------------------------------
alter table establishments
  add column if not exists status text check (status in ('ativo','suspenso','cancelado')) not null default 'ativo';
