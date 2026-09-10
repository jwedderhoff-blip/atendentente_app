import { useState } from 'react'
import { useAdminNotifications } from '../../hooks/useAdminNotifications'
import { Mail, Send, Check, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  salao: 'Salão de Beleza', barbearia: 'Barbearia', estetica: 'Estética',
  beleza: 'Serviços de Beleza', pilates: 'Pilates', aulas_coletivas: 'Aulas Coletivas',
  avaliacao_fisica: 'Avaliação Física', avaliacao_nutricional: 'Avaliação Nutricional',
  academia: 'Academia', outro: 'Outro',
}

const STATUS_META: Record<string, { label: string; color: string; icon: typeof Check }> = {
  enviado: { label: 'Enviado', color: '#0ca30c', icon: Check },
  pendente: { label: 'Pendente', color: '#fab219', icon: Clock },
  falhou: { label: 'Falhou', color: '#d03b3b', icon: AlertTriangle },
}

const inputCls =
  'w-full rounded-xl border border-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20'

export default function SuperNotificacoes() {
  const { notifications, settings, loading, error, pendingCount, saveSettings, sendPending, refetch } =
    useAdminNotifications()

  const [email, setEmail] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  // Sincroniza o campo com o valor carregado, sem sobrescrever edição em curso
  const emailValue = dirty ? email : (settings?.notify_email ?? '')

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    const { error: err } = await saveSettings({ notify_email: emailValue.trim() })
    setMsg(err ? { text: err, ok: false } : { text: 'Configuração salva.', ok: true })
    if (!err) setDirty(false)
    setSaving(false)
  }

  const handleToggle = async (field: 'enabled' | 'on_new_signup', value: boolean) => {
    setMsg(null)
    const { error: err } = await saveSettings({ [field]: value })
    if (err) setMsg({ text: err, ok: false })
  }

  const handleSend = async () => {
    setSending(true)
    setMsg(null)
    const { error: err, sent } = await sendPending()
    setMsg(err
      ? { text: err, ok: false }
      : { text: sent > 0 ? `${sent} notificação(ões) enviada(s).` : 'Nada pendente para enviar.', ok: true })
    setSending(false)
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Carregando…</p>
  }

  if (error || !settings) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Notificações</h1>
        <p className="text-sm text-gray-500">
          Não foi possível carregar. Verifique se a migration
          {' '}<code className="text-xs">20260910_admin_notifications.sql</code>{' '}
          foi executada no Supabase.
        </p>
        {error && <p className="text-xs text-red-600 mt-2 font-mono">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        <p className="text-sm text-gray-500 mt-1">
          Avisos por e-mail quando um novo estabelecimento se cadastra na plataforma
        </p>
      </div>

      {msg && (
        <p className={`text-sm rounded-xl px-4 py-3 ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}

      {/* ── Configuração ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">
        <h2 className="font-semibold text-gray-900">Configuração</h2>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">E-mail que recebe os avisos</label>
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[240px] relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={emailValue}
                onChange={(e) => { setEmail(e.target.value); setDirty(true) }}
                className={`${inputCls} pl-9`}
                placeholder="voce@exemplo.com"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !dirty || !emailValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-40"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleToggle('enabled', e.target.checked)}
              className="accent-indigo-600 w-4 h-4"
            />
            <span className="text-sm text-gray-700">Notificações ativas</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.on_new_signup}
              onChange={(e) => handleToggle('on_new_signup', e.target.checked)}
              disabled={!settings.enabled}
              className="accent-indigo-600 w-4 h-4 disabled:opacity-40"
            />
            <span className={`text-sm ${settings.enabled ? 'text-gray-700' : 'text-gray-400'}`}>
              Avisar quando um novo estabelecimento se cadastrar
            </span>
          </label>
        </div>
      </div>

      {/* ── Fila ── */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h2 className="font-semibold text-gray-900">Histórico de envios</h2>
          <div className="flex gap-2">
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
            >
              <RefreshCw size={14} />
              Atualizar
            </button>
            <button
              onClick={handleSend}
              disabled={sending || pendingCount === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition disabled:opacity-40"
            >
              <Send size={14} />
              {sending ? 'Enviando…' : `Enviar pendentes${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          O envio roda automaticamente pelo agendador. Use o botão para disparar na hora.
        </p>

        {notifications.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhuma notificação ainda. O primeiro cadastro novo aparece aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="pb-2 pr-6 font-medium">Estabelecimento</th>
                  <th className="pb-2 pr-6 font-medium">Categoria</th>
                  <th className="pb-2 pr-6 font-medium">Contato</th>
                  <th className="pb-2 pr-6 font-medium">Quando</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {notifications.map((n) => {
                  const meta = STATUS_META[n.status] ?? STATUS_META.pendente
                  const Icon = meta.icon
                  return (
                    <tr key={n.id}>
                      <td className="py-2.5 pr-6 text-gray-900">{n.payload.name ?? '—'}</td>
                      <td className="py-2.5 pr-6 text-gray-500 whitespace-nowrap">
                        {CATEGORY_LABELS[n.payload.category ?? ''] ?? n.payload.category ?? '—'}
                      </td>
                      <td className="py-2.5 pr-6 text-gray-500">
                        <div>{n.payload.email ?? '—'}</div>
                        {n.payload.phone && <div className="text-xs text-gray-400">{n.payload.phone}</div>}
                      </td>
                      <td className="py-2.5 pr-6 text-gray-500 whitespace-nowrap">
                        {new Date(n.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5" style={{ color: meta.color }}>
                          <Icon size={14} />
                          <span className="text-xs font-medium">{meta.label}</span>
                        </span>
                        {n.error && (
                          <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate" title={n.error}>
                            {n.error}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
