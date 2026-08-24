import { useState } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useAppointments } from '../../hooks/useAppointments'
import { useProfessionals } from '../../hooks/useProfessionals'
import { Badge } from '../../components/ui/Badge'
import type { Appointment } from '../../types'

export default function Agenda() {
  const { user } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all')

  const { professionals } = useProfessionals(establishment?.id)
  const { appointments, loading } = useAppointments(establishment?.id)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const filteredAppointments = appointments.filter((a: Appointment) => {
    const matchesPro = selectedProfessional === 'all' || a.professional_id === selectedProfessional
    const apptDate = new Date(a.starts_at)
    const inWeek = weekDays.some((d) => isSameDay(d, apptDate))
    return matchesPro && inWeek
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>

        <div className="flex items-center gap-3">
          <select
            className="rounded-xl border border-gray-200 text-sm px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
          >
            <option value="all">Todos os profissionais</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart((w) => addDays(w, -7))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600 min-w-[140px] text-center">
              {format(weekStart, "d 'de' MMM", { locale: ptBR })} —{' '}
              {format(addDays(weekStart, 6), "d 'de' MMM", { locale: ptBR })}
            </span>
            <button
              onClick={() => setWeekStart((w) => addDays(w, 7))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
          <div className="grid grid-cols-8 min-w-[640px]">
            <div className="border-b border-gray-100 p-3" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`border-b border-l border-gray-100 p-3 text-center ${isSameDay(day, new Date()) ? 'bg-purple-50' : ''}`}
              >
                <p className="text-xs font-medium text-gray-400 uppercase">
                  {format(day, 'EEE', { locale: ptBR })}
                </p>
                <p className={`text-sm font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-purple-700' : 'text-gray-800'}`}>
                  {format(day, 'd')}
                </p>
              </div>
            ))}

            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <>
                <div key={`hour-${hour}`} className="border-t border-gray-50 p-2 text-right">
                  <span className="text-xs text-gray-400">{String(hour).padStart(2, '0')}:00</span>
                </div>
                {weekDays.map((day) => {
                  const dayAppts = filteredAppointments.filter((a) => {
                    const apptDate = new Date(a.starts_at)
                    return isSameDay(apptDate, day) && apptDate.getHours() === hour
                  })
                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className="border-t border-l border-gray-50 p-1 min-h-[56px]"
                    >
                      {dayAppts.map((a) => {
                        const client = a.client as { name?: string } | undefined
                        const service = a.service as { name?: string } | undefined
                        return (
                          <div
                            key={a.id}
                            className="bg-purple-100 rounded-lg p-1.5 mb-1 cursor-pointer hover:bg-purple-200 transition"
                          >
                            <p className="text-xs font-semibold text-purple-800 truncate">
                              {format(new Date(a.starts_at), 'HH:mm')} {client?.name}
                            </p>
                            <p className="text-xs text-purple-600 truncate">{service?.name}</p>
                            <Badge status={a.status} className="mt-1" />
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
