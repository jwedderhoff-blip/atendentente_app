import { useMemo, useState } from 'react'
import { CalendarClock, Wallet, Clock3, CheckCircle2 } from 'lucide-react'
import { useMembershipSummary } from '../../hooks/useSuperAdmin'
import { formatCurrency } from '../../lib/utils'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function Tile({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-1">
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${tone}`}>{icon}</span>
        {label}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function SuperMensalidades() {
  const [month, setMonth] = useState(currentMonth())
  const { rows, loading, missing } = useMembershipSummary(month)

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.total, 0)
    const recebido = rows.reduce((s, r) => s + r.recebido, 0)
    const cobrancas = rows.reduce((s, r) => s + r.cobrancas, 0)
    return { total, recebido, aReceber: total - recebido, cobrancas }
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
          <p className="text-sm text-gray-500 mt-1">Mensalidades cobradas e recebidas por estabelecimento, no mês.</p>
        </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Total cobrado" value={formatCurrency(totals.total)} icon={<Wallet size={13} className="text-indigo-600" />} tone="bg-indigo-50" />
        <Tile label="Recebido" value={formatCurrency(totals.recebido)} icon={<CheckCircle2 size={13} className="text-green-600" />} tone="bg-green-50" />
        <Tile label="A receber" value={formatCurrency(totals.aReceber)} icon={<Clock3 size={13} className="text-amber-600" />} tone="bg-amber-50" />
        <Tile label="Cobranças" value={String(totals.cobrancas)} icon={<Wallet size={13} className="text-gray-500" />} tone="bg-gray-100" />
      </div>

      {missing ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          A função de mensalidades ainda não foi criada no banco. Rode a migration{' '}
          <code className="font-mono">20260912_memberships.sql</code> no SQL Editor do Supabase.
        </div>
      ) : loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          Nenhuma mensalidade neste mês.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estabelecimento</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Cobranças</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Pagas</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Recebido</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">A receber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.establishment_id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.establishment_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.cobrancas}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.pagas}</td>
                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(r.total)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">{formatCurrency(r.recebido)}</td>
                    <td className="px-4 py-3 text-right text-amber-700">{formatCurrency(r.total - r.recebido)}</td>
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
