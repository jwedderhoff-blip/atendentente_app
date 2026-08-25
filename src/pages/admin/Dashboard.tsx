import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Users, DollarSign, TrendingUp, Check, X, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useAppointments } from '../../hooks/useAppointments'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
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
  const { appointments, updateStatus, updatePaymentStatus } = useAppointments(establishment?.id, today)
  const [newClients, setNewClients] = useState(0)
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const count = appointments.filter((a) => a.created_at?.startsWith(todayStr)).length
    setNewClients(count)
  }, [appointments])

  const revenue = appointments
    .filter((a: Appointment) => a.payment_status === 'pago')
    .reduce((sum: number, a: Appointment) => sum + ((a.service as { price?: number })?.price ?? 0), 0)

  const confirmed = appointments.filter((a) => a.status === 'confirmado').length

  const handleStatus = async (status: Appointment['status']) => {
    if (!selectedAppt) return
    setUpdating(true)
    await updateStatus(selectedAppt.id, status)
    setSelectedAppt((prev) => prev ? { ...prev, status } : prev)
    setUpdating(false)
  }

  const handlePaymentStatus = async (payment_status: Appointment['payment_status']) => {
    if (!selectedAppt) return
    setUpdating(true)
    await updatePaymentStatus(selectedAppt.id, payment_status)
    setSelectedAppt((prev) => prev ? { ...prev, payment_status } : prev)
    setUpdating(false)
  }

  const apptClient = selectedAppt?.client as { name?: string; phone?: string } | undefined
  const apptService = selectedAppt?.service as { name?: string; price?: number } | undefined
  const apptProfessional = selectedAppt?.professional as { name?: string } | undefined

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
                <li
                  key={appt.id}
                  onClick={() => setSelectedAppt(appt)}
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
                >
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
                      {service?.name}{professional?.name ? ` · ${professional.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      appt.payment_status === 'pago'
                        ? 'bg-green-100 text-green-700'
                        : appt.payment_status === 'reembolsado'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {appt.payment_status === 'pago' ? 'Pago' : appt.payment_status === 'reembolsado' ? 'Reembolsado' : 'A pagar'}
                    </span>
                    <Badge status={appt.status} />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Modal detalhes */}
      <Modal
        open={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        title="Detalhes do agendamento"
      >
        {selectedAppt && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cliente</span>
                <span className="font-semibold text-gray-900">{apptClient?.name ?? '—'}</span>
              </div>
              {apptClient?.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">WhatsApp</span>
                  <a
                    href={`https://wa.me/55${apptClient.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-green-600 font-medium hover:underline"
                  >
                    {apptClient.phone}
                  </a>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Serviço</span>
                <span className="font-semibold text-gray-900">{apptService?.name ?? '—'}</span>
              </div>
              {apptProfessional?.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Profissional</span>
                  <span className="font-semibold text-gray-900">{apptProfessional.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Horário</span>
                <span className="font-semibold text-gray-900">
                  {format(new Date(selectedAppt.starts_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
              {apptService?.price !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Valor</span>
                  <span className="font-semibold text-purple-700">{formatCurrency(apptService.price)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Status</span>
                <Badge status={selectedAppt.status} />
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Pagamento</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  selectedAppt.payment_status === 'pago'
                    ? 'bg-green-100 text-green-700'
                    : selectedAppt.payment_status === 'reembolsado'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selectedAppt.payment_status === 'pago' ? 'Pago' : selectedAppt.payment_status === 'reembolsado' ? 'Reembolsado' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Pagamento */}
            {selectedAppt.payment_status !== 'pago' && (
              <Button
                onClick={() => handlePaymentStatus('pago')}
                loading={updating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Marcar como pago
              </Button>
            )}
            {selectedAppt.payment_status === 'pago' && (
              <Button
                variant="ghost"
                onClick={() => handlePaymentStatus('reembolsado')}
                loading={updating}
                className="w-full"
              >
                Marcar como reembolsado
              </Button>
            )}

            {/* Status do agendamento */}
            {selectedAppt.status === 'pendente' && (
              <Button onClick={() => handleStatus('confirmado')} loading={updating} className="w-full">
                <Check size={16} /> Confirmar agendamento
              </Button>
            )}
            {selectedAppt.status === 'confirmado' && (
              <Button onClick={() => handleStatus('concluido')} loading={updating} className="w-full">
                <CheckCheck size={16} /> Marcar como concluído
              </Button>
            )}
            {selectedAppt.status !== 'cancelado' && selectedAppt.status !== 'concluido' && (
              <Button
                variant="ghost"
                onClick={() => handleStatus('cancelado')}
                loading={updating}
                className="w-full text-red-600 hover:bg-red-50"
              >
                <X size={16} /> Cancelar agendamento
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
