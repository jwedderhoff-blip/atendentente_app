import { useMemo, useState } from 'react'
import { Receipt, TrendingUp, CalendarClock, Building2 } from 'lucide-react'
import { useBookingChargesSummary, useAllEstablishments } from '../../hooks/useSuperAdmin'
import { formatCurrency } from '../../lib/utils'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function SuperCobrancas() {
  const [month, setMonth] = useState(currentMonth())
  const [estId, setEstId] = useState('') // '' = todos os estabelecimentos
  const { rows, loading, missing } = useBookingChargesSummary(month)
  const { establishments } = useAllEstablishments()

  // Filtra pelo estabelecimento escolhido (ou mostra todos)
  const visibleRows = useMemo(
    () => (estId ? rows.filter((r) => r.establishment_id === estId) : rows),
    [rows, estId],
  )

  const totals = useMemo(() => {
    const charges = visibleRows.reduce((s, r) => s + r.charges, 0)
    const value = visibleRows.reduce((s, r) => s + r.total, 0)
    return { charges, value }
  }, [visibleRows])

  const selectedName = estId ? establishments.find((e) => e.id === estId)?.name : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cobranças por agendamento</h1>
        <p className="text-sm text-gray-500 mt-1">
          Taxas geradas por atendimentos concluídos. Escolha o estabelecimento e o período para ver o valor devido.
        </p>
      </div>

      {/* Filtros: estabelecimento + período */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-[220px]">
          <Building2 size={16} className="text-gray-400 shrink-0" />
          <select
            value={estId}
            onChange={(e) => setEstId(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Todos os estabelecimentos</option>
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarClock size={16} className="text-gray-400 shrink-0" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
      </div>

      {/* Valor devido do estabelecimento selecionado */}
      {estId && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-medium text-emerald-700/70 mb-1">Valor devido no período</p>
          <p className="text-3xl font-bold text-emerald-700">{formatCurrency(totals.value)}</p>
          <p className="text-sm text-emerald-800/80 mt-1">
            {selectedName} · {totals.charges} {totals.charges === 1 ? 'atendimento' : 'atendimentos'} cobrados
          </p>
        </div>
      )}

      {/* Totais do mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
            <Receipt size={14} /> Atendimentos cobrados
          </div>
          <p className="text-2xl font-bold text-gray-900">{totals.charges}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
            <TrendingUp size={14} /> Total em taxas
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.value)}</p>
        </div>
      </div>

      {missing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          A função de cobranças ainda não foi criada no banco. Rode a migration{' '}
          <code className="font-mono">20260911_booking_fee_plan.sql</code> no SQL Editor do Supabase para ativar este relatório.
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Nenhuma cobrança neste período{estId ? ' para este estabelecimento' : ''}.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estabelecimento</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Atendimentos</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total em taxas</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Cobrança</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleRows.map((r) => (
                  <tr key={r.establishment_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.establishment_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.charges}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(r.total)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {r.charge_to === 'cliente' ? 'Repassada ao cliente' : 'Descontada do estab.'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
