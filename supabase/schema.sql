-- Estabelecimentos (salão, barbearia, estética, pilates)
create table establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text check (category in ('salao','barbearia','estetica','pilates','outro')) not null,
  phone text not null,
  email text,
  address text,
  logo_url text,
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Profissionais do estabelecimento
create table professionals (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  name text not null,
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Catálogo de serviços
create table services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  name text not null,
  description text,
  duration_minutes int not null default 60,
  price numeric(10,2) not null default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- Relação profissional <-> serviço
create table professional_services (
  professional_id uuid references professionals(id) on delete cascade,
  service_id uuid references services(id) on delete cascade,
  primary key (professional_id, service_id)
);

-- Clientes
create table clients (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  birth_date date,
  notes text,
  opt_in_marketing boolean default false,
  created_at timestamptz default now()
);

-- Agendamentos
create table appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  client_id uuid references clients(id),
  professional_id uuid references professionals(id),
  service_id uuid references services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text check (status in ('pendente','confirmado','cancelado','concluido')) default 'pendente',
  payment_status text check (payment_status in ('pendente','pago','reembolsado')) default 'pendente',
  payment_id text,
  notes text,
  created_at timestamptz default now()
);

-- Notificações enviadas
create table notifications (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  channel text check (channel in ('email','whatsapp','sms')) not null,
  sent_at timestamptz,
  status text check (status in ('pendente','enviado','falhou')) default 'pendente',
  message text
);

-- Índices de performance
create index on appointments(establishment_id, starts_at);
create index on appointments(client_id);
create index on clients(establishment_id, phone);

-- Row Level Security
alter table establishments enable row level security;
alter table professionals enable row level security;
alter table services enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;

-- Políticas: dono do estabelecimento acessa tudo
create policy "owner_all" on establishments for all using (owner_id = auth.uid());
create policy "owner_all" on professionals for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
create policy "owner_all" on services for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
create policy "owner_all" on clients for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
create policy "owner_all" on appointments for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);
