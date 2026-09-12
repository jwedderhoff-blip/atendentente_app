-- ============================================================================
-- Forma de cobrança do serviço: por sessão ou mensalidade
-- ============================================================================
-- Aulas/turmas (jiu-jitsu, pilates, dança…) costumam cobrar MENSALIDADE, não
-- por sessão. price_mode define isso; o campo price passa a valer conforme o
-- modo: 'sessao' = valor por atendimento, 'mensal' = mensalidade.
--
-- Rode no SQL Editor do Supabase. Serviços existentes ficam como 'sessao'
-- (comportamento atual preservado).

alter table services add column if not exists price_mode text
  check (price_mode in ('sessao','mensal')) not null default 'sessao';
