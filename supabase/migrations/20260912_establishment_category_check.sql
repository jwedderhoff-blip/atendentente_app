-- ============================================================================
-- Atualiza a check constraint de category dos estabelecimentos
-- ============================================================================
-- A constraint original (criada no schema inicial) estava desatualizada e
-- recusava categorias válidas — inclusive 'academia' e as categorias novas por
-- linha (dança, lutas, personal, manicure, nutrição, cabeleireiro). Recria a
-- constraint com o conjunto completo, alinhado a src/lib/segments.ts.
--
-- Rode no SQL Editor do Supabase.

alter table establishments drop constraint if exists establishments_category_check;

alter table establishments add constraint establishments_category_check
  check (category in (
    'salao','barbearia','cabeleireiro','manicure','estetica','beleza',
    'pilates','aulas_coletivas','danca','lutas','personal','academia',
    'avaliacao_fisica','avaliacao_nutricional','nutricao','outro'
  ));
