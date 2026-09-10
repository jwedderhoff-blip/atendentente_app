-- ============================================================================
-- Notificações para o administrador da plataforma
-- ============================================================================
-- Avisa o dono do sistema por e-mail quando um novo estabelecimento se cadastra.
--
-- Desenho: um trigger em establishments enfileira o evento em
-- admin_notifications; a Edge Function notify-admin consome a fila e envia via
-- Resend. A fila existe para que o envio seja auditável no painel e para que
-- uma falha de e-mail não derrube o cadastro do cliente.
--
-- Rode no SQL Editor do Supabase. Depende de is_super_admin(), criada em
-- 20260910_superadmin_write_policies.sql.

-- ----------------------------------------------------------------------------
-- 1) Configuração (linha única)
-- ----------------------------------------------------------------------------

create table if not exists admin_notification_settings (
  -- id boolean com check garante que só exista uma linha
  id boolean primary key default true check (id),
  notify_email text not null,
  on_new_signup boolean not null default true,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Troque o e-mail abaixo se quiser outro destino padrão
insert into admin_notification_settings (id, notify_email)
values (true, 'jwedderhoff@gmail.com')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2) Fila / log de envios
-- ----------------------------------------------------------------------------

create table if not exists admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  establishment_id uuid references establishments(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendente'
    check (status in ('pendente', 'enviado', 'falhou')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists admin_notifications_pending_idx
  on admin_notifications (created_at)
  where status = 'pendente';

create index if not exists admin_notifications_created_idx
  on admin_notifications (created_at desc);

-- ----------------------------------------------------------------------------
-- 3) RLS — só o super admin enxerga
-- ----------------------------------------------------------------------------

alter table admin_notification_settings enable row level security;
alter table admin_notifications enable row level security;

drop policy if exists "admin_all" on admin_notification_settings;
create policy "admin_all" on admin_notification_settings for all
  using (is_super_admin()) with check (is_super_admin());

drop policy if exists "admin_all" on admin_notifications;
create policy "admin_all" on admin_notifications for all
  using (is_super_admin()) with check (is_super_admin());

-- ----------------------------------------------------------------------------
-- 4) Trigger de cadastro novo
--    SECURITY DEFINER: quem está se cadastrando não é admin e não teria
--    permissão de inserir na fila sob o RLS acima.
-- ----------------------------------------------------------------------------

create or replace function enqueue_new_signup_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cfg admin_notification_settings%rowtype;
begin
  select * into cfg from admin_notification_settings where id limit 1;

  -- Sem configuração, ou desligado: não enfileira
  if not found or not cfg.enabled or not cfg.on_new_signup then
    return new;
  end if;

  insert into admin_notifications (event_type, establishment_id, payload)
  values (
    'novo_cadastro',
    new.id,
    jsonb_build_object(
      'name',     new.name,
      'email',    new.email,
      'phone',    new.phone,
      'category', new.category,
      'slug',     new.slug,
      'status',   new.status
    )
  );

  return new;
end;
$$;

drop trigger if exists on_establishment_created on establishments;
create trigger on_establishment_created
  after insert on establishments
  for each row execute function enqueue_new_signup_notification();

-- ----------------------------------------------------------------------------
-- Conferência
--   select * from admin_notification_settings;
--   select * from admin_notifications order by created_at desc limit 10;
-- ----------------------------------------------------------------------------
