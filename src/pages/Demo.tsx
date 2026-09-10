import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, ArrowUpRight, Check, ChevronLeft, Clock, User, Users,
  Calendar as CalendarIcon, Bell, Sparkles, RotateCcw, Phone, Store, Smartphone,
} from 'lucide-react'
import { formatCurrency, cn } from '../lib/utils'

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
const SOFT_LINE = '#eceaf5'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Mode = 'individual' | 'turma'

interface DemoService {
  id: string
  name: string
  description: string
  duration: number
  price: number
  /** Turma: vagas por horário. Individual sempre 1. */
  spots: number
  instructor?: string
  professionals?: string[]
  /** Turma: dias da semana e horários fixos em que a aula acontece. */
  fixed?: { days: number[]; times: string[] }
  color: string
}

interface DemoProfessional { id: string; name: string; color: string }

interface Scenario {
  mode: Mode
  tab: string
  establishment: { name: string; address: string }
  services: DemoService[]
  professionals: DemoProfessional[]
  openHour: number
  closeHour: number
  closedDays: number[]
  pitch: string
}

/* ── Cenário 1: atendimento individual ─────────────────────────────────── */
const INDIVIDUAL: Scenario = {
  mode: 'individual',
  tab: 'Atendimento individual',
  establishment: { name: 'Salão Bella Vita', address: 'Rua das Flores, 123 — São Paulo/SP' },
  openHour: 9,
  closeHour: 19,
  closedDays: [0],
  pitch: 'Um cliente por horário. O sistema calcula os encaixes pela duração de cada serviço.',
  professionals: [
    { id: 'pro-1', name: 'Ana Silva', color: HUES.rose },
    { id: 'pro-2', name: 'Bruna Costa', color: HUES.plum },
  ],
  services: [
    { id: 'srv-1', name: 'Corte Feminino', description: 'Corte personalizado com lavagem e finalização', duration: 60, price: 80, spots: 1, professionals: ['pro-1', 'pro-2'], color: HUES.rose },
    { id: 'srv-2', name: 'Escova', description: 'Escova modeladora com produto premium', duration: 45, price: 60, spots: 1, professionals: ['pro-1', 'pro-2'], color: HUES.plum },
    { id: 'srv-3', name: 'Hidratação', description: 'Tratamento intensivo de hidratação profunda', duration: 90, price: 120, spots: 1, professionals: ['pro-1'], color: HUES.clay },
  ],
}

/* ── Cenário 2: turmas ─────────────────────────────────────────────────── */
const TURMA: Scenario = {
  mode: 'turma',
  tab: 'Turma / aula em grupo',
  establishment: { name: 'Studio Corpo em Movimento', address: 'Rua Harmonia, 88 — São Paulo/SP' },
  openHour: 7,
  closeHour: 21,
  closedDays: [0],
  pitch: 'Vários alunos no mesmo horário. As vagas caem em tempo real e a turma fecha sozinha ao lotar.',
  professionals: [],
  services: [
    { id: 'tur-1', name: 'Pilates Solo', description: 'Turma reduzida, foco em postura e core', duration: 55, price: 45, spots: 6, instructor: 'Ana Paula', fixed: { days: [1, 3, 5], times: ['07:00', '18:00', '19:30'] }, color: HUES.sage },
    { id: 'tur-2', name: 'Balé Infantil', description: 'Turma de 6 a 10 anos, iniciante', duration: 50, price: 40, spots: 8, instructor: 'Marina Duarte', fixed: { days: [2, 4], times: ['16:00', '17:00'] }, color: HUES.rose },
    { id: 'tur-3', name: 'Jiu-Jitsu Iniciante', description: 'Fundamentos e treino leve, sem contato pesado', duration: 60, price: 50, spots: 10, instructor: 'Diego Ramos', fixed: { days: [1, 3], times: ['20:00'] }, color: HUES.indigo },
  ],
}

const SCENARIOS = [INDIVIDUAL, TURMA]

/* ── Matrículas fictícias, por dia da semana e horário ──────────────────
   Chaveado por semana em vez de data absoluta: a turma parece cheia em
   qualquer dia que o visitante escolher. */
