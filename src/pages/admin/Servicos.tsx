import { useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit, Trash2, Clock, DollarSign, CalendarDays, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useServices } from '../../hooks/useServices'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { formatCurrency } from '../../lib/utils'
import type { Service } from '../../types'

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface ServiceSchedule {
  id: string
  service_id: string
  day_of_week: number
  time: string
  max_spots: number
}

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
  const [schedulesModal, setSchedulesModal] = useState<Service | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([])
  const [newDay, setNewDay] = useState(1)
  const [newTime, setNewTime] = useState('08:00')
  const [newSpots, setNewSpots] = useState(1)
  const [savingSchedule, setSavingSchedule] = useState(false)

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

  const openSchedules = async (s: Service) => {
    setSchedulesModal(s)
    const { data } = await supabase
      .from('service_schedules')
      .select('*')
      .eq('service_id', s.id)
      .order('day_of_week')
      .order('time')
    setSchedules((data ?? []) as ServiceSchedule[])
  }

  const addSchedule = async () => {
    if (!schedulesModal) return
    setSavingSchedule(true)
    const { data, error } = await supabase
      .from('service_schedules')
      .insert({ service_id: schedulesModal.id, day_of_week: newDay, time: newTime, max_spots: newSpots })
      .select()
      .single()
    if (!error && data) setSchedules((prev) => [...prev, data as ServiceSchedule])
    setSavingSchedule(false)
  }

  const removeSchedule = async (id: string) => {
    await supabase.from('service_schedules').delete().eq('id', id)
    setSchedules((prev) => prev.filter((s) => s.id !== id))
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
                      onClick={() => openSchedules(s)}
                      title="Horários fixos"
                      className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                    >
                      <CalendarDays size={16} />
                    </button>
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

      {/* Modal criar/editar serviço */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar serviço' : 'Novo serviço'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Pilates Iniciante" error={errors.name?.message} {...register('name')} />
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

      {/* Modal horários fixos */}
      <Modal
        open={!!schedulesModal}
        onClose={() => setSchedulesModal(null)}
        title={`Horários fixos — ${schedulesModal?.name ?? ''}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Defina os dias e horários fixos para este serviço. Se houver horários fixos cadastrados, o cliente só verá essas opções ao agendar.
          </p>

          {/* Adicionar horário */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Adicionar horário</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Dia</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Horário</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Vagas</label>
                <input
                  type="number"
                  min={1}
                  value={newSpots}
                  onChange={(e) => setNewSpots(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 text-sm px-2 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>
            <Button size="sm" onClick={addSchedule} loading={savingSchedule} className="w-full">
              <Plus size={14} /> Adicionar
            </Button>
          </div>

          {/* Lista de horários */}
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nenhum horário fixo cadastrado.</p>
          ) : (
            <ul className="divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {schedules.map((sch) => (
                <li key={sch.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                      {DAY_NAMES[sch.day_of_week]}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{sch.time}</span>
                    <span className="text-xs text-gray-400">{sch.max_spots} vaga{sch.max_spots > 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => removeSchedule(sch.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  )
}
