-- Ativa a extensão pg_cron (rodar uma vez como superuser)
create extension if not exists pg_cron;

-- Agenda a Edge Function send-reminder para rodar a cada hora
-- Substitua <PROJECT_REF> pelo ref do seu projeto Supabase
-- e <SERVICE_ROLE_KEY> pela chave service_role

select cron.schedule(
  'send-reminders-hourly',
  '0 * * * *',  -- todo início de hora
  $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminder',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body := '{}'::jsonb
    )
  $$
);

-- Para verificar jobs agendados:
-- select * from cron.job;

-- Para remover o job se precisar recriar:
-- select cron.unschedule('send-reminders-hourly');
