import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import type { Client } from '../../types'

type CreateClient = (
  payload: Omit<Client, 'id' | 'created_at'>
) => Promise<{ client: Client | null; error: string | null }>

export default function NewClientModal({
  open,
  onClose,
  establishmentId,
  createClient,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  establishmentId: string | undefined
  createClient: CreateClient
  onCreated?: (client: Client) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setName(''); setPhone(''); setEmail(''); setError(null) }

  const submit = async () => {
    if (!establishmentId) return
    if (!name.trim() || !phone.trim()) {
      setError('Nome e telefone são obrigatórios.')
      return
    }
    setSaving(true)
    setError(null)
    const { client, error } = await createClient({
      establishment_id: establishmentId,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    })
    setSaving(false)
    if (error) { setError(error); return }
    if (client) onCreated?.(client)
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Cadastrar cliente">
      <div className="space-y-4">
        <p className="text-xs text-gray-400">
          Para alunos que procuram a academia pessoalmente. Se já existir um cadastro com o mesmo
          telefone, ele será reaproveitado (sem duplicar).
        </p>
        <Input label="Nome" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="WhatsApp / Telefone" placeholder="(47) 99999-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="E-mail (opcional)" type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" type="button" className="flex-1" onClick={() => { reset(); onClose() }}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1" loading={saving} onClick={submit}>
            <UserPlus size={16} />
            Cadastrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
