import { useEffect, useState } from 'react'
import { Save, Copy, Check, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import type { WorkingHours } from '../../types'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const DEFAULT_HOURS: Omit<WorkingHours, 'id' | 'establishment_id'>[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i as WorkingHours['day_of_week'],
  open_time: '09:00',
  close_time: '18:00',
  is_open: i >= 1 && i <= 6,
}))

export default function Configuracoes() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const [hours, setHours] = useState<(WorkingHours | Omit<WorkingHours, 'id'>)[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const bookingUrl = establishment
    ? `${window.location.origin}/agendar/${establishment.slug}`
    : ''

  const copyLink = () => {
    void navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (!establishment) return
    supabase
      .from('working_hours')
      .select('*')
      .eq('establishment_id', establishment.id)
      .then(({ data }) => {
        if (data && data.length === 7) {
          setHours((data as WorkingHours[]).sort((a, b) => a.day_of_week - b.day_of_week))
        } else {
          setHours(DEFAULT_HOURS.map((h) => ({ ...h, establishment_id: establishment.id })))
        }
      })
  }, [establishment])

  const updateDay = (index: number, updates: Partial<WorkingHours>) => {
    setHours((prev) => prev.map((h, i) => (i === index ? { ...h, ...updates } : h)))
    setSaved(false)
  }

  const handleSave = async () => {
    if (!establishment) return
    setSaving(true)
    const payload = hours.map((h) => ({ ...h, establishment_id: establishment.id }))
    const { error } = await supabase.from('working_hours').upsert(payload, {
      onConflict: 'establishment_id,day_of_week',
    })
    if (!error) setSaved(true)
    setSaving(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <Button size="sm" onClick={handleSave} loading={saving}>
          <Save size={16} />
          {saved ? 'Salvo!' : 'Salvar'}
        </Button>
      </div>

      {establishment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Link de agendamento</h2>
          <p className="text-sm text-gray-500 mb-3">Compartilhe este link com seus clientes</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-purple-700 font-mono truncate">
              {bookingUrl}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-purple-400 hover:text-purple-700 transition"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-purple-400 hover:text-purple-700 transition"
            >
              <ExternalLink size={15} />
              Abrir
            </a>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Horários de funcionamento</h2>
          <p className="text-sm text-gray-500 mt-1">Configure os dias e horários de atendimento</p>
        </div>
        <div className="divide-y divide-gray-50">
          {hours.map((h, index) => (
            <div key={h.day_of_week} className="flex items-center gap-4 p-4 flex-wrap">
              <div className="w-24">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.is_open}
                    onChange={(e) => updateDay(index, { is_open: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {DAY_NAMES[h.day_of_week]}
                  </span>
                </label>
              </div>

              {h.is_open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => updateDay(index, { open_time: e.target.value })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                  <span className="text-gray-400 text-sm">até</span>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => updateDay(index, { close_time: e.target.value })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400">Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
