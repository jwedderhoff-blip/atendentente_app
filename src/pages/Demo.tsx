import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowUpRight, Check, ChevronLeft, Clock, User,
  Calendar as CalendarIcon, Bell, Sparkles, RotateCcw, Phone, Store, Smartphone,
} from 'lucide-react'
import { mockEstablishment, mockServices, mockProfessionals, mockAppointments } from '../lib/mockData'
import { formatCurrency } from '../lib/utils'
import { cn } from '../lib/utils'
import type { Service, Professional } from '../types'

const HUES = {
  indigo: '#4f46e5',
  plum: '#7e3f8f',
  rose: '#b5476b',
  clay: '#c26a3c',
  brass: '#a8843c',
  sage: '#5a7d64',
}
const INK = '#14131c'
const INK_SOFT = '#57535f'
const MUTED = '#8d8893'
const PAPER = '#fbfaf8'
const LINE = '#e5e1d9'

const OPEN_HOUR = 9
const CLOSE_HOUR = 19
const SLOT_MINUTES = 30

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const STEPS = [
  { n: 1, label: 'Serviço' },
  { n: 2, label: 'Profissional' },
  { n: 3, label: 'Data e hora' },
  { n: 4, label: 'Seus dados' },
  { n: 5, label: 'Pronto' },
]

interface DemoAppt {
  id: string
  clientName: string
  serviceName: string
  professionalName: string
  start: Date
  end: Date
  durationMinutes: number
  price: number
  isNew?: boolean
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

/** Próximos 7 dias a partir de hoje. Domingo é fechado neste estabelecimento. */
function nextDays(count = 7): Date[] {
  const out: Date[] = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    out.push(d)
  }
  return out
}

/** Agendamentos já existentes na agenda fictícia, normalizados. */
function seededAppointments(): DemoAppt[] {
  return mockAppointments.map((a) => {
    const start = new Date(a.starts_at)
    const end = new Date(a.ends_at)
    return {
      id: a.id,
      clientName: a.client?.name ?? 'Cliente',
      serviceName: a.service?.name ?? 'Serviço',
      professionalName: a.professional?.name ?? 'Profissional',
      start,
      end,
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
      price: a.service?.price ?? 0,
    }
  })
}

