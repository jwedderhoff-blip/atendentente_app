-- ============================================================================
-- Aulas por semana da turma
-- ============================================================================
-- Uma turma (ex.: jiu-jitsu) pode ter mais de uma aula por semana. Este campo
-- diz quantas — usado para conferir se os horários fixos foram cadastrados em
-- todos os dias esperados e para informar o aluno na matrícula.
--
-- Rode no SQL Editor do Supabase.

alter table services add column if not exists sessions_per_week int not null default 1;
