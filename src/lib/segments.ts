import { Sparkles, Dumbbell, type LucideIcon } from 'lucide-react'

/**
 * Segmentação do Meridio em duas linhas de trabalho. A "linha" (segment) agrupa
 * categorias e define regras — a principal: Estética é sempre atendimento
 * individual (sem turmas); Saúde & Fitness permite turmas.
 *
 * Fase 1: a segmentação é montada sobre as categorias já existentes. Categorias
 * novas por linha (dança, lutas, personal, manicure, nutrição) entram numa
 * próxima fase, junto da centralização de rótulos/ícones das telas.
 */

export type Segment = 'estetica' | 'saude_fitness'

export type Category =
  | 'salao' | 'barbearia' | 'estetica' | 'beleza'
  | 'pilates' | 'aulas_coletivas' | 'avaliacao_fisica' | 'avaliacao_nutricional' | 'academia'
  | 'outro'

export const CATEGORY_LABELS: Record<Category, string> = {
  salao: 'Salão de beleza',
  barbearia: 'Barbearia',
  estetica: 'Estética',
  beleza: 'Serviços de beleza',
  pilates: 'Pilates / Studio',
  aulas_coletivas: 'Aulas coletivas',
  avaliacao_fisica: 'Avaliação física',
  avaliacao_nutricional: 'Avaliação nutricional',
  academia: 'Academia',
  outro: 'Outro',
}

/** Categorias de cada linha, na ordem em que aparecem nas listas. */
export const CATEGORIES_BY_SEGMENT: Record<Segment, Category[]> = {
  estetica: ['salao', 'barbearia', 'estetica', 'beleza', 'outro'],
  saude_fitness: ['pilates', 'aulas_coletivas', 'avaliacao_fisica', 'avaliacao_nutricional', 'academia', 'outro'],
}

export interface SegmentMeta {
  value: Segment
  label: string
  tagline: string
  icon: LucideIcon
}

export const SEGMENTS: SegmentMeta[] = [
  { value: 'estetica', label: 'Estética', tagline: 'Beleza e cuidados pessoais — atendimento individual', icon: Sparkles },
  { value: 'saude_fitness', label: 'Saúde & Fitness', tagline: 'Pilates, dança, lutas, personal, nutrição — turmas ou individual', icon: Dumbbell },
]

export function segmentLabel(seg?: Segment | null): string {
  return SEGMENTS.find((s) => s.value === seg)?.label ?? '—'
}

/**
 * Linha a que uma categoria pertence — usado no backfill e como fallback quando
 * o estabelecimento ainda não tem `segment` gravado. "outro" cai em Estética
 * (individual), o caminho mais conservador.
 */
export function segmentForCategory(category?: string | null): Segment {
  const fit: string[] = ['pilates', 'aulas_coletivas', 'avaliacao_fisica', 'avaliacao_nutricional', 'academia']
  return category && fit.includes(category) ? 'saude_fitness' : 'estetica'
}

/** Estética nunca tem turma; Saúde & Fitness pode. */
export function allowsClasses(segment?: Segment | null): boolean {
  return segment === 'saude_fitness'
}
