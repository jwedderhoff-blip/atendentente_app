import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_KEY = 'meridio:theme'
const BRAND_KEY = 'meridio:brand'

export const DEFAULT_BRAND = '#4f46e5'

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
  brand: string
  setMode: (m: ThemeMode) => void
  setBrand: (hex: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStored<T extends string>(key: string, fallback: T): T {
  try {
    return (localStorage.getItem(key) as T) || fallback
  } catch {
    // Navegador com armazenamento bloqueado: segue com o padrão.
    return fallback
  }
}

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStored<ThemeMode>(THEME_KEY, 'light'))
  const [brand, setBrandState] = useState<string>(() => readStored(BRAND_KEY, DEFAULT_BRAND))
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  // Acompanha a preferência do sistema enquanto o modo for "system"
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
    try { localStorage.setItem(THEME_KEY, m) } catch { /* sem persistência */ }
  }, [])

  const setBrand = useCallback((hex: string) => {
    if (!isValidHex(hex)) return
    setBrandState(hex)
    try { localStorage.setItem(BRAND_KEY, hex) } catch { /* sem persistência */ }
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, resolved, brand, setMode, setBrand }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve ser usado dentro de ThemeProvider')
  return ctx
}
