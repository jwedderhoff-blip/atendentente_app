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
const DAY_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

interface ServiceSchedule {
  id: string
  service_id: string
  day_of_week: number
  time: string
  max_spots: number
}

interface DayEntry {
  time: string
  spots: number
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  duration_minutes: z.number().min(15, 'Mínimo 15 minutos'),
  price: z.number().min(0, 'Preço inválido'),
  active: z.boolean(),
  schedule_type: z.enum(['fixed', 'flexible']),
  max_spots: z.number().min(1, 'Mínimo 1 vaga'),
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
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [dayEntry, setDayEntry] = useState<DayEntry>({ time: '08:00', spots: 1 })
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { active: true, schedule_type: 'flexible' } })

  const scheduleType = watch('schedule_type')

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', duration_minutes: 60, price: 0, active: true, schedule_type: 'flexible', max_spots: 1 })
    setModalOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    reset({ ...s, schedule_type: s.schedule_type ?? 'flexible', max_spots: s.max_spots ?? 1 })
    setModalOpen(true)
  }

  const openSchedules = async (s: Service) => {
    setSchedulesModal(s)
    setActiveDay(null)
    const { data } = await supabase
      .from('service_schedules')
      .select('*')
      .eq('service_id', s.id)
      .order('day_of_week')
      .order('time')
    setSchedules((data ?? []) as ServiceSchedule[])
  }

  const addSchedule = async () => {
    if (!schedulesModal || activeDay === null) return
    setSavingSchedule(true)
    setScheduleError(null)
    const { data, error } = await supabase
      .from('service_schedules')
      .insert({
        service_id: schedulesModal.id,
        day_of_week: activeDay,
        time: dayEntry.time,
        max_spots: dayEntry.spots,
      })
      .select()
      .single()
    if (error) {
      setScheduleError(error.message)
    } else if (data) {
      setSchedules((prev) =>
        [...prev, data as ServiceSchedule].sort(
          (a, b) => a.day_of_week - b.day_of_week || a.time.localeCompare(b.time)
        )
      )
      setActiveDay(null)
    }
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

  const schedulesByDay = (day: number) => schedules.filter((s) => s.day_of_week === day)

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
          <div>
            <p className="text-sm text-gray-700 mb-2 font-medium">Tipo de horário</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'flexible', label: 'Horário livre', desc: 'Cliente escolhe entre os disponíveis' },
                { value: 'fixed', label: 'Horário fixo', desc: 'Turnos pré-definidos pela semana' },
              ] as const).map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex flex-col gap-0.5 border rounded-xl p-3 cursor-pointer transition ${
                    scheduleType === value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <input type="radio" value={value} {...register('schedule_type')} className="sr-only" />
                  <span className="text-sm font-semibold text-gray-800">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </label>
              ))}
            </div>
          </div>
          {scheduleType === 'flexible' && (
            <div>
              <p className="text-sm text-gray-700 mb-1 font-medium">Vagas por horário</p>
              <p className="text-xs text-gray-400 mb-2">1 = exclusivo por profissional (barbearia). Mais de 1 = turma compartilhada (pilates).</p>
              <Input
                type="number"
                placeholder="1"
                error={errors.max_spots?.message}
                {...register('max_spots', { valueAsNumber: true })}
              />
            </div>
          )}
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

      {/* Modal horários fixos — grade semanal */}
      <Modal
        open={!!schedulesModal}
        onClose={() => { setSchedulesModal(null); setScheduleError(null); setActiveDay(null) }}
        title={`Horários — ${schedulesModal?.name ?? ''}`}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Clique em <strong>+</strong> ao lado do dia para adicionar um horário. Cada turma pode ter vários horários por semana.
          </p>

          {scheduleError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{scheduleError}</p>
          )}

          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
            {DAY_NAMES.map((_dayName, day) => {
              const daySlots = schedulesByDay(day)
              const isOpen = activeDay === day

              return (
                <div key={day} className="p-3">
                  {/* Cabeçalho do dia */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">{DAY_FULL[day]}</span>
                    <button
                      onClick={() => {
                        setActiveDay(isOpen ? null : day)
                        setDayEntry({ time: '08:00', spots: 1 })
                      }}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${
                        isOpen
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                      }`}
                    >
                      <Plus size={12} />
                      {isOpen ? 'Cancelar' : 'Adicionar'}
                    </button>
                  </div>

                  {/* Formulário inline */}
                  {isOpen && (
                    <div className="flex items-end gap-2 mb-2 bg-purple-50 rounded-lg p-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Horário</label>
                        <input
                          type="time"
                          value={dayEntry.time}
                          onChange={(e) => setDayEntry((prev) => ({ ...prev, time: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500 mb-1 block">Vagas</label>
                        <input
                          type="number"
                          min={1}
                          value={dayEntry.spots}
                          onChange={(e) => setDayEntry((prev) => ({ ...prev, spots: Number(e.target.value) }))}
                          className="w-full rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                        />
                      </div>
                      <button
                        onClick={addSchedule}
                        disabled={savingSchedule}
                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {savingSchedule ? '...' : 'OK'}
                      </button>
                    </div>
                  )}

                  {/* Slots do dia */}
                  {daySlots.length === 0 && !isOpen ? (
                    <p className="text-xs text-gray-400">Nenhum horário</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((sch) => (
                        <div
                          key={sch.id}
                          className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-lg"
                        >
                          <span className="font-semibold">{sch.time.slice(0, 5)}</span>
                          <span className="text-purple-400">·</span>
                          <span>{sch.max_spots}v</span>
                          <button
                            onClick={() => removeSchedule(sch.id)}
                            className="ml-1 text-purple-300 hover:text-red-500 transition"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Modal>
    </div>
  )
}
