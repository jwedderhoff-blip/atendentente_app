import {
  Scissors, Sparkles, Star, Dumbbell, Users, Activity, Apple, Store,
  Hand, Music, Swords, type LucideIcon,
} from 'lucide-react'

/**
 * Segmentação do Meridio em duas linhas de trabalho. A "linha" (segment) agrupa
 * categorias e define regras — a principal: Estética é sempre atendimento
 * individual (sem turmas); Saúde & Fitness permite turmas.
 *
 * Fonte única de verdade: categorias, rótulos, ícones e a que linha cada
 * categoria pertence. As telas importam daqui, não redefinem.
 */

export type Segment = 'estetica' | 'saude_fitness'

export type Category =
  | 'salao' | 'barbearia' | 'cabeleireiro' | 'manicure' | 'estetica' | 'beleza'
  | 'pilates' | 'aulas_coletivas' | 'danca' | 'lutas' | 'personal' | 'academia'
  | 'avaliacao_fisica' | 'avaliacao_nutricional' | 'nutricao'
  | 'outro'

export const CATEGORY_LABELS: Record<Category, string> = {
  salao: 'Salão de beleza',
  barbearia: 'Barbearia',
  cabeleireiro: 'Cabeleireiro',
  manicure: 'Manicure / Nail',
  estetica: 'Estética',
  beleza: 'Serviços de beleza',
  pilates: 'Pilates / Studio',
  aulas_coletivas: 'Aulas coletivas',
  danca: 'Dança',
  lutas: 'Lutas / Artes marciais',
  personal: 'Personal trainer',
  academia: 'Academia',
  avaliacao_fisica: 'Avaliação física',
  avaliacao_nutricional: 'Avaliação nutricional',
  nutricao: 'Nutrição',
  outro: 'Outro',
}

export const CATEGORY_ICONS: Record<Category, LucideIcon> = {
  salao: Scissors,
  barbearia: Scissors,
  cabeleireiro: Scissors,
  manicure: Hand,
  estetica: Sparkles,
  beleza: Star,
  pilates: Dumbbell,
  aulas_coletivas: Users,
  danca: Music,
  lutas: Swords,
  personal: Dumbbell,
  academia: Dumbbell,
  avaliacao_fisica: Activity,
  avaliacao_nutricional: Apple,
  nutricao: Apple,
  outro: Store,
}

/** Todas as categorias, para validações (ex.: enum do formulário de cadastro). */
export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as [Category, ...Category[]]

/** Categorias de cada linha, na ordem em que aparecem nas listas. */
export const CATEGORIES_BY_SEGMENT: Record<Segment, Category[]> = {
  estetica: ['salao', 'barbearia', 'cabeleireiro', 'manicure', 'estetica', 'beleza', 'outro'],
  saude_fitness: ['pilates', 'aulas_coletivas', 'danca', 'lutas', 'personal', 'academia', 'avaliacao_fisica', 'avaliacao_nutricional', 'nutricao', 'outro'],
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
  const fit = CATEGORIES_BY_SEGMENT.saude_fitness.filter((c) => c !== 'outro') as string[]
  return category && fit.includes(category) ? 'saude_fitness' : 'estetica'
}

/** Estética nunca tem turma; Saúde & Fitness pode. */
export function allowsClasses(segment?: Segment | null): boolean {
  return segment === 'saude_fitness'
}
