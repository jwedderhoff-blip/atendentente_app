import { useState } from 'react'
import { Plus, X, Clock, Users, CalendarDays, Check, ArrowRight, Trash2, Pencil } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'
import {
  HUES, INK, INK_SOFT, MUTED, LINE, SOFT_LINE, WEEKDAYS, WEEKDAYS_FULL,
  toMinutes, type DemoService, type Scenario,
} from './data'

const DURATIONS = [30, 45, 60, 90]
const PALETTE = [HUES.indigo, HUES.rose, HUES.sage, HUES.clay, HUES.plum, HUES.brass]

interface Props {
  scenario: Scenario
  services: DemoService[]
  onCreate: (s: DemoService) => void
  onAddSchedule: (serviceId: string, day: number, time: string) => void
  onRemoveSchedule: (serviceId: string, day: number, time: string) => void
  onDone: () => void
}

export default function SetupPanel({
  scenario, services, onCreate, onAddSchedule, onRemoveSchedule, onDone,
}: Props) {
  const isTurma = scenario.mode === 'turma'

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState('')
  const [spots, setSpots] = useState(6)
  const [instructor, setInstructor] = useState('')

  // Editor de horários fixos (turma)
  const [openService, setOpenService] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<number | null>(null)
  const [entryTime, setEntryTime] = useState('08:00')
  const [warning, setWarning] = useState<string | null>(null)

  const created = services.filter((s) => s.custom)

  const resetForm = () => {
    setName(''); setDescription(''); setDuration(60); setPrice(''); setSpots(6); setInstructor('')
  }

  const save = () => {
    if (!name.trim()) return
    const id = `custom-${Date.now()}`
    const svc: DemoService = {
      id,
      name: name.trim(),
      description: description.trim() || (isTurma ? 'Turma criada por você' : 'Serviço criado por você'),
      duration,
      price: Number(price) || 0,
      spots: isTurma ? spots : 1,
      instructor: isTurma ? (instructor.trim() || 'Você') : undefined,
      professionals: isTurma ? undefined : scenario.professionals.map((p) => p.id),
      fixed: isTurma ? [] : undefined,
      color: PALETTE[created.length % PALETTE.length],
      custom: true,
    }
    onCreate(svc)
    resetForm()
    setCreating(false)
    if (isTurma) setOpenService(id)
  }

  /** Valida contra o horário de funcionamento antes de gravar o horário. */
  const tryAddSchedule = (svc: DemoService, force = false) => {
    if (activeDay === null) return
    setWarning(null)

    if (!force) {
      if (scenario.closedDays.includes(activeDay)) {
        setWarning(`O estabelecimento não funciona ${WEEKDAYS_FULL[activeDay]}. Adicionar como exceção?`)
        return
      }
      const min = toMinutes(entryTime)
      if (min < scenario.openHour * 60 || min >= scenario.closeHour * 60) {
        const open = `${String(scenario.openHour).padStart(2, '0')}:00`
        const close = `${String(scenario.closeHour).padStart(2, '0')}:00`
        setWarning(`${entryTime} está fora do funcionamento (${open}–${close}). Adicionar como exceção?`)
        return
      }
    }

    onAddSchedule(svc.id, activeDay, entryTime)
    setActiveDay(null)
  }

  const inputCls = 'w-full rounded-xl border py-2.5 px-3 text-sm focus:outline-none'

  return (
    <div className="max-w-3xl">
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE, background: '#fff' }}>
        <div className="px-6 py-5 border-b flex items-center justify-between gap-4" style={{ borderColor: LINE }}>
          <div>
            <p className="font-display text-xl tracking-tight" style={{ color: INK }}>
              {isTurma ? 'Suas turmas' : 'Seus serviços'}
            </p>
            <p className="text-sm" style={{ color: MUTED }}>{scenario.establishment.name}</p>
          </div>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full text-white transition hover:opacity-90"
              style={{ background: HUES.indigo }}
            >
              <Plus size={15} />
              {isTurma ? 'Nova turma' : 'Novo serviço'}
            </button>
          )}
        </div>

        {/* ── Formulário ── */}
        {creating && (
          <div className="px-6 py-5 border-b" style={{ borderColor: LINE, background: '#faf9fd' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-medium text-sm" style={{ color: INK }}>
                {isTurma ? 'Nova turma' : 'Novo serviço'}
              </p>
              <button onClick={() => { setCreating(false); resetForm() }} style={{ color: MUTED }}>
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isTurma ? 'Ex: Yoga para iniciantes' : 'Ex: Corte Masculino'}
                  className={inputCls}
                  style={{ borderColor: SOFT_LINE }}
                  autoFocus
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Descrição</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Aparece para o cliente na hora de escolher"
                  className={inputCls}
                  style={{ borderColor: SOFT_LINE }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Duração</label>
                <div className="flex gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium border transition"
                      style={{
                        borderColor: duration === d ? HUES.indigo : SOFT_LINE,
                        background: duration === d ? HUES.indigo : '#fff',
                        color: duration === d ? '#fff' : INK,
                      }}
                    >
                      {d}min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Preço</label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="0,00"
                  inputMode="decimal"
                  className={inputCls}
                  style={{ borderColor: SOFT_LINE }}
                />
              </div>

              {isTurma && (
                <>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Vagas por horário</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSpots((s) => Math.max(2, s - 1))}
                        className="w-9 h-9 rounded-lg border text-sm" style={{ borderColor: SOFT_LINE, color: INK }}
                      >−</button>
                      <span className="font-display text-lg w-10 text-center" style={{ color: INK }}>{spots}</span>
                      <button
                        onClick={() => setSpots((s) => Math.min(30, s + 1))}
                        className="w-9 h-9 rounded-lg border text-sm" style={{ borderColor: SOFT_LINE, color: INK }}
                      >+</button>
                      <span className="text-xs ml-1" style={{ color: MUTED }}>alunos</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Instrutor</label>
                    <input
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      placeholder="Quem dá a aula"
                      className={inputCls}
                      style={{ borderColor: SOFT_LINE }}
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={save}
              disabled={!name.trim()}
              className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-medium transition disabled:opacity-35"
              style={{ background: HUES.indigo }}
            >
              <Check size={15} />
              {isTurma ? 'Criar turma' : 'Criar serviço'}
            </button>
          </div>
        )}

        {/* ── Lista ── */}
        <div className="divide-y" style={{ borderColor: LINE }}>
          {services.map((s) => {
            const scheduleOpen = openService === s.id
            const times = [...(s.fixed ?? [])].sort(
              (a, b) => a.day - b.day || a.time.localeCompare(b.time),
            )

            return (
              <div key={s.id} style={{ borderColor: LINE }}>
                <div className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <p className="font-medium text-sm" style={{ color: INK }}>{s.name}</p>
                      {s.custom && (
                        <span
                          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white font-medium"
                          style={{ background: HUES.sage }}
                        >
                          criado por você
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: MUTED }}>{s.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: INK_SOFT }}>
                      <span className="flex items-center gap-1"><Clock size={11} /> {s.duration}min</span>
                      <span>{formatCurrency(s.price)}</span>
                      {isTurma && <span className="flex items-center gap-1"><Users size={11} /> {s.spots} vagas</span>}
                      {isTurma && s.instructor && <span>com {s.instructor}</span>}
                    </div>

                    {/* Horários fixos já cadastrados */}
                    {isTurma && times.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {times.map(({ day, time }) => (
                          <span
                            key={`${day}-${time}`}
                            className="text-[11px] px-2 py-1 rounded-lg flex items-center gap-1.5"
                            style={{ background: `${s.color}14`, color: s.color }}
                          >
                            {WEEKDAYS[day]} {time}
                            {s.custom && (
                              <button onClick={() => onRemoveSchedule(s.id, day, time)} className="opacity-50 hover:opacity-100">
                                <Trash2 size={10} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {isTurma && times.length === 0 && (
                      <p className="text-[11px] mt-2.5" style={{ color: HUES.clay }}>
                        Sem horários ainda — o cliente não consegue se matricular.
                      </p>
                    )}
                  </div>

                  {isTurma && (
                    <button
                      onClick={() => { setOpenService(scheduleOpen ? null : s.id); setActiveDay(null); setWarning(null) }}
                      title="Horários fixos"
                      className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                      style={{ borderColor: scheduleOpen ? HUES.indigo : SOFT_LINE, color: scheduleOpen ? HUES.indigo : INK_SOFT }}
                    >
                      <CalendarDays size={13} />
                      Horários
                    </button>
                  )}
                </div>

                {/* ── Editor de horários ── */}
                {isTurma && scheduleOpen && (
                  <div className="px-6 pb-5" style={{ background: '#faf9fd' }}>
                    <p className="text-xs pt-4 mb-3" style={{ color: MUTED }}>
                      Clique no dia para adicionar um horário. A turma se repete toda semana nesses horários.
                    </p>

                    {warning && (
                      <div className="rounded-xl px-4 py-3 mb-3 text-sm" style={{ background: '#fef6e7', border: '1px solid #f5dfae' }}>
                        <p className="mb-2.5" style={{ color: '#8a5a00' }}>{warning}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => tryAddSchedule(s, true)}
                            className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                            style={{ background: HUES.clay }}
                          >
                            Sim, adicionar como exceção
                          </button>
                          <button
                            onClick={() => setWarning(null)}
                            className="flex-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-white"
                            style={{ border: '1px solid #f5dfae', color: '#8a5a00' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-7 gap-1.5">
                      {WEEKDAYS.map((label, day) => {
                        const active = activeDay === day
                        const count = (s.fixed ?? []).filter((f) => f.day === day).length
                        return (
                          <button
                            key={label}
                            onClick={() => { setActiveDay(active ? null : day); setWarning(null) }}
                            className="py-2 rounded-lg border text-center transition"
                            style={{
                              borderColor: active ? HUES.indigo : SOFT_LINE,
                              background: active ? HUES.indigo : '#fff',
                            }}
                          >
                            <span className="block text-[11px] font-medium" style={{ color: active ? '#fff' : INK }}>{label}</span>
                            <span className="block text-[10px]" style={{ color: active ? 'rgba(255,255,255,.75)' : count ? HUES.sage : MUTED }}>
                              {count ? `${count}h` : '—'}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {activeDay !== null && (
                      <div className="flex items-end gap-2 mt-3 rounded-xl p-3" style={{ background: '#fff', border: `1px solid ${SOFT_LINE}` }}>
                        <div className="flex-1">
                          <label className="text-[11px] block mb-1" style={{ color: MUTED }}>
                            Horário de {WEEKDAYS_FULL[activeDay]}
                          </label>
                          <input
                            type="time"
                            value={entryTime}
                            onChange={(e) => { setEntryTime(e.target.value); setWarning(null) }}
                            className="w-full rounded-lg border text-sm px-2 py-1.5"
                            style={{ borderColor: SOFT_LINE }}
                          />
                        </div>
                        <span className="text-xs pb-2" style={{ color: MUTED }}>{s.spots} vagas</span>
                        <button
                          onClick={() => tryAddSchedule(s)}
                          className="px-4 py-2 rounded-lg text-white text-xs font-medium"
                          style={{ background: HUES.indigo }}
                        >
                          Adicionar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Nudge para o ato 2 ── */}
      {created.length > 0 && (
        <div
          className="rounded-2xl border p-5 mt-5 flex flex-wrap items-center justify-between gap-4"
          style={{ borderColor: HUES.sage, background: `${HUES.sage}0d` }}
        >
          <div className="flex items-start gap-3">
            <Check size={18} className="mt-0.5 shrink-0" style={{ color: HUES.sage }} />
            <div>
              <p className="font-medium text-sm" style={{ color: INK }}>
                {created.length === 1 ? 'Pronto, já está no ar' : 'Prontos, já estão no ar'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                {isTurma
                  ? 'Sua turma já aparece para os alunos. Veja como fica do lado deles.'
                  : 'Seu serviço já aparece na página de agendamento. Veja como fica do lado do cliente.'}
              </p>
            </div>
          </div>
          <button
            onClick={onDone}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition hover:gap-3"
            style={{ background: HUES.sage }}
          >
            Ver o cliente agendando <ArrowRight size={15} />
          </button>
        </div>
      )}

      {created.length === 0 && (
        <p className="text-xs mt-4 flex items-center gap-2" style={{ color: MUTED }}>
          <Pencil size={12} />
          Crie {isTurma ? 'uma turma' : 'um serviço'} acima — ele vai aparecer para o cliente no próximo passo.
        </p>
      )}
    </div>
  )
}