export default function Demo() {
  const [step, setStep] = useState(1)
  const [service, setService] = useState<Service | null>(null)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [appointments, setAppointments] = useState<DemoAppt[]>(seededAppointments)
  const [justBooked, setJustBooked] = useState<string | null>(null)
  const ownerRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => nextDays(7), [])
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  // A agenda do dono acompanha o dia que o cliente está escolhendo
  const ownerDate = date ?? today

  const dayAppointments = useMemo(
    () => appointments.filter((a) => sameDay(a.start, ownerDate)).sort((x, y) => x.start.getTime() - y.start.getTime()),
    [appointments, ownerDate],
  )

  /** Horários livres para o serviço, profissional e dia escolhidos. */
  const slots = useMemo(() => {
    if (!service || !date) return []
    const taken = appointments.filter(
      (a) => sameDay(a.start, date) && (!professional || a.professionalName === professional.name),
    )
    const out: { time: string; free: boolean }[] = []
    const now = new Date()

    for (let m = OPEN_HOUR * 60; m + service.duration_minutes <= CLOSE_HOUR * 60; m += SLOT_MINUTES) {
      const start = new Date(date)
      start.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const end = new Date(start.getTime() + service.duration_minutes * 60000)

      const overlaps = taken.some((a) => start < a.end && end > a.start)
      const inPast = start.getTime() < now.getTime()
      out.push({ time: hhmm(start), free: !overlaps && !inPast })
    }
    return out
  }, [service, professional, date, appointments])

  const eligibleProfessionals = useMemo(
    () => (service ? mockProfessionals.filter((p) => p.services.includes(service.id)) : []),
    [service],
  )

  const confirm = () => {
    if (!service || !professional || !date || !time) return
    const [h, m] = time.split(':').map(Number)
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    const end = new Date(start.getTime() + service.duration_minutes * 60000)
    const id = `novo-${Date.now()}`

    setAppointments((prev) => [
      ...prev,
      {
        id,
        clientName: clientName.trim() || 'Você',
        serviceName: service.name,
        professionalName: professional.name,
        start,
        end,
        durationMinutes: service.duration_minutes,
        price: service.price,
        isNew: true,
      },
    ])
    setJustBooked(id)
    setStep(5)

    // Em telas estreitas os dois painéis ficam empilhados; leva o olhar
    // para a agenda, que é onde o agendamento acabou de aparecer.
    if (window.innerWidth < 1024) {
      setTimeout(() => ownerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
    }
  }

  const reset = () => {
    setStep(1); setService(null); setProfessional(null); setDate(null); setTime(null)
    setClientName(''); setClientPhone('')
    setAppointments(seededAppointments())
    setJustBooked(null)
  }

  const back = () => {
    if (step === 3 && eligibleProfessionals.length <= 1) setStep(1)
    else setStep((s) => Math.max(1, s - 1))
  }

  const dayRevenue = dayAppointments.reduce((s, a) => s + a.price, 0)

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>
      <style>{`
        @keyframes pop-in {
          0%   { opacity: 0; transform: translateY(10px) scale(.98); }
          60%  { opacity: 1; }
          100% { opacity: 1; transform: none; }
        }
        @keyframes ring-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(79,70,229,.45); }
          70%  { box-shadow: 0 0 0 14px rgba(79,70,229,0); }
          100% { box-shadow: 0 0 0 0 rgba(79,70,229,0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: none; }
        }
        .step-pane { animation: pop-in .5s cubic-bezier(.16,1,.3,1); }
        @media (prefers-reduced-motion: reduce) {
          .step-pane, [style*="pop-in"], [style*="ring-pulse"], [style*="slide-in-right"] { animation: none !important; }
        }
      `}</style>

      {/* ══ Topo ══ */}
      <header className="border-b" style={{ borderColor: LINE, background: 'rgba(251,250,248,.9)', backdropFilter: 'blur(10px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: INK_SOFT }}>
            <ArrowLeft size={16} />
            <span className="font-display text-lg tracking-tight" style={{ color: INK }}>Meridio</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full transition hover:bg-white"
              style={{ color: INK_SOFT, border: `1px solid ${LINE}` }}
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Recomeçar</span>
            </button>
            <Link
              to="/register"
              className="text-sm font-medium px-5 py-2 rounded-full text-white transition hover:opacity-90"
              style={{ background: HUES.indigo }}
            >
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ══ Introdução ══ */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-8" style={{ background: HUES.indigo }} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: HUES.indigo }}>
            Demonstração
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight max-w-3xl" style={{ color: INK }}>
          Agende como se fosse o cliente.
          <br />
          <em className="font-normal italic" style={{ color: HUES.indigo }}>Veja cair na agenda do salão.</em>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: INK_SOFT }}>
          Abaixo estão o celular do seu cliente e o seu painel. É o mesmo agendamento,
          visto dos dois lados — e nada aqui é salvo, pode clicar à vontade.
        </p>
      </div>

      {/* ══ Palco ══ */}
      <div className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* ─── Celular do cliente ─── */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={15} style={{ color: HUES.rose }} />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: HUES.rose }}>
              O cliente agenda
            </span>
          </div>

          {/* Moldura */}
          <div
            className="rounded-[2.25rem] p-3 mx-auto"
            style={{ background: INK, boxShadow: '0 30px 70px rgba(20,19,28,.28)', maxWidth: 380 }}
          >
            <div className="rounded-[1.75rem] overflow-hidden" style={{ background: '#fff' }}>
              {/* Barra do topo */}
              <div className="px-5 pt-4 pb-3" style={{ background: HUES.indigo }}>
                <div className="w-20 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,.35)' }} />
                <p className="text-white font-medium text-sm">{mockEstablishment.name}</p>
                <p className="text-white/70 text-xs">{mockEstablishment.address}</p>
              </div>

              {/* Trilha de etapas */}
              {step < 5 && (
                <div className="flex gap-1.5 px-5 pt-4">
                  {STEPS.slice(0, 4).map((s) => (
                    <div
                      key={s.n}
                      className="h-1 flex-1 rounded-full transition-all duration-500"
                      style={{ background: s.n <= step ? HUES.indigo : '#eceaf5' }}
                    />
                  ))}
                </div>
              )}

              <div className="p-5 min-h-[430px] flex flex-col">
                {step > 1 && step < 5 && (
                  <button onClick={back} className="flex items-center gap-1 text-xs mb-3 self-start" style={{ color: MUTED }}>
                    <ChevronLeft size={13} /> Voltar
                  </button>
                )}

                {/* 1 — serviço */}
                {step === 1 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>O que você precisa?</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>Escolha um serviço para continuar</p>
                    <div className="space-y-2.5">
                      {mockServices.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setService(s)
                            setProfessional(null); setDate(null); setTime(null)
                            const elig = mockProfessionals.filter((p) => p.services.includes(s.id))
                            setStep(elig.length > 1 ? 2 : 3)
                            if (elig.length === 1) setProfessional(elig[0])
                          }}
                          className="w-full text-left rounded-xl p-3.5 border transition hover:border-indigo-300 hover:bg-indigo-50/40"
                          style={{ borderColor: '#eceaf5' }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm" style={{ color: INK }}>{s.name}</p>
                              <p className="text-xs mt-0.5 leading-snug" style={{ color: MUTED }}>{s.description}</p>
                            </div>
                            <span className="text-sm font-semibold shrink-0" style={{ color: HUES.indigo }}>
                              {formatCurrency(s.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: MUTED }}>
                            <Clock size={11} /> {s.duration_minutes} min
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2 — profissional */}
                {step === 2 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>Com quem?</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>Profissionais que atendem {service?.name}</p>
                    <div className="space-y-2.5">
                      {eligibleProfessionals.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setProfessional(p); setDate(null); setTime(null); setStep(3) }}
                          className="w-full flex items-center gap-3 rounded-xl p-3.5 border transition hover:border-indigo-300 hover:bg-indigo-50/40"
                          style={{ borderColor: '#eceaf5' }}
                        >
                          <span
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0"
                            style={{ background: p.id === 'pro-1' ? HUES.rose : HUES.plum }}
                          >
                            {p.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}
                          </span>
                          <span className="font-medium text-sm" style={{ color: INK }}>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 — data e hora */}
                {step === 3 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>Quando fica bom?</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>Domingo o salão não abre</p>

                    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                      {days.map((d) => {
                        const closed = d.getDay() === 0
                        const active = date && sameDay(d, date)
                        return (
                          <button
                            key={d.toISOString()}
                            disabled={closed}
                            onClick={() => { setDate(d); setTime(null) }}
                            className="shrink-0 w-[52px] rounded-xl py-2 border text-center transition disabled:opacity-35 disabled:cursor-not-allowed"
                            style={{
                              borderColor: active ? HUES.indigo : '#eceaf5',
                              background: active ? HUES.indigo : '#fff',
                            }}
                          >
                            <span className="block text-[10px] uppercase" style={{ color: active ? 'rgba(255,255,255,.8)' : MUTED }}>
                              {WEEKDAYS[d.getDay()]}
                            </span>
                            <span className="block text-base font-semibold" style={{ color: active ? '#fff' : INK }}>
                              {d.getDate()}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {date ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 mt-4 max-h-[190px] overflow-y-auto pr-1">
                          {slots.map((s) => (
                            <button
                              key={s.time}
                              disabled={!s.free}
                              onClick={() => setTime(s.time)}
                              className="rounded-lg py-2 text-xs font-medium border transition disabled:opacity-30 disabled:line-through disabled:cursor-not-allowed"
                              style={{
                                borderColor: time === s.time ? HUES.indigo : '#eceaf5',
                                background: time === s.time ? HUES.indigo : '#fff',
                                color: time === s.time ? '#fff' : INK,
                              }}
                            >
                              {s.time}
                            </button>
                          ))}
                        </div>
                        <p className="text-[11px] mt-3 flex items-center gap-1.5" style={{ color: MUTED }}>
                          <span className="w-2.5 h-2.5 rounded border" style={{ borderColor: '#eceaf5', opacity: .4 }} />
                          Riscados já estão ocupados na agenda
                        </p>
                        <button
                          disabled={!time}
                          onClick={() => setStep(4)}
                          className="w-full mt-4 py-3 rounded-xl text-white text-sm font-medium transition disabled:opacity-35"
                          style={{ background: HUES.indigo }}
                        >
                          Continuar
                        </button>
                      </>
                    ) : (
                      <p className="text-xs mt-6 text-center" style={{ color: MUTED }}>Escolha um dia acima</p>
                    )}
                  </div>
                )}

                {/* 4 — dados */}
                {step === 4 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>Seus dados</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>Só o necessário para confirmar</p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: MUTED }}>Nome</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                          <input
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: '#eceaf5' }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: MUTED }}>WhatsApp</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                          <input
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="(11) 99999-0000"
                            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: '#eceaf5' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-3.5 mt-4 text-xs space-y-1.5" style={{ background: '#f7f6fb' }}>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>Serviço</span><span style={{ color: INK }}>{service?.name}</span></div>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>Com</span><span style={{ color: INK }}>{professional?.name}</span></div>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>Quando</span><span style={{ color: INK }}>{date && `${WEEKDAYS[date.getDay()]} ${date.getDate()}`} · {time}</span></div>
                      <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: LINE }}>
                        <span style={{ color: MUTED }}>Total</span>
                        <span className="font-semibold" style={{ color: HUES.indigo }}>{service && formatCurrency(service.price)}</span>
                      </div>
                    </div>

                    <button
                      onClick={confirm}
                      className="w-full mt-4 py-3 rounded-xl text-white text-sm font-medium transition hover:opacity-90"
                      style={{ background: HUES.indigo }}
                    >
                      Confirmar agendamento
                    </button>
                  </div>
                )}

                {/* 5 — pronto */}
                {step === 5 && (
                  <div className="step-pane flex-1 flex flex-col items-center justify-center text-center">
                    <span
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                      style={{ background: `${HUES.sage}1f`, animation: 'ring-pulse 1.6s ease-out 2' }}
                    >
                      <Check size={28} style={{ color: HUES.sage }} />
                    </span>
                    <h2 className="font-display text-2xl tracking-tight mb-2" style={{ color: INK }}>
                      Agendamento confirmado
                    </h2>
                    <p className="text-sm mb-1" style={{ color: INK_SOFT }}>
                      {service?.name} com {professional?.name}
                    </p>
                    <p className="text-sm font-medium mb-6" style={{ color: INK }}>
                      {date && `${WEEKDAYS[date.getDay()]}, ${date.getDate()}`} às {time}
                    </p>
                    <div className="rounded-xl p-3 text-xs flex items-start gap-2.5 text-left" style={{ background: `${HUES.sage}14` }}>
                      <Bell size={14} className="mt-0.5 shrink-0" style={{ color: HUES.sage }} />
                      <span style={{ color: INK_SOFT }}>
                        Lembrete automático no WhatsApp 24h antes e 2h antes. O cliente não esquece — e você não perde a vaga.
                      </span>
                    </div>
                    <button onClick={reset} className="mt-6 text-xs underline" style={{ color: MUTED }}>
                      Agendar outro horário
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Painel do dono ─── */}
        <div ref={ownerRef}>
          <div className="flex items-center gap-2 mb-4">
            <Store size={15} style={{ color: HUES.indigo }} />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: HUES.indigo }}>
              O dono acompanha
            </span>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE, background: '#fff' }}>
            {/* Cabeçalho do painel */}
            <div className="px-6 py-5 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: LINE }}>
              <div>
                <p className="font-display text-xl tracking-tight" style={{ color: INK }}>Agenda</p>
                <p className="text-sm" style={{ color: MUTED }}>
                  {sameDay(ownerDate, today) ? 'Hoje' : `${WEEKDAYS[ownerDate.getDay()]}, ${ownerDate.getDate()}`}
                  {' · '}{mockEstablishment.name}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="font-display text-2xl tracking-tight" style={{ color: INK }}>{dayAppointments.length}</p>
                  <p className="text-xs" style={{ color: MUTED }}>agendamentos</p>
                </div>
                <div>
                  <p className="font-display text-2xl tracking-tight" style={{ color: HUES.sage }}>{formatCurrency(dayRevenue)}</p>
                  <p className="text-xs" style={{ color: MUTED }}>previsto no dia</p>
                </div>
              </div>
            </div>

            {/* Aviso de novo agendamento */}
            {justBooked && (
              <div
                className="px-6 py-3.5 flex items-start gap-3 border-b"
                style={{ background: `${HUES.indigo}0f`, borderColor: LINE, animation: 'slide-in-right .5s cubic-bezier(.16,1,.3,1)' }}
              >
                <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: HUES.indigo }} />
                <div className="text-sm">
                  <p className="font-medium" style={{ color: INK }}>Novo agendamento recebido</p>
                  <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                    Entrou sozinho na agenda. O lembrete já foi programado — ninguém precisou digitar nada.
                  </p>
                </div>
              </div>
            )}

            {/* Linha do tempo do dia */}
            <div className="p-6">
              {dayAppointments.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarIcon size={26} className="mx-auto mb-3" style={{ color: LINE }} />
                  <p className="text-sm" style={{ color: MUTED }}>Nenhum agendamento neste dia.</p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>Escolha um horário no celular ao lado.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayAppointments.map((a) => {
                    const isNew = a.id === justBooked
                    return (
                      <div
                        key={a.id}
                        className={cn('flex items-stretch gap-4 rounded-xl border p-4 transition')}
                        style={{
                          borderColor: isNew ? HUES.indigo : LINE,
                          background: isNew ? `${HUES.indigo}0a` : '#fff',
                          animation: isNew ? 'pop-in .6s cubic-bezier(.16,1,.3,1)' : undefined,
                        }}
                      >
                        <div className="text-center shrink-0 w-14">
                          <p className="font-display text-lg leading-tight" style={{ color: isNew ? HUES.indigo : INK }}>
                            {hhmm(a.start)}
                          </p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{a.durationMinutes}min</p>
                        </div>
                        <div className="w-px" style={{ background: isNew ? HUES.indigo : LINE }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm" style={{ color: INK }}>{a.clientName}</p>
                            {isNew && (
                              <span
                                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white font-medium"
                                style={{ background: HUES.indigo }}
                              >
                                novo
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                            {a.serviceName} · {a.professionalName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium" style={{ color: INK }}>{formatCurrency(a.price)}</p>
                          <p className="text-[11px] flex items-center gap-1 justify-end mt-0.5" style={{ color: HUES.sage }}>
                            <Bell size={10} /> lembrete ativo
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* O que acabou de acontecer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: CalendarIcon, color: HUES.rose, title: 'Sem ida e volta', text: 'O cliente escolheu sozinho, vendo só os horários realmente livres.' },
              { icon: Bell, color: HUES.brass, title: 'Lembrete automático', text: 'WhatsApp 24h e 2h antes. Menos faltas, sem você lembrar de nada.' },
              { icon: Store, color: HUES.sage, title: 'Agenda sempre certa', text: 'O horário sai da lista no instante em que alguém reserva.' },
            ].map(({ icon: Icon, color, title, text }) => (
              <div key={title} className="rounded-xl border p-4" style={{ borderColor: LINE, background: '#fff' }}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}1a` }}>
                  <Icon size={16} style={{ color }} />
                </span>
                <p className="font-medium text-sm mb-1" style={{ color: INK }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: INK_SOFT }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Fecho */}
          <div className="rounded-2xl mt-6 p-8 text-center relative overflow-hidden" style={{ background: INK }}>
            <div
              className="absolute inset-0 opacity-25"
              style={{ backgroundImage: `radial-gradient(circle at 20% 40%, ${HUES.indigo} 0%, transparent 45%), radial-gradient(circle at 80% 60%, ${HUES.plum} 0%, transparent 45%)` }}
            />
            <div className="relative">
              <h3 className="font-display text-2xl text-white tracking-tight mb-2">
                É assim no seu negócio também
              </h3>
              <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
                Configure seus serviços e horários em menos de 5 minutos. Sem cartão de crédito.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-medium text-sm transition hover:gap-4"
                style={{ background: '#fff', color: INK }}
              >
                Criar minha conta grátis <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
