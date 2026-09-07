import { useAllSubscriptions, useAllEstablishments, usePlans } from '../../hooks/useSuperAdmin'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  trial: 'bg-amber-100 text-amber-700',
  active: 'bg-green-100 text-green-700',
  suspended: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  trial: 'Trial', active: 'Ativo', suspended: 'Suspenso', cancelled: 'Cancelado',
}

export default function SuperAssinaturas() {
  const { subscriptions, loading } = useAllSubscriptions()
  const { establishments } = useAllEstablishments()
  const { plans } = usePlans()
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Record<string, string>>({})

  const noSubscription = establishments.filter(
    (e) => !subscriptions.some((s) => s.establishment_id === e.id)
  )

  const assign = async (establishmentId: string) => {
    const planId = selectedPlan[establishmentId]
    if (!planId) return
    setAssigning(establishmentId)
    await supabase.from('subscriptions').insert({
      establishment_id: establishmentId,
      plan_id: planId,
      status: 'active',
    })
    setAssigning(null)
    window.location.reload()
  }

  const updateSub = async (id: string, updates: { status?: string; plan_id?: string }) => {
    await supabase.from('subscriptions').update(updates).eq('id', id)
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assinaturas</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie planos e status de cada estabelecimento</p>
      </div>

      {/* Sem assinatura */}
      {noSubscription.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-semibold text-amber-800 mb-3">Sem plano atribuído ({noSubscription.length})</h2>
          <div className="space-y-3">
            {noSubscription.map((e) => (
              <div key={e.id} className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-900 flex-1">{e.name}</span>
                <select
                  value={selectedPlan[e.id] ?? ''}
                  onChange={(ev) => setSelectedPlan((p) => ({ ...p, [e.id]: ev.target.value }))}
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Selecionar plano</option>
                  {plans.filter((p) => p.is_active).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => assign(e.id)}
                  disabled={!selectedPlan[e.id] || assigning === e.id}
                  className="text-sm px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition font-medium"
                >
                  {assigning === e.id ? 'Salvando...' : 'Atribuir'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de assinaturas */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {subscriptions.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Nenhuma assinatura ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Estabelecimento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Plano</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Início</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Vencimento</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {s.establishments?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={s.plan_id ?? ''}
                          onChange={(e) => updateSub(s.id, { plan_id: e.target.value || undefined })}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">Sem plano</option>
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          onChange={(e) => updateSub(s.id, { status: e.target.value })}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[s.status]}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(s.started_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {s.expires_at ? new Date(s.expires_at).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.status === 'active' ? (
                          <button
                            onClick={() => updateSub(s.id, { status: 'suspended' })}
                            className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-medium"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => updateSub(s.id, { status: 'active' })}
                            className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium"
                          >
                            Ativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
