-- ============================================================================
-- Segmentação do estabelecimento em duas linhas de trabalho
-- ============================================================================
-- estetica       → beleza/estética, sempre atendimento individual (sem turmas)
-- saude_fitness  → pilates, aulas, dança, lutas, personal, nutrição/avaliações,
--                  academia; permite turmas ou individual
--
-- Backfill: define a linha dos estabelecimentos já existentes a partir da
-- categoria atual. Depois disso, novos cadastros escolhem a linha no registro.
--
-- Rode este bloco no SQL Editor do Supabase.

alter table establishments add column if not exists segment text
  check (segment in ('estetica','saude_fitness'));

update establishments set segment = case
  when category in ('pilates','aulas_coletivas','avaliacao_fisica','avaliacao_nutricional','academia')
    then 'saude_fitness'
  else 'estetica'
end
where segment is null;
