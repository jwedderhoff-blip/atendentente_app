import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useAppointments } from '../../hooks/useAppointments'
import ShareCard from '../../components/admin/ShareCard'
import AgendaBlock from '../../components/admin/AgendaBlock'
import { formatCurrency } from '../../lib/utils'
import type { Appointment } from '../../types'

function StatCard({ label, value, icon, color }: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      </div>
      <p className="font-display text-3xl tracking-tight text-ink">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const today = format(new Date(), 'yyyy-MM-dd')
  const { appointments } = useAppointments(establishment?.id, today)
  const [newClients, setNewClients] = useState(0)

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const count = appointments.filter((a) => a.created_at?.startsWith(todayStr)).length
    setNewClients(count)
  }, [appointments])

  const revenue = appointments
    .filter((a: Appointment) => a.payment_status === 'pago')
    .reduce((sum: number, a: Appointment) => sum + ((a.service as { price?: number })?.price ?? 0), 0)

  const confirmed = appointments.filter((a) => a.status === 'confirmado').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-tight text-ink">
          Olá, {establishment?.name ?? 'Estabelecimento'} 👋
        </h1>
        <p className="text-gray-500 text-sm capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Bloco em evidência: agenda da semana (com alternância semana/dia) */}
      <div className="mb-8">
        <AgendaBlock establishmentId={establishment?.id} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Agendamentos hoje"
          value={appointments.length}
          icon={<Calendar size={18} className="text-brand" />}
          color="bg-brand-soft"
        />
        <StatCard
          label="Confirmados"
          value={confirmed}
          icon={<TrendingUp size={18} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Clientes novos"
          value={newClients}
          icon={<Users size={18} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Receita do dia"
          value={formatCurrency(revenue)}
          icon={<DollarSign size={18} className="text-emerald-600" />}
          color="bg-emerald-50"
        />
      </div>

      {establishment && (
        <div className="mb-8">
          <ShareCard
            url={`${window.location.origin}/agendar/${establishment.slug}`}
            name={establishment.name}
          />
        </div>
      )}

    </div>
  )
}
