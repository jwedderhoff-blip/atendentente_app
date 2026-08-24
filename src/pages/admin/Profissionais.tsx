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
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const openCreate = () => {
    setEditing(null)
    setSelectedServices([])
    reset({ name: '' })
    setModalOpen(true)
  }

  const openEdit = (p: Professional) => {
    setEditing(p)
    setSelectedServices(p.services)
    reset({ name: p.name })
    setModalOpen(true)
  }

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!establishment) return
    if (editing) {
      await updateProfessional(editing.id, data.name, selectedServices)
    } else {
      await createProfessional(data.name, selectedServices, establishment.id)
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
        <h1 className="text-2xl font-bold text-gray-900">Profissionais</h1>
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
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <User size={18} className="text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {proServices.length > 0
                          ? proServices.map((s) => s.name).join(', ')
                          : 'Sem serviços associados'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
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

          {services.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Serviços realizados</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {services.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedServices.includes(s.id)}
                      onChange={() => toggleService(s.id)}
                      className="rounded"
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}

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
