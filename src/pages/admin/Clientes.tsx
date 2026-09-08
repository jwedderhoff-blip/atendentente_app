import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Download, User, ChevronDown, ChevronUp, MessageCircle, Calendar } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useClients } from '../../hooks/useClients'
import { supabase } from '../../lib/supabase'
import { isDemo } from '../../lib/isDemo'
import { mockAppointments } from '../../lib/mockData'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { formatPhone, formatCurrency } from '../../lib/utils'
import type { Appointment, Client } from '../../types'

function useClientAppointments(clientId: string | null, establishmentId: string | undefined, month: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clientId || !establishmentId) return
    setLoading(true)

    if (isDemo) {
      const filtered = mockAppointments.filter(
        (a) => a.client_id === clientId && a.starts_at.startsWith(month)
      )
      setAppointments(filtered as Appointment[])
      setLoading(false)
      return
    }

    const start = startOfMonth(new Date(`${month}-01`)).toISOString()
    const end = endOfMonth(new Date(`${month}-01`)).toISOString()

    supabase
      .from('appointments')
      .select('*, service:services(name, price), professional:professionals(name)')
      .eq('establishment_id', establishmentId)
      .eq('client_id', clientId)
      .gte('starts_at', start)
      .lte('starts_at', end)
      .order('starts_at', { ascending: false })
      .then(({ data }) => {
        setAppointments((data ?? []) as Appointment[])
        setLoading(false)
      })
  }, [clientId, establishmentId, month])

  return { appointments, loading }
}

function ClientRow({
  client,
  establishmentId,
}: {
  client: Client
  establishmentId: string | undefined
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const { appointments, loading } = useClientAppointments(open ? client.id : null, establishmentId, month)

  const totalPago = appointments
    .filter((a) => a.payment_status === 'pago')
    .reduce((sum, a) => {
      const svc = a.service as { price?: number } | undefined
      return sum + (svc?.price ?? 0)
    }, 0)

  const totalPendente = appointments
    .filter((a) => a.payment_status !== 'pago' && a.status !== 'cancelado')
    .reduce((sum, a) => {
      const svc = a.service as { price?: number } | undefined
      return sum + (svc?.price ?? 0)
    }, 0)

  return (
    <li className="divide-y divide-gray-50">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
          <User size={18} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{client.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <a
              href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-green-600 font-medium hover:underline"
            >
              <MessageCircle size={12} />
              {formatPhone(client.phone)}
            </a>
            {client.email && (
              <span className="text-xs text-gray-400">· {client.email}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 hidden sm:block">
            desde {format(new Date(client.created_at), "d 'de' MMM yyyy", { locale: ptBR })}
          </p>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {open && (
        <div className="bg-gray-50 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-600">Histórico de reservas</span>
            </div>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {loading ? (
            <p className="text-xs text-gray-400 py-2">Carregando...</p>
          ) : appointments.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Nenhuma reserva neste período.</p>
          ) : (
            <>
              <div className="space-y-2 mb-3">
                {appointments.map((a) => {
                  const svc = a.service as { name?: string; price?: number } | undefined
                  const pro = a.professional as { name?: string } | undefined
                  return (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800">
                          {format(new Date(a.starts_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {svc?.name ?? '—'}{pro?.name ? ` · ${pro.name}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {svc?.price !== undefined && (
                          <span className={`text-xs font-semibold ${
                            a.payment_status === 'pago' ? 'text-green-600' :
                            a.status === 'cancelado' ? 'text-gray-400 line-through' :
                            'text-yellow-600'
                          }`}>
                            {formatCurrency(svc.price)}
                          </span>
                        )}
                        <Badge status={a.status} />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-4 text-xs border-t border-gray-200 pt-2 mt-1">
                {totalPendente > 0 && (
                  <span className="text-yellow-700">
                    A receber: <span className="font-semibold">{formatCurrency(totalPendente)}</span>
                  </span>
                )}
                <span className="text-green-700">
                  Pago: <span className="font-semibold">{formatCurrency(totalPago)}</span>
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default function Clientes() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const { clients, loading, exportCsv } = useClients(establishment?.id)
  const [search, setSearch] = useState('')

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          icon={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  establishmentId={establishment?.id}
                />
              ))}
            </ul>
          )}
          <div className="p-4 border-t border-gray-50 text-xs text-gray-400">
            {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}
