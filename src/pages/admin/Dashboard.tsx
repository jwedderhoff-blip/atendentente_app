import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useAppointments } from '../../hooks/useAppointments'
import { Badge } from '../../components/ui/Badge'
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
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {establishment?.name ?? 'Estabelecimento'} 👋
        </h1>
        <p className="text-gray-500 text-sm capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Agendamentos hoje"
          value={appointments.length}
          icon={<Calendar size={18} className="text-purple-600" />}
          color="bg-purple-50"
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

      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Agenda de hoje</h2>
        </div>
        {appointments.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {appointments.map((appt) => {
              const client = appt.client as { name?: string } | undefined
              const service = appt.service as { name?: string } | undefined
              const professional = appt.professional as { name?: string } | undefined
              return (
                <li key={appt.id} className="flex items-center gap-4 p-4">
                  <div className="w-14 text-center">
                    <p className="text-sm font-semibold text-purple-700">
                      {format(new Date(appt.starts_at), 'HH:mm')}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {client?.name ?? 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {service?.name} · {professional?.name}
                    </p>
                  </div>
                  <Badge status={appt.status} />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
