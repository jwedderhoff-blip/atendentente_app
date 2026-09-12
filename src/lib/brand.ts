import type { Establishment } from '../types'

export const DEFAULT_BRAND = '#4f46e5'

/**
 * Cor de identidade padrão por categoria, tirada da família de acentos do
 * produto. É só o ponto de partida: assim que o dono escolhe uma cor em
 * Configurações → Aparência, ela manda.
 */
export type CategoryColor = { hex: string; gradient: string }

export const CATEGORY_COLORS: Record<Establishment['category'], CategoryColor> = {
  salao:                 { hex: '#b5476b', gradient: 'rgba(109,39,64,0.88)' },
  barbearia:             { hex: '#a8843c', gradient: 'rgba(92,71,24,0.90)' },
  cabeleireiro:          { hex: '#a8843c', gradient: 'rgba(92,71,24,0.90)' },
  manicure:              { hex: '#b5476b', gradient: 'rgba(109,39,64,0.88)' },
  estetica:              { hex: '#7e3f8f', gradient: 'rgba(70,32,79,0.88)' },
  beleza:                { hex: '#b5476b', gradient: 'rgba(109,39,64,0.88)' },
  pilates:               { hex: '#5a7d64', gradient: 'rgba(44,66,52,0.88)' },
  aulas_coletivas:       { hex: '#c26a3c', gradient: 'rgba(107,56,24,0.88)' },
  danca:                 { hex: '#c26a3c', gradient: 'rgba(107,56,24,0.88)' },
  lutas:                 { hex: '#7e3f8f', gradient: 'rgba(70,32,79,0.88)' },
  personal:              { hex: '#4f46e5', gradient: 'rgba(36,31,107,0.88)' },
  academia:              { hex: '#4f46e5', gradient: 'rgba(36,31,107,0.88)' },
  avaliacao_fisica:      { hex: '#4f46e5', gradient: 'rgba(36,31,107,0.88)' },
  avaliacao_nutricional: { hex: '#5a7d64', gradient: 'rgba(44,66,52,0.88)' },
  nutricao:              { hex: '#5a7d64', gradient: 'rgba(44,66,52,0.88)' },
  outro:                 { hex: '#4f46e5', gradient: 'rgba(36,31,107,0.88)' },
}

const isHex = (v: string | null | undefined): v is string =>
  !!v && /^#[0-9a-fA-F]{6}$/.test(v)

/**
 * Cor que uma tela deve usar para um estabelecimento.
 *
 * Existe para que a página do estabelecimento e a de agendamento nunca
 * divirjam: sem isso, uma caía na cor da categoria e a outra no padrão, e o
 * cliente via a cor trocar no meio do fluxo.
 */
export function resolveBrand(establishment: Establishment | null | undefined): CategoryColor {
  const base = CATEGORY_COLORS[establishment?.category ?? 'outro']
  if (!isHex(establishment?.brand_color)) return base

  const hex = establishment.brand_color
  return { hex, gradient: `color-mix(in oklab, ${hex}, black 55%)` }
}
