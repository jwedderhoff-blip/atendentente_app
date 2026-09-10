import { useState } from 'react'
import { Palette, Sun, Moon, Monitor, Check, Store } from 'lucide-react'
import { useTheme, BRAND_PRESETS, isValidHex, DEFAULT_BRAND, type ThemeMode } from '../../context/ThemeContext'
import type { Establishment } from '../../types'
import { supabase } from '../../lib/supabase'
import { isDemo } from '../../lib/isDemo'

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

interface Props {
  establishment: Establishment | null
}

/** Aceita colar sem o "#", que é como a maioria das paletas mostra o valor. */
function normalizeHex(raw: string): string {
  const v = raw.trim().toLowerCase()
  if (!v) return ''
  return v.startsWith('#') ? v : `#${v}`
}

export default function AparenciaCard({ establishment }: Props) {
  const { mode, resolved, brand, setMode, applyBrand } = useTheme()
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const normalized = normalizeHex(custom)
  const customIsValid = isValidHex(normalized)

  const persist = async (hex: string) => {
    applyBrand(hex)
    setMsg(null)
    if (!establishment || isDemo) return

    setSaving(true)
    // O filtro por id somado ao RLS (owner_id = auth.uid()) garante que um
    // dono só altera o próprio estabelecimento.
    const { data, error } = await supabase
      .from('establishments')
      .update({ brand_color: hex })
      .eq('id', establishment.id)
      .select()

    if (error) {
      setMsg({ text: `Não foi possível salvar: ${error.message}`, ok: false })
      applyBrand(establishment.brand_color)
    } else if (!data || data.length === 0) {
      setMsg({ text: 'Nenhuma linha alterada — verifique suas permissões.', ok: false })
      applyBrand(establishment.brand_color)
    } else {
      setMsg({ text: 'Cor salva. Sua página de agendamento já usa ela.', ok: true })
    }
    setSaving(false)
  }

  const applyCustom = () => {
    if (!customIsValid) return
    void persist(normalized)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center">
          <Palette size={16} className="text-brand" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Aparência</h2>
          <p className="text-xs text-gray-400">Tema do seu painel e cor da sua marca</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {msg && (
          <p className={`text-sm rounded-xl px-4 py-3 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg.text}
          </p>
        )}

        {/* ── Tema ── */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Tema do painel</label>
          <p className="text-xs text-gray-400 mb-3">
            Vale só para você, neste navegador. Não muda o que seus clientes veem.
          </p>
          <div className="flex gap-2 flex-wrap">
            {MODES.map(({ value, label, icon: Icon }) => {
              const on = mode === value
              return (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition"
                  style={{
                    borderColor: on ? 'var(--t-brand)' : 'var(--t-line)',
                    background: on ? 'var(--t-brand-soft)' : 'transparent',
                    color: on ? 'var(--t-brand)' : 'var(--t-ink-soft)',
                  }}
                >
                  <Icon size={15} />
                  {label}
                  {value === 'system' && on && (
                    <span className="text-xs opacity-70">({resolved === 'dark' ? 'escuro' : 'claro'})</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Cor da marca ── */}
        <div className="pt-5 border-t border-gray-100">
          <label className="text-sm font-medium text-gray-700 block mb-1">Cor da sua marca</label>
          <p className="text-xs text-gray-400 mb-3 flex items-start gap-1.5">
            <Store size={13} className="mt-0.5 shrink-0" />
            Aparece no seu painel <strong className="font-medium">e</strong> na página que seus clientes usam para agendar.
          </p>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
            {BRAND_PRESETS.map(({ name, hex }) => {
              const on = brand.toLowerCase() === hex.toLowerCase()
              return (
                <button
                  key={hex}
                  onClick={() => void persist(hex)}
                  disabled={saving}
                  title={name}
                  aria-label={name}
                  className="aspect-square rounded-xl flex items-center justify-center transition disabled:opacity-50"
                  style={{
                    background: hex,
                    outline: on ? '2px solid var(--t-brand)' : 'none',
                    outlineOffset: 2,
                  }}
                >
                  {on && <Check size={15} className="text-white" />}
                </button>
              )
            })}
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Outra cor</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={customIsValid ? normalized : brand}
                // A roleta nativa preenche o campo ao lado; aplicar continua
                // sendo um passo explícito, senão arrastar salvaria a cada tom.
                onChange={(e) => { setCustom(e.target.value); setMsg(null) }}
                className="w-11 h-10 rounded-lg border border-gray-200 bg-transparent cursor-pointer p-1 shrink-0"
                aria-label="Escolher cor"
              />
              <input
                value={custom}
                onChange={(e) => { setCustom(e.target.value); setMsg(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') applyCustom() }}
                placeholder="b5476b"
                spellCheck={false}
                className="flex-1 min-w-[130px] rounded-xl border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <button
                onClick={applyCustom}
                disabled={saving || !customIsValid}
                className="px-5 py-2.5 rounded-full text-white text-sm font-medium transition disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ background: 'var(--t-brand)' }}
              >
                {saving ? 'Salvando…' : 'Aplicar'}
              </button>
            </div>

            <p className="text-xs mt-2" style={{ color: custom && !customIsValid ? '#f87171' : undefined }}>
              {custom && !customIsValid
                ? 'Faltam dígitos — o código tem 6, como b5476b.'
                : <span className="text-gray-400">Escolha na roleta ou cole o código da sua marca.</span>}
            </p>

            {brand.toLowerCase() !== DEFAULT_BRAND && (
              <button
                onClick={() => void persist(DEFAULT_BRAND)}
                disabled={saving}
                className="mt-3 text-sm transition text-gray-500 hover:text-gray-900 underline"
              >
                Restaurar cor padrão
              </button>
            )}
          </div>

          {/* Prévia */}
          <div className="mt-5 rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-3">Prévia</p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-5 py-2 rounded-full text-white text-sm font-medium" style={{ background: 'var(--t-brand)' }}>
                Confirmar
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium" style={{ background: 'var(--t-brand-soft)', color: 'var(--t-brand)' }}>
                09:00
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--t-brand)' }}>R$ 80,00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
