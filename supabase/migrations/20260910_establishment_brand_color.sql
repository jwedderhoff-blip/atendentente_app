-- ============================================================================
-- Cor da marca do estabelecimento
-- ============================================================================
-- O dono escolhe a cor em Configurações → Aparência. Fica no banco, e não no
-- navegador, porque é identidade do negócio: precisa aparecer também na
-- página pública de agendamento, que os clientes dele acessam.
--
-- O tema (claro/escuro) NÃO vem para cá de propósito — aquilo é preferência
-- de quem está olhando, e mora no localStorage de cada um.
--
-- Rode no SQL Editor do Supabase.

alter table establishments
  add column if not exists brand_color text;

-- Só aceita hex de 6 dígitos; nulo significa "usar a cor padrão da categoria"
alter table establishments
  drop constraint if exists establishments_brand_color_hex;

alter table establishments
  add constraint establishments_brand_color_hex
  check (brand_color is null or brand_color ~* '^#[0-9a-f]{6}$');

-- Conferência:
--   select id, name, brand_color from establishments;
