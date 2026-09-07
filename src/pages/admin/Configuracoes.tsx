import { useEffect, useState } from 'react'
import { Save, Copy, Check, ExternalLink, CalendarDays, Building2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import type { WorkingHours } from '../../types'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const CATEGORIES = [
  { value: 'salao',                label: 'Salão de Beleza' },
  { value: 'barbearia',           label: 'Barbearia' },
  { value: 'estetica',            label: 'Estética' },
  { value: 'pilates',             label: 'Pilates' },
  { value: 'avaliacao_fisica',    label: 'Avaliação Física' },
  { value: 'avaliacao_nutricional', label: 'Avaliação Nutricional' },
  { value: 'academia',            label: 'Academia' },
  { value: 'outro',               label: 'Outro' },
]

const DEFAULT_HOURS: Omit<WorkingHours, 'id' | 'establishment_id'>[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i as WorkingHours['day_of_week'],
  open_time: '09:00',
  close_time: '18:00',
  is_open: i >= 1 && i <= 6,
}))

const inputCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'

export default function Configuracoes() {
  const { user } = useAuth()
  const { establishment, updateEstablishment } = useEstablishment(user?.id)

  // ── Dados do estabelecimento ──
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [address, setAddress]   = useState('')
  const [category, setCategory] = useState('')
  const [slug, setSlug]         = useState('')
  const [savingData, setSavingData] = useState(false)
  const [savedData, setSavedData]   = useState(false)
  const [dataError, setDataError]   = useState<string | null>(null)

  useEffect(() => {
    if (!establishment) return
    setName(establishment.name ?? '')
    setEmail(establishment.email ?? '')
    setPhone(establishment.phone ?? '')
    setAddress(establishment.address ?? '')
    setCategory(establishment.category ?? 'outro')
    setSlug(establishment.slug ?? '')
  }, [establishment])

  const handleSaveData = async () => {
    setSavingData(true)
    setSavedData(false)
    setDataError(null)
    const { error } = await updateEstablishment({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      category: category as never,
      slug: slug.trim(),
    })
    if (error) setDataError(error)
    else setSavedData(true)
    setSavingData(false)
  }

  // ── Link de agendamento ──
  const [copied, setCopied]       = useState(false)
  const [copiedCal, setCopiedCal] = useState(false)

  const bookingUrl = establishment
    ? `${window.location.origin}/agendar/${establishment.slug}`
    : ''
  const icalUrl = establishment
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ical/${establishment.slug}`
    : ''

  const copyLink = () => {
    void navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const copyIcal = () => {
    void navigator.clipboard.writeText(icalUrl)
    setCopiedCal(true)
    setTimeout(() => setCopiedCal(false), 2000)
  }

  // ── Horários ──
  const [hours, setHours]   = useState<(WorkingHours | Omit<WorkingHours, 'id'>)[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

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

  const handleSaveHours = async () => {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      {/* ── Dados do Estabelecimento ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Building2 size={16} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Dados do estabelecimento</h2>
            <p className="text-xs text-gray-400">Nome, contato e informações públicas</p>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Nome do estabelecimento"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Slug (URL pública)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              className={inputCls}
              placeholder="meu-estabelecimento"
            />
            {slug !== establishment?.slug && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle size={11} />
                Alterar o slug muda o link público de agendamento.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="contato@exemplo.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Telefone / WhatsApp</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="(47) 99999-9999"
            />
          </div>

          <div className="sm:col-span-2 flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Endereço</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputCls}
              placeholder="Rua, número, bairro, cidade"
            />
          </div>
        </div>

        {dataError && (
          <p className="mx-5 mb-4 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{dataError}</p>
        )}

        <div className="px-5 pb-5">
          <Button size="sm" onClick={handleSaveData} loading={savingData}>
            <Save size={15} />
            {savedData ? 'Salvo!' : 'Salvar dados'}
          </Button>
        </div>
      </div>

      {/* ── Link de agendamento ── */}
      {establishment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Link de agendamento</h2>
          <p className="text-sm text-gray-500 mb-3">Compartilhe este link com seus clientes</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-indigo-700 font-mono truncate">
              {bookingUrl}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
            >
              {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
            >
              <ExternalLink size={15} />
              Abrir
            </a>
          </div>
        </div>
      )}

      {/* ── Google Agenda / iCal ── */}
      {establishment && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={16} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Google Agenda / iCal</h2>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Assine este link no Google Agenda para ver os agendamentos em tempo real.
            Válido para 30 dias anteriores e 90 dias futuros.
          </p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-indigo-700 font-mono truncate">
              {icalUrl}
            </div>
            <button
              onClick={copyIcal}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
            >
              {copiedCal ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copiedCal ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 space-y-1.5">
            <p className="font-semibold">Como assinar no Google Agenda:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Abra o Google Agenda no computador</li>
              <li>Clique em <strong>"+"</strong> ao lado de "Outros calendários"</li>
              <li>Selecione <strong>"A partir de URL"</strong></li>
              <li>Cole o link acima e clique em <strong>"Adicionar calendário"</strong></li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Horários de funcionamento ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Horários de funcionamento</h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure os dias e horários de atendimento</p>
          </div>
          <Button size="sm" onClick={handleSaveHours} loading={saving}>
            <Save size={15} />
            {saved ? 'Salvo!' : 'Salvar'}
          </Button>
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
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => updateDay(index, { open_time: e.target.value })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-gray-400 text-sm">até</span>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => updateDay(index, { close_time: e.target.value })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="text-gray-300 text-sm hidden sm:block">|</span>
                  <span className="text-xs text-gray-400">Intervalo:</span>
                  <input
                    type="time"
                    value={h.break_start ?? ''}
                    placeholder="--:--"
                    onChange={(e) => updateDay(index, { break_start: e.target.value || null })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-28"
                  />
                  <span className="text-gray-400 text-sm">até</span>
                  <input
                    type="time"
                    value={h.break_end ?? ''}
                    placeholder="--:--"
                    onChange={(e) => updateDay(index, { break_end: e.target.value || null })}
                    className="rounded-lg border border-gray-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-28"
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
