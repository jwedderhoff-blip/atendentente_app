import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowUpRight, CalendarDays } from 'lucide-react'
import { useAppointments } from '../../hooks/useAppointments'
import type { Appointment } from '../../types'

const STATUS_DOT: Record<string, string> = {
  pendente: 'bg-amber-400',
  confirmado: 'bg-green-500',
  concluido: 'bg-blue-500',
  cancelado: 'bg-gray-300',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

function name(v: unknown): string | undefined {
  return (v as { name?: string } | undefined)?.name
}

/**
 * Agenda em evidência no Dashboard, com alternância entre visão semanal e
 * diária. Somente leitura (visão geral) — o gerenciamento fica na tela Agenda.
 */
export default function AgendaBlock({ establishmentId }: { establishmentId?: string }) {
  const { appointments, loading } = useAppointments(establishmentId)
  const [view, setView] = useState<'week' | 'day'>('week')
  const [anchor, setAnchor] = useState<Date>(() => new Date())

  const today = new Date()
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const apptsOn = (day: Date) =>
    appointments
      .filter((a: Appointment) => a.status !== 'cancelado' && isSameDay(new Date(a.starts_at), day))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const step = (dir: -1 | 1) => setAnchor((d) => addDays(d, view === 'week' ? dir * 7 : dir))

  const rangeLabel =
    view === 'week'
      ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} — ${format(addDays(weekStart, 6), "d 'de' MMM", { locale: ptBR })}`
      : format(anchor, "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center">
            <CalendarDays size={15} className="text-brand" />
          </span>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Agenda</h2>
            <p className="text-xs text-gray-400 capitalize">{rangeLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternância semana/dia */}
          <div className="inline-flex p-0.5 rounded-lg bg-gray-100">
            {(['week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  view === v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                {v === 'week' ? 'Semana' : 'Dia'}
              </button>
            ))}
          </div>
          {/* Navegação */}
          <div className="flex items-center gap-1">
            <button onClick={() => step(-1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition" aria-label="Anterior">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setAnchor(new Date())} className="text-xs font-medium text-gray-500 hover:text-gray-900 px-1.5 transition">
              Hoje
            </button>
            <button onClick={() => step(1)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition" aria-label="Próximo">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Carregando agenda…</div>
      ) : view === 'week' ? (
        /* ── Visão semanal ── */
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[720px]">
            {weekDays.map((day) => {
              const list = apptsOn(day)
              const isToday = isSameDay(day, today)
              return (
                <div key={day.toISOString()} className="border-l border-gray-50 first:border-l-0 min-h-[180px]">
                  <div className={`px-2 py-2 text-center border-b border-gray-50 ${isToday ? 'bg-brand-soft' : ''}`}>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">{format(day, 'EEE', { locale: ptBR })}</p>
                    <p className={`text-sm font-semibold ${isToday ? 'text-brand-dark' : 'text-gray-800'}`}>{format(day, 'd')}</p>
                  </div>
                  <div className="p-1.5 space-y-1.5">
                    {list.length === 0 ? (
                      <p className="text-[11px] text-gray-300 text-center pt-2">—</p>
                    ) : (
                      list.map((a) => (
                        <div key={a.id} className="rounded-lg bg-gray-50 px-2 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status] ?? 'bg-gray-300'}`} />
                            <span className="text-[11px] font-semibold text-gray-700">{format(new Date(a.starts_at), 'HH:mm')}</span>
                          </div>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">{name(a.client) ?? 'Cliente'}</p>
                          <p className="text-[10px] text-gray-400 truncate">{name(a.service)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ── Visão diária ── */
        <div>
          {apptsOn(anchor).length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">Nenhum agendamento neste dia.</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {apptsOn(anchor).map((a) => (
                <li key={a.id} className="flex items-center gap-4 p-4">
                  <div className="text-center shrink-0 w-14">
                    <p className="font-display text-lg leading-tight text-ink">{format(new Date(a.starts_at), 'HH:mm')}</p>
                  </div>
                  <div className="w-px self-stretch bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{name(a.client) ?? 'Cliente'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {name(a.service)}{name(a.professional) ? ` · ${name(a.professional)}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 flex items-center gap-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[a.status] ?? 'bg-gray-300'}`} />
                    <span className="text-gray-500">{STATUS_LABEL[a.status] ?? a.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Rodapé: ir para a agenda completa */}
      <div className="px-5 py-3 border-t border-gray-50 text-right">
        <Link to="/admin/agenda" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition">
          Ver agenda completa <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  )
}
