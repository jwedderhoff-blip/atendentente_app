export interface Establishment {
  id: string
  name: string
  slug: string
  category: 'salao' | 'barbearia' | 'estetica' | 'pilates' | 'outro'
  phone: string
  email: string
  address: string
  logo_url?: string
  created_at: string
}

export interface Service {
  id: string
  establishment_id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  active: boolean
}

export interface Professional {
  id: string
  establishment_id: string
  name: string
  avatar_url?: string
  services: string[]
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  birth_date?: string
  notes?: string
  created_at: string
}

export interface Appointment {
  id: string
  establishment_id: string
  client_id: string
  professional_id: string
  service_id: string
  starts_at: string
  ends_at: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  payment_status: 'pendente' | 'pago' | 'reembolsado'
  notes?: string
  created_at: string
}

export interface TimeSlot {
  time: string
  available: boolean
}
