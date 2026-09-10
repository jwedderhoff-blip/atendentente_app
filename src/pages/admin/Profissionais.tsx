import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit, Trash2, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useProfessionals } from '../../hooks/useProfessionals'
import { useServices } from '../../hooks/useServices'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import type { Professional } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function Profissionais() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const { professionals, loading, createProfessional, updateProfessional, deleteProfessional } =
    useProfessionals(establishment?.id)
  const { services } = useServices(establishment?.id)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Professional | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '' })
    setModalOpen(true)
  }

  const openEdit = (p: Professional) => {
    setEditing(p)
    reset({ name: p.name })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    if (!establishment) return
    if (editing) {
      await updateProfessional(editing.id, data.name, editing.services)
    } else {
      await createProfessional(data.name, [], establishment.id)
    }
    setModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este profissional?')) return
    await deleteProfessional(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl tracking-tight text-ink">Profissionais</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} />
          Novo profissional
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          {professionals.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              Nenhum profissional cadastrado.
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {professionals.map((p) => {
                const proServices = services.filter((s) => p.services.includes(s.id))
                return (
                  <li key={p.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <User size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {proServices.length > 0
                          ? proServices.map((s) => s.name).join(', ')
                          : 'Sem serviços associados — associe pelo serviço'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {professionals.length > 0 && (
            <p className="p-4 border-t border-gray-50 text-xs text-gray-400">
              Para associar profissionais a serviços, edite o serviço na aba Serviços.
            </p>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar profissional' : 'Novo profissional'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            placeholder="Ex: Carlos Oliveira"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" type="button" className="flex-1" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} className="flex-1">
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
