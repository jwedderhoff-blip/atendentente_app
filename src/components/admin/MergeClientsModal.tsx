import { useState } from 'react'
import { Merge, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import type { Client } from '../../types'

const selectCls =
  'rounded-xl border border-gray-200 text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand w-full'

export default function MergeClientsModal({
  open,
  onClose,
  clients,
  onMerged,
}: {
  open: boolean
  onClose: () => void
  clients: Client[]
  onMerged?: () => void
}) {
  const [keepId, setKeepId] = useState('')
  const [removeId, setRemoveId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setKeepId(''); setRemoveId(''); setError(null) }

  const keep = clients.find((c) => c.id === keepId)
  const remove = clients.find((c) => c.id === removeId)

  const submit = async () => {
    if (!keepId || !removeId) { setError('Escolha os dois cadastros.'); return }
    if (keepId === removeId) { setError('Selecione clientes diferentes.'); return }
    if (!confirm(
      `Mesclar "${remove?.name}" em "${keep?.name}"?\n\nTodas as reservas, matrículas, mensalidades e movimentações de caixa passarão para "${keep?.name}", e "${remove?.name}" será excluído. Esta ação não pode ser desfeita.`
    )) return
    setSaving(true)
    setError(null)
    const { error } = await supabase.rpc('merge_clients', { p_keep: keepId, p_remove: removeId })
    setSaving(false)
    if (error) { setError(error.message); return }
    reset()
    onMerged?.()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Mesclar clientes duplicados">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Quando o mesmo aluno tem dois cadastros (ex.: reserva pelo app com nome diferente),
          escolha qual manter. Tudo do duplicado é transferido para o mantido.
        </p>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Manter este cadastro</label>
          <select value={keepId} onChange={(e) => setKeepId(e.target.value)} className={selectCls}>
            <option value="">Selecione…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center text-gray-300">
          <ArrowRight size={18} className="rotate-90" />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mesclar (excluir) este</label>
          <select value={removeId} onChange={(e) => setRemoveId(e.target.value)} className={selectCls}>
            <option value="">Selecione…</option>
            {clients.filter((c) => c.id !== keepId).map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" type="button" className="flex-1" onClick={() => { reset(); onClose() }}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1" loading={saving} onClick={submit} disabled={!keepId || !removeId}>
            <Merge size={16} />
            Mesclar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
