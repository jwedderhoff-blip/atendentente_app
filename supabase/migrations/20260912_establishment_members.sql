-- ============================================================================
-- Acesso de professor (login visualizador) por estabelecimento
-- ============================================================================
-- Um membro visualizador é identificado pelo e-mail. Ele enxerga agenda/aulas
-- do estabelecimento (somente leitura), mas não é dono. O dono gerencia a lista.
--
-- Rode este bloco INTEIRO no SQL Editor do Supabase.

create table if not exists establishment_members (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid references establishments(id) on delete cascade,
  email text not null,
  role text check (role in ('viewer')) not null default 'viewer',
  created_at timestamptz default now(),
  unique (establishment_id, email)
);

alter table establishment_members enable row level security;

-- Dono gerencia os membros do próprio estabelecimento
drop policy if exists "owner_all" on establishment_members;
create policy "owner_all" on establishment_members for all using (
  establishment_id in (select id from establishments where owner_id = auth.uid())
) with check (
  establishment_id in (select id from establishments where owner_id = auth.uid())
);

-- O próprio membro vê suas linhas (para o app descobrir a que estabelecimentos tem acesso)
drop policy if exists "self_read" on establishment_members;
create policy "self_read" on establishment_members for select using (
  lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Helper: e-mail do usuário logado é visualizador do estabelecimento?
create or replace function is_member(p_establishment uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from establishment_members m
    where m.establishment_id = p_establishment
      and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function is_member(uuid) to authenticated;

-- Leitura para o visualizador: agenda (appointments) e nomes dos clientes.
drop policy if exists "member_read" on appointments;
create policy "member_read" on appointments for select using (is_member(establishment_id));

drop policy if exists "member_read" on clients;
create policy "member_read" on clients for select using (is_member(establishment_id));

-- service_schedules: leitura para o visualizador (horários fixos das turmas).
drop policy if exists "member_read" on service_schedules;
create policy "member_read" on service_schedules for select using (
  service_id in (
    select s.id from services s where is_member(s.establishment_id)
  )
);
