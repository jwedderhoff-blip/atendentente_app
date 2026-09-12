-- ============================================================================
-- Instagram do estabelecimento
-- ============================================================================
-- Campo opcional para o @ / link do Instagram, exibido na página pública e
-- editável em Configurações. Telefone, e-mail e endereço já existem.
--
-- Rode no SQL Editor do Supabase.

alter table establishments add column if not exists instagram text;
