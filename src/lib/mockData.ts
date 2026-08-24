import type { Establishment, Service, Professional, Client, Appointment, WorkingHours } from '../types'

// ── Estabelecimento ──────────────────────────────────────────────────────────
export const mockEstablishment: Establishment = {
  id: 'demo',
  user_id: 'demo-user',
  name: 'Salão Bella Vita',
  slug: 'bella-vita',
  category: 'salao',
  phone: '(11) 99999-0000',
  email: 'contato@bellavita.com',
  address: 'Rua das Flores, 123 - São Paulo/SP',
  created_at: '2024-01-01T00:00:00.000Z',
}

// ── Serviços ─────────────────────────────────────────────────────────────────
export const mockServices: Service[] = [
  {
    id: 'srv-1',
    establishment_id: 'demo',
    name: 'Corte Feminino',
    description: 'Corte personalizado com lavagem e finalização',
    duration_minutes: 60,
    price: 80,
    active: true,
  },
  {
    id: 'srv-2',
    establishment_id: 'demo',
    name: 'Escova',
    description: 'Escova modeladora com produto premium',
    duration_minutes: 45,
    price: 60,
    active: true,
  },
  {
    id: 'srv-3',
    establishment_id: 'demo',
    name: 'Hidratação',
    description: 'Tratamento intensivo de hidratação profunda',
    duration_minutes: 90,
    price: 120,
    active: true,
  },
]

// ── Profissionais ─────────────────────────────────────────────────────────────
export const mockProfessionals: Professional[] = [
  {
    id: 'pro-1',
    establishment_id: 'demo',
    name: 'Ana Silva',
    services: ['srv-1', 'srv-2', 'srv-3'],
  },
  {
    id: 'pro-2',
    establishment_id: 'demo',
    name: 'Bruna Costa',
    services: ['srv-1', 'srv-2'],
  },
]

// ── Horários de funcionamento ─────────────────────────────────────────────────
// Seg-Sáb 09h-19h, Dom fechado
export const mockWorkingHours: WorkingHours[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
  id: `wh-${day}`,
  establishment_id: 'demo',
  day_of_week: day as WorkingHours['day_of_week'],
  open_time: '09:00',
  close_time: '19:00',
  is_open: day !== 0, // domingo fechado
}))

// ── Clientes ──────────────────────────────────────────────────────────────────
export const mockClients: Client[] = [
  {
    id: 'cli-1',
    establishment_id: 'demo',
    name: 'Camila Rodrigues',
    phone: '(11) 98888-1111',
    email: 'camila@email.com',
    created_at: '2024-06-01T10:00:00.000Z',
  },
  {
    id: 'cli-2',
    establishment_id: 'demo',
    name: 'Fernanda Alves',
    phone: '(11) 97777-2222',
    email: 'fernanda@email.com',
    created_at: '2024-06-15T14:00:00.000Z',
  },
  {
    id: 'cli-3',
    establishment_id: 'demo',
    name: 'Juliana Mendes',
    phone: '(11) 96666-3333',
    created_at: '2024-07-01T09:00:00.000Z',
  },
]

// ── Agendamentos ──────────────────────────────────────────────────────────────
function todayAt(hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function tomorrowAt(hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function afterTomorrowAt(hour: number, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-1',
    establishment_id: 'demo',
    client_id: 'cli-1',
    professional_id: 'pro-1',
    service_id: 'srv-1',
    starts_at: todayAt(9, 0),
    ends_at: todayAt(10, 0),
    status: 'confirmado',
    payment_status: 'pago',
    created_at: new Date().toISOString(),
    client: mockClients[0],
    service: mockServices[0],
    professional: mockProfessionals[0],
  },
  {
    id: 'apt-2',
    establishment_id: 'demo',
    client_id: 'cli-2',
    professional_id: 'pro-2',
    service_id: 'srv-2',
    starts_at: todayAt(11, 0),
    ends_at: todayAt(11, 45),
    status: 'pendente',
    payment_status: 'pendente',
    created_at: new Date().toISOString(),
    client: mockClients[1],
    service: mockServices[1],
    professional: mockProfessionals[1],
  },
  {
    id: 'apt-3',
    establishment_id: 'demo',
    client_id: 'cli-3',
    professional_id: 'pro-1',
    service_id: 'srv-3',
    starts_at: todayAt(14, 0),
    ends_at: todayAt(15, 30),
    status: 'confirmado',
    payment_status: 'pendente',
    created_at: new Date().toISOString(),
    client: mockClients[2],
    service: mockServices[2],
    professional: mockProfessionals[0],
  },
  {
    id: 'apt-4',
    establishment_id: 'demo',
    client_id: 'cli-1',
    professional_id: 'pro-2',
    service_id: 'srv-1',
    starts_at: tomorrowAt(10, 0),
    ends_at: tomorrowAt(11, 0),
    status: 'confirmado',
    payment_status: 'pendente',
    created_at: new Date().toISOString(),
    client: mockClients[0],
    service: mockServices[0],
    professional: mockProfessionals[1],
  },
  {
    id: 'apt-5',
    establishment_id: 'demo',
    client_id: 'cli-2',
    professional_id: 'pro-1',
    service_id: 'srv-2',
    starts_at: afterTomorrowAt(13, 0),
    ends_at: afterTomorrowAt(13, 45),
    status: 'pendente',
    payment_status: 'pendente',
    created_at: new Date().toISOString(),
    client: mockClients[1],
    service: mockServices[1],
    professional: mockProfessionals[0],
  },
]
