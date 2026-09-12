-- ============================================================================
-- Plano por linha de trabalho
-- ============================================================================
-- Um plano pode ser exclusivo de uma linha (estetica ou saude_fitness) ou
-- servir as duas (segment nulo). Usado para oferecer, na assinatura, só os
-- planos compatíveis com a linha do estabelecimento, e para filtrar a vitrine
-- pública de planos e os relatórios por linha.
--
-- Rode no SQL Editor do Supabase. Planos já existentes ficam com segment nulo
-- (valem para as duas linhas), o que preserva o comportamento atual.

alter table plans add column if not exists segment text
  check (segment in ('estetica','saude_fitness'));
