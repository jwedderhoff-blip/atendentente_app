import { useMemo, useState } from 'react'
import { Receipt, TrendingUp, CalendarClock } from 'lucide-react'
import { useBookingChargesSummary } from '../../hooks/useSuperAdmin'
import { formatCurrency } from '../../lib/utils'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function SuperCobrancas() {
  const [month, setMonth] = useState(currentMonth())
  const { rows, loading, missing } = useBookingChargesSummary(month)

  const totals = useMemo(() => {
    const charges = rows.reduce((s, r) => s + r.charges, 0)
    const value = rows.reduce((s, r) => s + r.total, 0)
    return { charges, value }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranças por agendamento</h1>
          <p className="text-sm text-gray-500 mt-1">
            Taxas geradas por atendimentos concluídos, por estabelecimento, no mês.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarClock size={16} className="text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value || currentMonth())}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </label>
      </div>

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
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Nenhuma cobrança neste mês.
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
                {rows.map((r) => (
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