const SEEDED: Record<string, string[]> = {
  'tur-1|1|07:00': ['Camila R.', 'Fernanda A.', 'Juliana M.', 'Beatriz S.', 'Larissa P.'],
  'tur-1|1|18:00': ['Marcos V.', 'Renata L.'],
  'tur-1|1|19:30': ['Paula C.', 'Tatiane R.', 'Vinícius M.', 'Aline F.', 'Roberta N.', 'Sofia B.'],
  'tur-1|3|07:00': ['Camila R.', 'Juliana M.'],
  'tur-1|3|18:00': ['Renata L.', 'Beatriz S.', 'Larissa P.', 'Aline F.'],
  'tur-1|3|19:30': ['Paula C.', 'Sofia B.'],
  'tur-1|5|07:00': ['Fernanda A.', 'Beatriz S.', 'Marcos V.'],
  'tur-1|5|18:00': ['Camila R.'],
  'tur-1|5|19:30': ['Tatiane R.', 'Vinícius M.', 'Roberta N.'],
  'tur-2|2|16:00': ['Helena G.', 'Manuela T.', 'Alice V.', 'Cecília D.', 'Laura M.', 'Isabela K.', 'Maitê O.'],
  'tur-2|2|17:00': ['Valentina S.', 'Heloísa P.'],
  'tur-2|4|16:00': ['Alice V.', 'Laura M.', 'Cecília D.'],
  'tur-2|4|17:00': ['Manuela T.'],
  'tur-3|1|20:00': ['Rafael M.', 'Bruno C.', 'Thiago A.', 'Pedro H.'],
  'tur-3|3|20:00': ['Bruno C.', 'Lucas F.'],
}

/* ── Agenda fictícia do individual ─────────────────────────────────────── */
interface Booking {
  id: string
  serviceId: string
  clientName: string
  serviceName: string
  withName: string
  start: Date
  end: Date
  duration: number
  price: number
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

function seedIndividual(): Booking[] {
  const mk = (id: string, clientName: string, srv: DemoService, withName: string, d: Date): Booking => ({
    id, serviceId: srv.id, clientName, serviceName: srv.name, withName,
    start: d, end: new Date(d.getTime() + srv.duration * 60000),
    duration: srv.duration, price: srv.price,
  })
  const [corte, escova, hidra] = INDIVIDUAL.services
  return [
    mk('a1', 'Camila Rodrigues', corte, 'Ana Silva', at(0, 9)),
    mk('a2', 'Fernanda Alves', escova, 'Bruna Costa', at(0, 11)),
    mk('a3', 'Juliana Mendes', hidra, 'Ana Silva', at(0, 14)),
    mk('a4', 'Camila Rodrigues', corte, 'Bruna Costa', at(1, 10)),
    mk('a5', 'Fernanda Alves', escova, 'Ana Silva', at(2, 13)),
  ]
}

function nextDays(count = 7): Date[] {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d
  })
}

