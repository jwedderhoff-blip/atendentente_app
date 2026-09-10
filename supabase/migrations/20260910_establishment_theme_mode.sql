-- ============================================================================
-- Tema do painel por estabelecimento
-- ============================================================================
-- O tema era guardado por usuário no navegador. Isso quebra quando um mesmo
-- login administra mais de um estabelecimento: o estúdio de pilates que
-- trabalha no escuro forçava o escuro na nutricionista também.
--
-- Aparência é setup do estabelecimento, não preferência de navegador. Indo
-- para o banco, cada um fica com o seu, e a escolha acompanha o dono em
-- qualquer dispositivo.
--
-- Rode no SQL Editor do Supabase.

alter table establishments
  add column if not exists theme_mode text;

alter table establishments
  drop constraint if exists establishments_theme_mode_valid;

alter table establishments
  add constraint establishments_theme_mode_valid
  check (theme_mode is null or theme_mode in ('light', 'dark', 'system'));

-- Conferência:
--   select id, name, brand_color, theme_mode from establishments;
