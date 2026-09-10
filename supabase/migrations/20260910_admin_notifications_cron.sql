-- ============================================================================
-- Agendamento do processamento da fila de notificações do admin
-- ============================================================================
-- Roda a Edge Function notify-admin a cada 5 minutos para esvaziar a fila.
-- Substitua <PROJECT_REF> e <SERVICE_ROLE_KEY> antes de executar.
--
-- Pré-requisitos:
--   - 20260910_admin_notifications.sql executada
--   - Edge Function notify-admin publicada
--   - Secret RESEND_API_KEY configurada nas Edge Functions

create extension if not exists pg_cron;

select cron.schedule(
  'notify-admin-5min',
  '*/5 * * * *',
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/notify-admin',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    )
  $$
);

-- Conferir jobs agendados:
--   select jobname, schedule, active from cron.job;
--
-- Remover para recriar:
--   select cron.unschedule('notify-admin-5min');
