import { useEffect, useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit, Trash2, Clock, DollarSign, CalendarDays, X, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useServices } from '../../hooks/useServices'
import { useProfessionals } from '../../hooks/useProfessionals'
import { useWorkingHours } from '../../hooks/useWorkingHours'
import { usePlanLimits } from '../../hooks/usePlanLimits'
import { allowsClasses, segmentForCategory } from '../../lib/segments'
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
  price_mode: z.enum(['sessao', 'mensal']),
  active: z.boolean(),
  schedule_type: z.enum(['fixed', 'flexible']),
  max_spots: z.number().min(1, 'Mínimo 1 vaga'),
  sessions_per_week: z.number().min(1, 'Mínimo 1 aula/semana'),
})

type FormData = z.infer<typeof schema>

export default function Servicos() {
  const { user } = useAuth()
  const { establishment, role } = useEstablishment(user?.id)
  const isViewer = role === 'viewer'
  const { services, loading, createService, updateService, deleteService } = useServices(establishment?.id)
  const { professionals } = useProfessionals(establishment?.id)
  const { workingHours, loadingWorkingHours } = useWorkingHours(establishment?.id)
  const { limits } = usePlanLimits(establishment?.id)

  // Trava do plano: bloqueia novos serviços ao atingir o limite contratado.
  const maxServices = limits?.maxServices ?? null
  const atLimit = maxServices !== null && services.length >= maxServices

  // Linha do negócio: Estética só tem atendimento individual (sem turma).
  const canTurma = allowsClasses(establishment?.segment ?? segmentForCategory(establishment?.category))

  const [modalOpen, setModalOpen] = useState(false)
  const [schedulesModal, setSchedulesModal] = useState<Service | null>(null)
  const [editing, setEditing] = useState<Service | null>(null)
  const [selectedProfIds, setSelectedProfIds] = useState<string[]>([])
  const [allSchedules, setAllSchedules] = useState<ServiceSchedule[]>([])
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [dayEntry, setDayEntry] = useState<DayEntry>({ time: '08:00', spots: 1 })
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { active: true, schedule_type: 'flexible', price_mode: 'sessao', sessions_per_week: 1 } })

  const scheduleType = watch('schedule_type')
  const priceMode = watch('price_mode')

  // Carrega os horários fixos de todos os serviços de uma vez, para que cada
  // card já mostre o que foi cadastrado — como no demo — sem abrir o modal.
  useEffect(() => {
    if (!services || services.length === 0) {
      setAllSchedules([])
      return
    }
    const ids = services.map((s) => s.id)
    let cancelled = false
    supabase
      .from('service_schedules')
      .select('*')
      .in('service_id', ids)
      .order('day_of_week')
      .order('time')
      .then(({ data }) => {
        if (!cancelled) setAllSchedules((data ?? []) as ServiceSchedule[])
      })
    return () => { cancelled = true }
  }, [services])

  const schedulesByService = useMemo(() => {
    const map: Record<string, ServiceSchedule[]> = {}
    for (const sch of allSchedules) {
      ;(map[sch.service_id] ??= []).push(sch)
    }
    return map
  }, [allSchedules])

  const openCreate = () => {
    if (atLimit) return
    setEditing(null)
    setSelectedProfIds([])
    reset({ name: '', description: '', duration_minutes: 60, price: 0, price_mode: 'sessao', active: true, schedule_type: 'flexible', max_spots: 1, sessions_per_week: 1 })
    setModalOpen(true)
  }

  const openEdit = async (s: Service) => {
    setEditing(s)
    reset({ ...s, schedule_type: s.schedule_type ?? 'flexible', max_spots: s.max_spots ?? 1, price_mode: s.price_mode ?? 'sessao', sessions_per_week: s.sessions_per_week ?? 1 })
    // Carrega profissionais já associados ao serviço
    const { data } = await supabase
      .from('professional_services')
      .select('professional_id')
      .eq('service_id', s.id)
    setSelectedProfIds((data ?? []).map((r: { professional_id: string }) => r.professional_id))
    setModalOpen(true)
  }

  const toggleProf = (id: string) =>
    setSelectedProfIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])

  const openSchedules = (s: Service) => {
    // Os horários já estão carregados (allSchedules); o modal só abre a grade.
    setSchedulesModal(s)
    setActiveDay(null)
  }

  const addSchedule = async (forceException = false) => {
    if (!schedulesModal || activeDay === null) return
    setScheduleError(null)

    if (!forceException) {
      const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
      const wh = workingHours.find((h) => h.day_of_week === activeDay)
      if (!wh || !wh.is_open) {
        setScheduleWarning(
          `O estabelecimento não funciona ${DAY_FULL[activeDay]}. Deseja adicionar este horário mesmo assim como exceção?`,
        )
        return
      }
      const scheduleMin = toMin(dayEntry.time)
      const openMin = toMin(wh.open_time)
      const closeMin = toMin(wh.close_time)
      if (scheduleMin < openMin || scheduleMin >= closeMin) {
        setScheduleWarning(
          `Horário ${dayEntry.time} fora do funcionamento ${DAY_FULL[activeDay]} (${wh.open_time.slice(0, 5)}–${wh.close_time.slice(0, 5)}). Deseja adicionar como exceção?`,
        )
        return
      }
    }

    setScheduleWarning(null)
    setSavingSchedule(true)
    const { data, error } = await supabase
      .from('service_schedules')
      .insert({
        service_id: schedulesModal.id,
        day_of_week: activeDay,
        time: dayEntry.time,
        max_spots: schedulesModal.max_spots ?? 1,
      })
      .select()
      .single()
    if (error) {
      setScheduleError(error.message)
    } else if (data) {
      setAllSchedules((prev) =>
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
    setAllSchedules((prev) => prev.filter((s) => s.id !== id))
  }

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!establishment) return
    // Atendimento individual sempre tem exatamente 1 vaga
    if (data.schedule_type === 'flexible') data.max_spots = 1
    let serviceId: string
    if (editing) {
      await updateService(editing.id, data)
      serviceId = editing.id
    } else {
      const { service, error } = await createService({ ...data, establishment_id: establishment.id })
      if (error || !service) return
      serviceId = service.id
    }
    // Salva associação profissional ↔ serviço
    await supabase.from('professional_services').delete().eq('service_id', serviceId)
    if (selectedProfIds.length > 0) {
      await supabase.from('professional_services').insert(
        selectedProfIds.map((professional_id) => ({ professional_id, service_id: serviceId }))
      )
    }
    setModalOpen(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este serviço? Esta ação não pode ser desfeita.')) return
    setDeleteError(null)
    const { error } = await deleteService(id)
    if (error) {
      if (error.includes('foreign key') || error.includes('violates') || error.includes('referenced')) {
        setDeleteError('Não é possível excluir: este serviço possui agendamentos vinculados. Desative-o em vez de excluir.')
      } else {
        setDeleteError(`Erro ao excluir: ${error}`)
      }
    }
  }

  const schedulesByDay = (day: number) =>
    allSchedules.filter((s) => s.service_id === schedulesModal?.id && s.day_of_week === day)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink">Serviços</h1>
          {maxServices !== null && (
            <p className="text-xs text-gray-400 mt-1">
              {services.length} de {maxServices} do seu plano{limits?.planName ? ` (${limits.planName})` : ''}
            </p>
          )}
        </div>
        {!isViewer && (
          <Button size="sm" onClick={openCreate} disabled={atLimit}>
            <Plus size={16} />
            Novo serviço
          </Button>
        )}
      </div>

      {atLimit && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Você atingiu o limite de <strong>{maxServices}</strong> {maxServices === 1 ? 'serviço' : 'serviços'} do seu
          plano{limits?.planName ? ` (${limits.planName})` : ''}. Para cadastrar mais, faça upgrade do plano.
        </div>
      )}

      {deleteError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          {services.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Nenhum serviço cadastrado.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {services.map((s) => {
                const linkedPros = professionals.filter((p) => p.services.includes(s.id))
                return (
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
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} /> {s.duration_minutes}min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <DollarSign size={12} /> {formatCurrency(s.price)}{s.price_mode === 'mensal' ? '/mês' : ''}
                      </span>
                      {linkedPros.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-indigo-600">
                          <User size={12} /> {linkedPros.map((p) => p.name).join(', ')}
                        </span>
                      )}
                    </div>
                    {/* Horários fixos direto no card, como no demo */}
                    {(schedulesByService[s.id]?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {schedulesByService[s.id].map((sch) => (
                          <span
                            key={sch.id}
                            className="inline-flex items-center gap-1 text-xs font-medium bg-brand-soft text-brand px-2 py-0.5 rounded-md"
                          >
                            <CalendarDays size={11} className="opacity-70" />
                            {DAY_NAMES[sch.day_of_week]} {sch.time.slice(0, 5)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {!isViewer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openSchedules(s)}
                        title="Horários fixos"
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      >
                        <CalendarDays size={16} />
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
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
                  )}
                </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* Modal criar/editar serviço */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar serviço' : 'Novo serviço'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Pilates Iniciante" error={errors.name?.message} {...register('name')} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <textarea
              rows={5}
              placeholder={'Descreva o serviço em detalhes...\n\nVocê pode usar parágrafos separados para organizar melhor o conteúdo.'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none leading-relaxed"
              {...register('description')}
            />
            {errors.description?.message && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Duração (min)"
              type="number"
              placeholder="60"
              error={errors.duration_minutes?.message}
              {...register('duration_minutes', { valueAsNumber: true })}
            />
            <Input
              label={priceMode === 'mensal' ? 'Mensalidade (R$)' : 'Preço (R$)'}
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.price?.message}
              {...register('price', { valueAsNumber: true })}
            />
          </div>
          {/* schedule_type e price_mode ficam registrados; o seletor abaixo os
              define de uma vez. Em Estética não há turma: sempre individual/sessão. */}
          <input type="hidden" {...register('schedule_type')} />
          <input type="hidden" {...register('price_mode')} />

          {canTurma && (
            <div>
              <p className="text-sm text-gray-700 mb-2 font-medium">Este serviço é individual ou em turma?</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  {
                    kind: 'individual', st: 'flexible', pm: 'sessao',
                    label: 'Atendimento individual',
                    desc: '1 cliente por horário · cobrança por sessão',
                  },
                  {
                    kind: 'turma', st: 'fixed', pm: 'mensal',
                    label: 'Turma / aula coletiva',
                    desc: 'Várias vagas por horário · mensalidade',
                  },
                ] as const).map(({ kind, st, pm, label, desc }) => {
                  const selected = (scheduleType === 'fixed') === (kind === 'turma')
                  return (
                    <button
                      type="button"
                      key={kind}
                      onClick={() => {
                        setValue('schedule_type', st)
                        setValue('price_mode', pm)
                      }}
                      className={`flex flex-col gap-0.5 border rounded-xl p-3 text-left transition ${
                        selected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      <span className="text-sm font-semibold text-gray-800">{label}</span>
                      <span className="text-xs text-gray-500">{desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {canTurma && scheduleType === 'fixed' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-700 mb-1 font-medium">Vagas por turno</p>
                <p className="text-xs text-gray-400 mb-2">Quantos clientes por horário. Ao lotar, o horário é bloqueado.</p>
                <Input
                  type="number"
                  placeholder="10"
                  error={errors.max_spots?.message}
                  {...register('max_spots', { valueAsNumber: true })}
                />
              </div>
              <div>
                <p className="text-sm text-gray-700 mb-1 font-medium">Aulas por semana</p>
                <p className="text-xs text-gray-400 mb-2">Ex.: jiu-jitsu 2x/semana. Usado para conferir os horários.</p>
                <Input
                  type="number"
                  placeholder="2"
                  error={errors.sessions_per_week?.message}
                  {...register('sessions_per_week', { valueAsNumber: true })}
                />
              </div>
            </div>
          )}
          {professionals.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Profissionais que realizam este serviço</p>
              <p className="text-xs text-gray-400 mb-2">Se houver mais de um, o cliente poderá escolher na hora do agendamento.</p>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-3">
                {professionals.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedProfIds.includes(p.id)}
                      onChange={() => toggleProf(p.id)}
                      className="rounded accent-indigo-600"
                    />
                    {p.name}
                  </label>
                ))}
              </div>
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
            Clique em <strong>+</strong> ao lado do dia para adicionar um horário fixo.
            {schedulesModal && (schedulesModal.max_spots ?? 1) > 1
              ? ` Cada turma pode ter vários horários por semana (${schedulesModal.max_spots} vagas por horário).`
              : ' Serviço individual: 1 vaga por horário.'}
          </p>

          {schedulesModal && (schedulesModal.sessions_per_week ?? 1) > 1 && (() => {
            const days = new Set(allSchedules.filter((s) => s.service_id === schedulesModal.id).map((s) => s.day_of_week))
            const target = schedulesModal.sessions_per_week ?? 1
            const ok = days.size === target
            return (
              <div className={`text-sm rounded-xl px-4 py-3 ${ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                Esta turma tem <strong>{target} aulas por semana</strong>. Você cadastrou horários em <strong>{days.size}</strong> {days.size === 1 ? 'dia' : 'dias'}.
                {ok
                  ? ' ✓ Dias completos.'
                  : days.size < target
                    ? ` Faltam ${target - days.size} ${target - days.size === 1 ? 'dia' : 'dias'}.`
                    : ' Há mais dias do que o previsto — ajuste as aulas por semana ou os horários.'}
              </div>
            )
          })()}

          {scheduleError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{scheduleError}</p>
          )}

          {scheduleWarning && (
            <div className="text-sm bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-3">
              <p className="text-amber-800">{scheduleWarning}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => addSchedule(true)}
                  disabled={savingSchedule}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  Sim, adicionar como exceção
                </button>
                <button
                  onClick={() => setScheduleWarning(null)}
                  className="flex-1 bg-white border border-amber-300 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg transition hover:bg-amber-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
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
                        setScheduleWarning(null)
                        setScheduleError(null)
                      }}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition ${
                        isOpen
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                      }`}
                    >
                      <Plus size={12} />
                      {isOpen ? 'Cancelar' : 'Adicionar'}
                    </button>
                  </div>

                  {/* Formulário inline */}
                  {isOpen && (
                    <div className="flex items-end gap-2 mb-2 bg-indigo-50 rounded-lg p-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Horário</label>
                        <input
                          type="time"
                          value={dayEntry.time}
                          onChange={(e) => setDayEntry((prev) => ({ ...prev, time: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        />
                      </div>
                      {schedulesModal && (schedulesModal.max_spots ?? 1) > 1 && (
                        <span className="text-xs text-indigo-600 font-medium pb-2">
                          {schedulesModal.max_spots} vagas
                        </span>
                      )}
                      <button
                        onClick={() => addSchedule()}
                        disabled={savingSchedule || loadingWorkingHours}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                      >
                        {savingSchedule || loadingWorkingHours ? '...' : 'OK'}
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
                          className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-lg"
                        >
                          <span className="font-semibold">{sch.time.slice(0, 5)}</span>
                          <span className="text-indigo-400">·</span>
                          <span>{sch.max_spots}v</span>
                          <button
                            onClick={() => removeSchedule(sch.id)}
                            className="ml-1 text-indigo-300 hover:text-red-500 transition"
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
