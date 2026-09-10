import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSelectedEstablishmentId } from '../hooks/useEstablishment'
import { resolveBrand, DEFAULT_BRAND } from '../lib/brand'
import type { Establishment } from '../types'

export type ThemeMode = 'light' | 'dark' | 'system'

export { DEFAULT_BRAND }

/**
 * Aparência é setup do estabelecimento, não preferência de navegador.
 *
 * O banco é a fonte da verdade (establishments.theme_mode). Este cache existe
 * só para o primeiro instante da tela: sem ele, o painel de quem trabalha no
 * escuro piscaria claro até o estabelecimento carregar. A chave leva o id do
 * estabelecimento justamente para que a escolha de um nunca alcance o outro.
 */
const themeCacheKey = (establishmentId: string | null | undefined) =>
  establishmentId ? `meridio:theme:${establishmentId}` : null

function readCachedTheme(establishmentId: string | null | undefined): ThemeMode | null {
  const key = themeCacheKey(establishmentId)
  if (!key) return null
  try {
    const v = localStorage.getItem(key)
    return v === 'light' || v === 'dark' || v === 'system' ? v : null
  } catch {
    return null
  }
}

export const BRAND_PRESETS: { name: string; hex: string }[] = [
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Azul', hex: '#2563eb' },
  { name: 'Petróleo', hex: '#2c6e6a' },
  { name: 'Sálvia', hex: '#5a7d64' },
  { name: 'Latão', hex: '#a8843c' },
  { name: 'Terracota', hex: '#c26a3c' },
  { name: 'Rosa', hex: '#b5476b' },
  { name: 'Vinho', hex: '#8b2f4a' },
  { name: 'Ameixa', hex: '#7e3f8f' },
  { name: 'Grafite', hex: '#3f4550' },
]

export const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v.trim())

interface ThemeContextValue {
  mode: ThemeMode
  resolved: 'light' | 'dark'
  brand: string
  /** Troca o tema do estabelecimento em vigor. Persistir no banco é com quem chama. */
  setMode: (m: ThemeMode) => void
  /** Painel: adota tema e cor do estabelecimento ativo. */
  applyEstablishment: (est: Establishment | null | undefined) => void
  /**
   * Página pública: adota tema e cor do estabelecimento, para o cliente ver a
   * mesma identidade que roda no painel. Sem estabelecimento (landing, demo)
   * volta ao claro com a cor padrão.
   */
  applyPublic: (est: Establishment | null | undefined) => void
  /** Aplica cor avulsa, para a prévia enquanto o dono experimenta. */
  previewBrand: (hex: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  // No primeiro paint ainda não sabemos o estabelecimento pelo banco, mas
  // sabemos qual estava selecionado — o bastante para não piscar.
  const [scopeId, setScopeId] = useState<string | null>(() => {
    try { return getSelectedEstablishmentId() } catch { return null }
  })
  const [mode, setModeState] = useState<ThemeMode>(() => readCachedTheme(scopeId) ?? 'light')
  const [brand, setBrandState] = useState<string>(DEFAULT_BRAND)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolved)
  }, [resolved])

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-base', brand)
  }, [brand])

  const applyEstablishment = useCallback((est: Establishment | null | undefined) => {
    const id = est?.id ?? null
    setScopeId(id)
    setBrandState(resolveBrand(est).hex)

    // Banco manda; o cache só cobre o intervalo até ele chegar. Sem nenhum dos
    // dois volta ao claro — nunca ao tema do estabelecimento anterior.
    const fromDb = est?.theme_mode
    const next: ThemeMode =
      fromDb === 'light' || fromDb === 'dark' || fromDb === 'system'
        ? fromDb
        : readCachedTheme(id) ?? 'light'

    setModeState(next)

    const key = themeCacheKey(id)
    if (key) {
      try { localStorage.setItem(key, next) } catch { /* armazenamento bloqueado */ }
    }
  }, [])

  const applyPublic = useCallback((est: Establishment | null | undefined) => {
    // Sem escopo: o visitante não acumula cache de tema de cada negócio que
    // abre. O tema vem do banco a cada visita.
    setScopeId(null)
    setBrandState(resolveBrand(est).hex)

    const fromDb = est?.theme_mode
    setModeState(
      fromDb === 'light' || fromDb === 'dark' || fromDb === 'system' ? fromDb : 'light',
    )
  }, [])

  const previewBrand = useCallback((hex: string) => {
    setBrandState(isValidHex(hex) ? hex : DEFAULT_BRAND)
  }, [])

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    const key = themeCacheKey(scopeId)
    if (!key) return
    try { localStorage.setItem(key, m) } catch { /* armazenamento bloqueado */ }
  }, [scopeId])

  return (
    <ThemeContext.Provider
      value={{ mode, resolved, brand, setMode, applyEstablishment, applyPublic, previewBrand }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
