import { useAllEstablishments, useAllSubscriptions, usePlans } from '../../hooks/useSuperAdmin'
import { Building2, Users2, CreditCard, TrendingUp } from 'lucide-react'

export default function SuperDashboard() {
  const { establishments } = useAllEstablishments()
  const { subscriptions } = useAllSubscriptions()
  const { plans } = usePlans()

  const ativos = establishments.filter((e) => e.status === 'active').length
  const trial = establishments.filter((e) => e.status === 'trial').length
  const suspensos = establishments.filter((e) => e.status === 'suspended').length
  const assinaturasAtivas = subscriptions.filter((s) => s.status === 'active').length

  const stats = [
    { label: 'Estabelecimentos', value: establishments.length, icon: Building2, color: 'bg-purple-100 text-purple-600' },
    { label: 'Ativos', value: ativos, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
    { label: 'Em trial', value: trial, icon: Users2, color: 'bg-amber-100 text-amber-600' },
    { label: 'Assinaturas ativas', value: assinaturasAtivas, icon: CreditCard, color: 'bg-indigo-100 text-indigo-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard da Plataforma</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral de todos os estabelecimentos e assinaturas</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Status dos estabelecimentos</h2>
          <div className="space-y-3">
            {[
              { label: 'Ativos', count: ativos, color: 'bg-green-500' },
              { label: 'Trial', count: trial, color: 'bg-amber-400' },
              { label: 'Suspensos', count: suspensos, color: 'bg-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                <span className="text-sm text-gray-600 flex-1">{label}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Planos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Planos cadastrados</h2>
          {plans.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum plano cadastrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">
                      {p.price_monthly === 0 ? 'Grátis' : `R$ ${p.price_monthly.toFixed(2)}/mês`}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_active ? 'ativo' : 'inativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
