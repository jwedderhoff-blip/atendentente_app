import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

export type ThemeMode = 'light' | 'dark' | 'system'

export const DEFAULT_BRAND = '#4f46e5'

/**
 * A preferência de tema é por usuário, não por navegador: dois logins no mesmo
 * computador (o barbeiro e a nutricionista) precisam de escolhas separadas.
 */
const themeKey = (userId: string | undefined) =>
  userId ? `meridio:theme:${userId}` : null

/** Presets prontos. O dono também pode escolher qualquer hex. */
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
  /** O que o usuário escolheu, incluindo "seguir o sistema". */
  mode: ThemeMode
  /** O que está de fato aplicado agora. */
  resolved: 'light' | 'dark'
  /** Cor da marca em vigor na tela atual. */
  brand: string
  setMode: (m: ThemeMode) => void
  /**
   * Aplica a cor da marca da tela atual. Não persiste de propósito: a cor é
   * do estabelecimento e mora no banco. Guardá-la no navegador faria a cor de
   * um vazar para o outro quando o mesmo navegador abre dois estabelecimentos.
   */
  applyBrand: (hex: string | null | undefined) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [mode, setModeState] = useState<ThemeMode>('light')
  const [brand, setBrandState] = useState<string>(DEFAULT_BRAND)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Recarrega a preferência ao trocar de usuário — inclusive no logout,
  // que precisa voltar ao padrão em vez de manter o tema do anterior.
  useEffect(() => {
    const key = themeKey(user?.id)
    if (!key) {
      setModeState('light')
      return
    }
    try {
      setModeState((localStorage.getItem(key) as ThemeMode) || 'light')
    } catch {
      setModeState('light')
    }
  }, [user?.id])

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

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m)
    const key = themeKey(user?.id)
    if (!key) return
    try { localStorage.setItem(key, m) } catch { /* armazenamento bloqueado */ }
  }, [user?.id])

  const applyBrand = useCallback((hex: string | null | undefined) => {
    // Sem cor definida volta ao padrão, e não à cor de quem passou antes
    setBrandState(hex && isValidHex(hex) ? hex : DEFAULT_BRAND)
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, resolved, brand, setMode, applyBrand }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