export default function Demo() {
  const [modeIdx, setModeIdx] = useState(0)
  const scenario = SCENARIOS[modeIdx]
  const isTurma = scenario.mode === 'turma'

  const [step, setStep] = useState(1)
  const [service, setService] = useState<DemoService | null>(null)
  const [professional, setProfessional] = useState<DemoProfessional | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')

  const [bookings, setBookings] = useState<Booking[]>(seedIndividual)
  const [enrolled, setEnrolled] = useState<Record<string, string[]>>({})
  const [justBooked, setJustBooked] = useState<string | null>(null)
  const ownerRef = useRef<HTMLDivElement>(null)

  const days = useMemo(() => nextDays(7), [])
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const ownerDate = date ?? today

  const resetFlow = () => {
    setStep(1); setService(null); setProfessional(null); setDate(null); setTime(null)
    setClientName(''); setClientPhone(''); setJustBooked(null)
  }

  const reset = () => {
    resetFlow()
    setBookings(seedIndividual())
    setEnrolled({})
  }

  const switchMode = (i: number) => {
    setModeIdx(i)
    reset()
  }

  /** Lista de matriculados numa turma, no dia e horário dados. */
  const rosterFor = (svcId: string, d: Date, t: string): string[] => {
    const key = `${svcId}|${d.getDay()}|${t}`
    return [...(SEEDED[key] ?? []), ...(enrolled[`${svcId}|${d.toDateString()}|${t}`] ?? [])]
  }

  /* ── Horários oferecidos ao cliente ── */
  const slots = useMemo(() => {
    if (!service || !date) return []

    if (isTurma) {
      if (!service.fixed || !service.fixed.days.includes(date.getDay())) return []
      const now = new Date()
      return service.fixed.times.map((t) => {
        const [h, m] = t.split(':').map(Number)
        const start = new Date(date); start.setHours(h, m, 0, 0)
        const taken = rosterFor(service.id, date, t).length
        const left = service.spots - taken
        return { time: t, free: left > 0 && start.getTime() > now.getTime(), left, total: service.spots }
      })
    }

    const taken = bookings.filter(
      (b) => sameDay(b.start, date) && (!professional || b.withName === professional.name),
    )
    const out: { time: string; free: boolean; left?: number; total?: number }[] = []
    const now = new Date()
    for (let m = scenario.openHour * 60; m + service.duration <= scenario.closeHour * 60; m += 30) {
      const start = new Date(date); start.setHours(Math.floor(m / 60), m % 60, 0, 0)
      const end = new Date(start.getTime() + service.duration * 60000)
      const overlaps = taken.some((b) => start < b.end && end > b.start)
      out.push({ time: hhmm(start), free: !overlaps && start.getTime() > now.getTime() })
    }
    return out
  }, [service, professional, date, bookings, enrolled, isTurma, scenario])

  const eligibleProfessionals = useMemo(
    () => (service?.professionals ? scenario.professionals.filter((p) => service.professionals!.includes(p.id)) : []),
    [service, scenario],
  )

  /* ── Etapas visíveis: turma pula a escolha de profissional ── */
  const activeSteps = isTurma ? [1, 3, 4] : [1, 2, 3, 4]

  const back = () => {
    const i = activeSteps.indexOf(step)
    if (i > 0) setStep(activeSteps[i - 1])
  }

  const confirm = () => {
    if (!service || !date || !time) return
    const name = clientName.trim() || 'Você'
    const id = `novo-${Date.now()}`

    if (isTurma) {
      const key = `${service.id}|${date.toDateString()}|${time}`
      setEnrolled((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), name] }))
      setJustBooked(`${service.id}|${time}`)
    } else {
      const [h, m] = time.split(':').map(Number)
      const start = new Date(date); start.setHours(h, m, 0, 0)
      setBookings((prev) => [...prev, {
        id, serviceId: service.id, clientName: name, serviceName: service.name,
        withName: professional?.name ?? '', start,
        end: new Date(start.getTime() + service.duration * 60000),
        duration: service.duration, price: service.price,
      }])
      setJustBooked(id)
    }

    setStep(5)
    // Empilhado no celular: leva o olhar até onde o agendamento apareceu.
    if (window.innerWidth < 1024) {
      setTimeout(() => ownerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 450)
    }
  }

  /* ── Dados do painel do dono ── */
  const dayBookings = useMemo(
    () => bookings.filter((b) => sameDay(b.start, ownerDate)).sort((a, b) => a.start.getTime() - b.start.getTime()),
    [bookings, ownerDate],
  )

  const dayClasses = useMemo(() => {
    if (!isTurma) return []
    const out: { svc: DemoService; time: string; roster: string[] }[] = []
    for (const svc of scenario.services) {
      if (!svc.fixed?.days.includes(ownerDate.getDay())) continue
      for (const t of svc.fixed.times) {
        out.push({ svc, time: t, roster: rosterFor(svc.id, ownerDate, t) })
      }
    }
    return out.sort((a, b) => a.time.localeCompare(b.time))
  }, [isTurma, ownerDate, enrolled, scenario])

  const dayRevenue = isTurma
    ? dayClasses.reduce((s, c) => s + c.roster.length * c.svc.price, 0)
    : dayBookings.reduce((s, b) => s + b.price, 0)

  const dayPeople = isTurma ? dayClasses.reduce((s, c) => s + c.roster.length, 0) : dayBookings.length

  return (
    <div className="min-h-screen" style={{ background: PAPER }}>
      <style>{`
        @keyframes pop-in { 0% { opacity:0; transform: translateY(10px) scale(.98);} 60%{opacity:1} 100%{opacity:1;transform:none} }
        @keyframes ring-pulse { 0%{box-shadow:0 0 0 0 rgba(79,70,229,.45)} 70%{box-shadow:0 0 0 14px rgba(79,70,229,0)} 100%{box-shadow:0 0 0 0 rgba(79,70,229,0)} }
        @keyframes slide-in-right { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:none} }
        @keyframes chip-in { from{opacity:0;transform:scale(.8)} to{opacity:1;transform:none} }
        .step-pane { animation: pop-in .5s cubic-bezier(.16,1,.3,1); }
        @media (prefers-reduced-motion: reduce) {
          .step-pane, [style*="pop-in"], [style*="ring-pulse"], [style*="slide-in-right"], [style*="chip-in"] { animation: none !important; }
        }
      `}</style>

      {/* ══ Topo ══ */}
      <header className="border-b sticky top-0 z-40" style={{ borderColor: LINE, background: 'rgba(251,250,248,.92)', backdropFilter: 'blur(10px)' }}>
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
            <Link to="/register" className="text-sm font-medium px-5 py-2 rounded-full text-white transition hover:opacity-90" style={{ background: HUES.indigo }}>
              Criar conta grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ══ Introdução ══ */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex items-center gap-3 mb-5">
          <span className="h-px w-8" style={{ background: HUES.indigo }} />
          <span className="text-xs uppercase tracking-[0.2em] font-medium" style={{ color: HUES.indigo }}>Demonstração</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight max-w-3xl" style={{ color: INK }}>
          Agende como se fosse o cliente.
          <br />
          <em className="font-normal italic" style={{ color: HUES.indigo }}>Veja cair na agenda do negócio.</em>
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: INK_SOFT }}>
          Abaixo estão o celular do seu cliente e o seu painel. É o mesmo agendamento,
          visto dos dois lados — e nada aqui é salvo, pode clicar à vontade.
        </p>

        {/* Alternador de cenário */}
        <div className="mt-8 inline-flex p-1 rounded-full" style={{ background: '#efece5' }}>
          {SCENARIOS.map((s, i) => (
            <button
              key={s.mode}
              onClick={() => switchMode(i)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                background: modeIdx === i ? '#fff' : 'transparent',
                color: modeIdx === i ? INK : MUTED,
                boxShadow: modeIdx === i ? '0 1px 3px rgba(20,19,28,.12)' : 'none',
              }}
            >
              {s.tab}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm max-w-xl" style={{ color: MUTED }}>{scenario.pitch}</p>
      </div>

      {/* ══ Palco ══ */}
      <div className="max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-start">

        {/* ─── Celular ─── */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={15} style={{ color: HUES.rose }} />
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: HUES.rose }}>
              {isTurma ? 'O aluno se matricula' : 'O cliente agenda'}
            </span>
          </div>

          <div className="rounded-[2.25rem] p-3 mx-auto" style={{ background: INK, boxShadow: '0 30px 70px rgba(20,19,28,.28)', maxWidth: 380 }}>
            <div className="rounded-[1.75rem] overflow-hidden" style={{ background: '#fff' }}>
              <div className="px-5 pt-4 pb-3" style={{ background: HUES.indigo }}>
                <div className="w-20 h-1 rounded-full mx-auto mb-3" style={{ background: 'rgba(255,255,255,.35)' }} />
                <p className="text-white font-medium text-sm">{scenario.establishment.name}</p>
                <p className="text-white/70 text-xs">{scenario.establishment.address}</p>
              </div>

              {step < 5 && (
                <div className="flex gap-1.5 px-5 pt-4">
                  {activeSteps.map((s) => (
                    <div key={s} className="h-1 flex-1 rounded-full transition-all duration-500" style={{ background: s <= step ? HUES.indigo : SOFT_LINE }} />
                  ))}
                </div>
              )}

              <div className="p-5 min-h-[440px] flex flex-col">
                {step > 1 && step < 5 && (
                  <button onClick={back} className="flex items-center gap-1 text-xs mb-3 self-start" style={{ color: MUTED }}>
                    <ChevronLeft size={13} /> Voltar
                  </button>
                )}

                {/* 1 — serviço / turma */}
                {step === 1 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>
                      {isTurma ? 'Qual turma?' : 'O que você precisa?'}
                    </h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>
                      {isTurma ? 'Escolha a aula que quer frequentar' : 'Escolha um serviço para continuar'}
                    </p>
                    <div className="space-y-2.5">
                      {scenario.services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setService(s); setProfessional(null); setDate(null); setTime(null)
                            if (isTurma) { setStep(3); return }
                            const elig = scenario.professionals.filter((p) => s.professionals?.includes(p.id))
                            if (elig.length === 1) { setProfessional(elig[0]); setStep(3) }
                            else setStep(2)
                          }}
                          className="w-full text-left rounded-xl p-3.5 border transition hover:bg-indigo-50/40"
                          style={{ borderColor: SOFT_LINE }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium text-sm" style={{ color: INK }}>{s.name}</p>
                              <p className="text-xs mt-0.5 leading-snug" style={{ color: MUTED }}>{s.description}</p>
                            </div>
                            <span className="text-sm font-semibold shrink-0" style={{ color: s.color }}>
                              {formatCurrency(s.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: MUTED }}>
                            <span className="flex items-center gap-1"><Clock size={11} /> {s.duration} min</span>
                            {isTurma && (
                              <>
                                <span className="flex items-center gap-1"><Users size={11} /> até {s.spots} alunos</span>
                                <span>com {s.instructor}</span>
                              </>
                            )}
                          </div>
                          {isTurma && s.fixed && (
                            <p className="text-[11px] mt-1.5" style={{ color: s.color }}>
                              {s.fixed.days.map((d) => WEEKDAYS[d]).join(' · ')} às {s.fixed.times.join(', ')}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2 — profissional (só individual) */}
                {step === 2 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>Com quem?</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>Profissionais que atendem {service?.name}</p>
                    <div className="space-y-2.5">
                      {eligibleProfessionals.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { setProfessional(p); setDate(null); setTime(null); setStep(3) }}
                          className="w-full flex items-center gap-3 rounded-xl p-3.5 border transition hover:bg-indigo-50/40"
                          style={{ borderColor: SOFT_LINE }}
                        >
                          <span className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium text-white shrink-0" style={{ background: p.color }}>
                            {p.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}
                          </span>
                          <span className="font-medium text-sm" style={{ color: INK }}>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 — data e horário */}
                {step === 3 && (
                  <div className="step-pane">
                    <h2 className="font-semibold text-lg mb-1" style={{ color: INK }}>Quando fica bom?</h2>
                    <p className="text-xs mb-4" style={{ color: MUTED }}>
                      {isTurma && service?.fixed
                        ? `${service.name} acontece ${service.fixed.days.map((d) => WEEKDAYS[d]).join(', ')}`
                        : 'Domingo não abre'}
                    </p>

                    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
                      {days.map((d) => {
                        const closedDay = scenario.closedDays.includes(d.getDay())
                        const noClass = isTurma && service?.fixed && !service.fixed.days.includes(d.getDay())
                        const off = closedDay || !!noClass
                        const active = date && sameDay(d, date)
                        return (
                          <button
                            key={d.toISOString()}
                            disabled={off}
                            onClick={() => { setDate(d); setTime(null) }}
                            className="shrink-0 w-[52px] rounded-xl py-2 border text-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ borderColor: active ? HUES.indigo : SOFT_LINE, background: active ? HUES.indigo : '#fff' }}
                          >
                            <span className="block text-[10px] uppercase" style={{ color: active ? 'rgba(255,255,255,.8)' : MUTED }}>{WEEKDAYS[d.getDay()]}</span>
                            <span className="block text-base font-semibold" style={{ color: active ? '#fff' : INK }}>{d.getDate()}</span>
                          </button>
                        )
                      })}
                    </div>

                    {date ? (
                      <>
                        {isTurma ? (
                          <div className="space-y-2 mt-4">
                            {slots.map((s) => {
                              const full = s.left !== undefined && s.left <= 0
                              const selected = time === s.time
                              const scarce = s.left !== undefined && s.left > 0 && s.left <= 2
                              return (
                                <button
                                  key={s.time}
                                  disabled={!s.free}
                                  onClick={() => setTime(s.time)}
                                  className="w-full flex items-center justify-between gap-3 rounded-xl p-3 border transition disabled:opacity-45 disabled:cursor-not-allowed"
                                  style={{
                                    borderColor: selected ? HUES.indigo : SOFT_LINE,
                                    background: selected ? `${HUES.indigo}0f` : '#fff',
                                  }}
                                >
                                  <span className="font-semibold text-sm" style={{ color: selected ? HUES.indigo : INK }}>{s.time}</span>
                                  <span className="flex items-center gap-2">
                                    {/* Pontinhos de vaga: ocupação legível de relance */}
                                    <span className="flex gap-1">
                                      {Array.from({ length: s.total ?? 0 }).map((_, i) => (
                                        <span
                                          key={i}
                                          className="w-1.5 h-1.5 rounded-full"
                                          style={{ background: i < (s.total! - s.left!) ? (service?.color ?? HUES.indigo) : SOFT_LINE }}
                                        />
                                      ))}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: full ? MUTED : scarce ? HUES.clay : INK_SOFT }}>
                                      {full ? 'esgotada' : `${s.left} ${s.left === 1 ? 'vaga' : 'vagas'}`}
                                    </span>
                                  </span>
                                </button>
                              )
                            })}
                            {slots.length === 0 && (
                              <p className="text-xs text-center py-6" style={{ color: MUTED }}>Sem aula neste dia.</p>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2 mt-4 max-h-[190px] overflow-y-auto pr-1">
                              {slots.map((s) => (
                                <button
                                  key={s.time}
                                  disabled={!s.free}
                                  onClick={() => setTime(s.time)}
                                  className="rounded-lg py-2 text-xs font-medium border transition disabled:opacity-30 disabled:line-through disabled:cursor-not-allowed"
                                  style={{
                                    borderColor: time === s.time ? HUES.indigo : SOFT_LINE,
                                    background: time === s.time ? HUES.indigo : '#fff',
                                    color: time === s.time ? '#fff' : INK,
                                  }}
                                >
                                  {s.time}
                                </button>
                              ))}
                            </div>
                            <p className="text-[11px] mt-3" style={{ color: MUTED }}>Riscados já estão ocupados na agenda</p>
                          </>
                        )}

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
                          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome"
                            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm focus:outline-none" style={{ borderColor: SOFT_LINE }} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs block mb-1.5" style={{ color: MUTED }}>WhatsApp</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: MUTED }} />
                          <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-0000"
                            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm focus:outline-none" style={{ borderColor: SOFT_LINE }} />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-3.5 mt-4 text-xs space-y-1.5" style={{ background: '#f7f6fb' }}>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>{isTurma ? 'Turma' : 'Serviço'}</span><span style={{ color: INK }}>{service?.name}</span></div>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>Com</span><span style={{ color: INK }}>{isTurma ? service?.instructor : professional?.name}</span></div>
                      <div className="flex justify-between"><span style={{ color: MUTED }}>Quando</span><span style={{ color: INK }}>{date && `${WEEKDAYS[date.getDay()]} ${date.getDate()}`} · {time}</span></div>
                      <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: LINE }}>
                        <span style={{ color: MUTED }}>Total</span>
                        <span className="font-semibold" style={{ color: HUES.indigo }}>{service && formatCurrency(service.price)}</span>
                      </div>
                    </div>

                    <button onClick={confirm} className="w-full mt-4 py-3 rounded-xl text-white text-sm font-medium transition hover:opacity-90" style={{ background: HUES.indigo }}>
                      {isTurma ? 'Garantir minha vaga' : 'Confirmar agendamento'}
                    </button>
                  </div>
                )}

                {/* 5 — pronto */}
                {step === 5 && (
                  <div className="step-pane flex-1 flex flex-col items-center justify-center text-center">
                    <span className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: `${HUES.sage}1f`, animation: 'ring-pulse 1.6s ease-out 2' }}>
                      <Check size={28} style={{ color: HUES.sage }} />
                    </span>
                    <h2 className="font-display text-2xl tracking-tight mb-2" style={{ color: INK }}>
                      {isTurma ? 'Vaga garantida' : 'Agendamento confirmado'}
                    </h2>
                    <p className="text-sm mb-1" style={{ color: INK_SOFT }}>
                      {service?.name} com {isTurma ? service?.instructor : professional?.name}
                    </p>
                    <p className="text-sm font-medium mb-6" style={{ color: INK }}>
                      {date && `${WEEKDAYS[date.getDay()]}, ${date.getDate()}`} às {time}
                    </p>
                    <div className="rounded-xl p-3 text-xs flex items-start gap-2.5 text-left" style={{ background: `${HUES.sage}14` }}>
                      <Bell size={14} className="mt-0.5 shrink-0" style={{ color: HUES.sage }} />
                      <span style={{ color: INK_SOFT }}>
                        Lembrete automático no WhatsApp 24h antes e 2h antes. {isTurma ? 'A vaga já saiu da lista para os outros alunos.' : 'O cliente não esquece — e você não perde a vaga.'}
                      </span>
                    </div>
                    <button onClick={resetFlow} className="mt-6 text-xs underline" style={{ color: MUTED }}>
                      {isTurma ? 'Matricular outro aluno' : 'Agendar outro horário'}
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
            <span className="text-xs uppercase tracking-[0.18em] font-medium" style={{ color: HUES.indigo }}>O dono acompanha</span>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: LINE, background: '#fff' }}>
            <div className="px-6 py-5 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: LINE }}>
              <div>
                <p className="font-display text-xl tracking-tight" style={{ color: INK }}>{isTurma ? 'Turmas do dia' : 'Agenda'}</p>
                <p className="text-sm" style={{ color: MUTED }}>
                  {sameDay(ownerDate, today) ? 'Hoje' : `${WEEKDAYS[ownerDate.getDay()]}, ${ownerDate.getDate()}`}
                  {' · '}{scenario.establishment.name}
                </p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="font-display text-2xl tracking-tight" style={{ color: INK }}>{dayPeople}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{isTurma ? 'alunos' : 'agendamentos'}</p>
                </div>
                <div>
                  <p className="font-display text-2xl tracking-tight" style={{ color: HUES.sage }}>{formatCurrency(dayRevenue)}</p>
                  <p className="text-xs" style={{ color: MUTED }}>previsto no dia</p>
                </div>
              </div>
            </div>

            {justBooked && (
              <div className="px-6 py-3.5 flex items-start gap-3 border-b" style={{ background: `${HUES.indigo}0f`, borderColor: LINE, animation: 'slide-in-right .5s cubic-bezier(.16,1,.3,1)' }}>
                <Sparkles size={16} className="mt-0.5 shrink-0" style={{ color: HUES.indigo }} />
                <div className="text-sm">
                  <p className="font-medium" style={{ color: INK }}>{isTurma ? 'Nova matrícula na turma' : 'Novo agendamento recebido'}</p>
                  <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>
                    {isTurma
                      ? 'A vaga saiu da lista na hora. Quando a turma lotar, ela fecha sozinha.'
                      : 'Entrou sozinho na agenda. O lembrete já foi programado — ninguém precisou digitar nada.'}
                  </p>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* ── Turmas ── */}
              {isTurma ? (
                dayClasses.length === 0 ? (
                  <div className="py-16 text-center">
                    <Users size={26} className="mx-auto mb-3" style={{ color: LINE }} />
                    <p className="text-sm" style={{ color: MUTED }}>Nenhuma turma neste dia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayClasses.map(({ svc, time: t, roster }) => {
                      const isNew = justBooked === `${svc.id}|${t}`
                      const left = svc.spots - roster.length
                      const pct = (roster.length / svc.spots) * 100
                      return (
                        <div
                          key={`${svc.id}-${t}`}
                          className="rounded-xl border p-4"
                          style={{
                            borderColor: isNew ? HUES.indigo : LINE,
                            background: isNew ? `${HUES.indigo}0a` : '#fff',
                            animation: isNew ? 'pop-in .6s cubic-bezier(.16,1,.3,1)' : undefined,
                          }}
                        >
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="text-center shrink-0 w-14">
                                <p className="font-display text-lg leading-tight" style={{ color: isNew ? HUES.indigo : INK }}>{t}</p>
                                <p className="text-[11px]" style={{ color: MUTED }}>{svc.duration}min</p>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm" style={{ color: INK }}>{svc.name}</p>
                                <p className="text-xs" style={{ color: INK_SOFT }}>com {svc.instructor}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium" style={{ color: left === 0 ? HUES.clay : INK }}>
                                {roster.length}/{svc.spots}
                              </p>
                              <p className="text-[11px]" style={{ color: MUTED }}>
                                {left === 0 ? 'turma cheia' : `${left} ${left === 1 ? 'vaga' : 'vagas'}`}
                              </p>
                            </div>
                          </div>

                          {/* Ocupação */}
                          <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: SOFT_LINE }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: left === 0 ? HUES.clay : svc.color }} />
                          </div>

                          {/* Lista de alunos */}
                          {roster.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {roster.map((person, i) => {
                                const highlight = isNew && i === roster.length - 1
                                return (
                                  <span
                                    key={`${person}-${i}`}
                                    className="text-[11px] px-2.5 py-1 rounded-full"
                                    style={{
                                      background: highlight ? HUES.indigo : '#f4f2ee',
                                      color: highlight ? '#fff' : INK_SOFT,
                                      fontWeight: highlight ? 500 : 400,
                                      animation: highlight ? 'chip-in .5s cubic-bezier(.16,1,.3,1)' : undefined,
                                    }}
                                  >
                                    {person}
                                  </span>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              ) : dayBookings.length === 0 ? (
                <div className="py-16 text-center">
                  <CalendarIcon size={26} className="mx-auto mb-3" style={{ color: LINE }} />
                  <p className="text-sm" style={{ color: MUTED }}>Nenhum agendamento neste dia.</p>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>Escolha um horário no celular ao lado.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dayBookings.map((b) => {
                    const isNew = b.id === justBooked
                    return (
                      <div
                        key={b.id}
                        className={cn('flex items-stretch gap-4 rounded-xl border p-4 transition')}
                        style={{
                          borderColor: isNew ? HUES.indigo : LINE,
                          background: isNew ? `${HUES.indigo}0a` : '#fff',
                          animation: isNew ? 'pop-in .6s cubic-bezier(.16,1,.3,1)' : undefined,
                        }}
                      >
                        <div className="text-center shrink-0 w-14">
                          <p className="font-display text-lg leading-tight" style={{ color: isNew ? HUES.indigo : INK }}>{hhmm(b.start)}</p>
                          <p className="text-[11px]" style={{ color: MUTED }}>{b.duration}min</p>
                        </div>
                        <div className="w-px" style={{ background: isNew ? HUES.indigo : LINE }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm" style={{ color: INK }}>{b.clientName}</p>
                            {isNew && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full text-white font-medium" style={{ background: HUES.indigo }}>novo</span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: INK_SOFT }}>{b.serviceName} · {b.withName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-medium" style={{ color: INK }}>{formatCurrency(b.price)}</p>
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

          {/* Leitura do que acabou de acontecer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            {(isTurma
              ? [
                  { icon: Users, color: HUES.sage, title: 'Vagas em tempo real', text: 'O aluno vê quantas sobraram. Ao lotar, a turma some da lista sozinha.' },
                  { icon: Bell, color: HUES.brass, title: 'Lembrete para todos', text: 'Cada aluno recebe no WhatsApp 24h e 2h antes da aula.' },
                  { icon: CalendarIcon, color: HUES.rose, title: 'Horário fixo, sem planilha', text: 'Você cadastra o dia e a hora uma vez. A turma se repete toda semana.' },
                ]
              : [
                  { icon: CalendarIcon, color: HUES.rose, title: 'Sem ida e volta', text: 'O cliente escolheu sozinho, vendo só os horários realmente livres.' },
                  { icon: Bell, color: HUES.brass, title: 'Lembrete automático', text: 'WhatsApp 24h e 2h antes. Menos faltas, sem você lembrar de nada.' },
                  { icon: Store, color: HUES.sage, title: 'Agenda sempre certa', text: 'O horário sai da lista no instante em que alguém reserva.' },
                ]
            ).map(({ icon: Icon, color, title, text }) => (
              <div key={title} className="rounded-xl border p-4" style={{ borderColor: LINE, background: '#fff' }}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}1a` }}>
                  <Icon size={16} style={{ color }} />
                </span>
                <p className="font-medium text-sm mb-1" style={{ color: INK }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: INK_SOFT }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Convite para o outro cenário */}
          <button
            onClick={() => switchMode(modeIdx === 0 ? 1 : 0)}
            className="w-full mt-4 rounded-xl border p-4 text-left transition hover:bg-white flex items-center justify-between gap-4"
            style={{ borderColor: LINE }}
          >
            <span>
              <span className="block font-medium text-sm" style={{ color: INK }}>
                {isTurma ? 'Ver o fluxo de atendimento individual' : 'Ver como funciona com turmas'}
              </span>
              <span className="block text-xs mt-0.5" style={{ color: INK_SOFT }}>
                {isTurma ? 'Um cliente por horário, com escolha de profissional' : 'Vários alunos no mesmo horário, com vagas caindo ao vivo'}
              </span>
            </span>
            <ArrowUpRight size={18} className="shrink-0" style={{ color: HUES.indigo }} />
          </button>

          <div className="rounded-2xl mt-6 p-8 text-center relative overflow-hidden" style={{ background: INK }}>
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `radial-gradient(circle at 20% 40%, ${HUES.indigo} 0%, transparent 45%), radial-gradient(circle at 80% 60%, ${HUES.plum} 0%, transparent 45%)` }} />
            <div className="relative">
              <h3 className="font-display text-2xl text-white tracking-tight mb-2">É assim no seu negócio também</h3>
              <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
                Configure seus serviços e horários em menos de 5 minutos. Sem cartão de crédito.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-medium text-sm transition hover:gap-4" style={{ background: '#fff', color: INK }}>
                Criar minha conta grátis <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
