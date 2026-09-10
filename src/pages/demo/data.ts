/**
 * Dados e tipos da área de demonstração.
 *
 * Tudo aqui é fictício e vive só em memória. A demo não toca em nenhum
 * hook de produção nem no Supabase — telefone e e-mail de clientes reais
 * nunca passam por estas telas.
 */

export const HUES = {
  indigo: '#4f46e5',
  plum: '#7e3f8f',
  rose: '#b5476b',
  clay: '#c26a3c',
  brass: '#a8843c',
  sage: '#5a7d64',
}

export const INK = '#14131c'
export const INK_SOFT = '#57535f'
export const MUTED = '#8d8893'
export const PAPER = '#fbfaf8'
export const LINE = '#e5e1d9'
export const SOFT_LINE = '#eceaf5'

export const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export type Mode = 'individual' | 'turma'

export interface DemoService {
  id: string
  name: string
  description: string
  duration: number
  price: number
  /** Turma: vagas por horário. Individual sempre 1. */
  spots: number
  instructor?: string
  professionals?: string[]
  /**
   * Turma: pares dia-da-semana + horário. Guardar days[] e times[] separados
   * daria o produto cartesiano dos dois, e uma turma pode ter horário
   * diferente em cada dia.
   */
  fixed?: { day: number; time: string }[]
  color: string
  /** Criado pelo visitante durante a demonstração. */
  custom?: boolean
}

export interface DemoProfessional { id: string; name: string; color: string }

export interface Scenario {
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

export const INDIVIDUAL: Scenario = {
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

/** Açúcar para turmas que repetem os mesmos horários em vários dias. */
const grid = (days: number[], times: string[]) =>
  days.flatMap((day) => times.map((time) => ({ day, time })))

export const TURMA: Scenario = {
  mode: 'turma',
  tab: 'Turma / aula em grupo',
  establishment: { name: 'Studio Corpo em Movimento', address: 'Rua Harmonia, 88 — São Paulo/SP' },
  openHour: 7,
  closeHour: 21,
  closedDays: [0],
  pitch: 'Vários alunos no mesmo horário. As vagas caem em tempo real e a turma fecha sozinha ao lotar.',
  professionals: [],
  services: [
    { id: 'tur-1', name: 'Pilates Solo', description: 'Turma reduzida, foco em postura e core', duration: 55, price: 45, spots: 6, instructor: 'Ana Paula', fixed: grid([1, 3, 5], ['07:00', '18:00', '19:30']), color: HUES.sage },
    { id: 'tur-2', name: 'Balé Infantil', description: 'Turma de 6 a 10 anos, iniciante', duration: 50, price: 40, spots: 8, instructor: 'Marina Duarte', fixed: grid([2, 4], ['16:00', '17:00']), color: HUES.rose },
    { id: 'tur-3', name: 'Jiu-Jitsu Iniciante', description: 'Fundamentos e treino leve, sem contato pesado', duration: 60, price: 50, spots: 10, instructor: 'Diego Ramos', fixed: grid([1, 3], ['20:00']), color: HUES.indigo },
  ],
}

export const SCENARIOS = [INDIVIDUAL, TURMA]

/**
 * Matrículas fictícias, chaveadas por dia da semana e horário em vez de
 * data absoluta — assim a turma parece cheia em qualquer dia que o
 * visitante escolher, e não só na semana em que a demo foi escrita.
 */
export const SEEDED: Record<string, string[]> = {
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

export interface Booking {
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

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function at(dayOffset: number, hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d
}

export function seedIndividual(): Booking[] {
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

export function nextDays(count = 7): Date[] {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    return d
  })
}
