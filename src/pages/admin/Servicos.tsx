import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit, Trash2, Clock, DollarSign } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useServices } from '../../hooks/useServices'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency } from '../../lib/utils'
import type { Service } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  duration_minutes: z.number().min(15, 'Mínimo 15 minutos'),
  price: z.number().min(0, 'Preço inválido'),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

export default function Servicos() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const { services, loading, createService, updateService, deleteService } = useServices(establishment?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { active: true } })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', duration_minutes: 60, price: 0, active: true })
    setModalOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    reset(s)
    setModalOpen(true)
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!establishment) return
    if (editing) {
      await updateService(editing.id, data)
    } else {
      await createService({ ...data, establishment_id: establishment.id })
    }
    setModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este serviço?')) return
    await deleteService(id)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus size={16} />
          Novo serviço
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          {services.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Nenhum serviço cadastrado.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {services.map((s) => (
                <li key={s.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      {!s.active && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} /> {s.duration_minutes}min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <DollarSign size={12} /> {formatCurrency(s.price)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar serviço' : 'Novo serviço'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Corte masculino" error={errors.name?.message} {...register('name')} />
          <Input label="Descrição (opcional)" placeholder="Breve descrição..." error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duração (min)"
              type="number"
              placeholder="60"
              error={errors.duration_minutes?.message}
              {...register('duration_minutes', { valueAsNumber: true })}
            />
            <Input
              label="Preço (R$)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" {...register('active')} className="rounded" />
            Serviço ativo
          </label>
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
