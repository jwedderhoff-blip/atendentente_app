import { useState } from 'react'
import { useAllEstablishments } from '../../hooks/useSuperAdmin'
import { CheckCircle, XCircle, Clock, Search, ExternalLink } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-amber-100 text-amber-700', icon: Clock },
  suspended: { label: 'Suspenso', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const CATEGORY_LABELS: Record<string, string> = {
  salao: 'Salão de Beleza', barbearia: 'Barbearia', estetica: 'Estética',
  pilates: 'Pilates', avaliacao_fisica: 'Avaliação Física',
  avaliacao_nutricional: 'Avaliação Nutricional', academia: 'Academia', outro: 'Outro',
}

export default function SuperEstabelecimentos() {
  const { establishments, loading, updateStatus } = useAllEstablishments()
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = establishments.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id)
    await updateStatus(id, status)
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estabelecimentos</h1>
        <p className="text-sm text-gray-500 mt-1">Todos os cadastros na plataforma</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Nenhum estabelecimento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Estabelecimento</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Categoria</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Plano</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Cadastro</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((e) => {
                    const st = STATUS_LABELS[e.status] ?? STATUS_LABELS.trial
                    const StatusIcon = st.icon
                    const planName = e.subscriptions?.[0]?.plans?.name ?? '—'
                    return (
                      <tr key={e.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{e.name}</p>
                          <p className="text-xs text-gray-400">{e.email ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {CATEGORY_LABELS[e.category] ?? e.category}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{planName}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                            <StatusIcon size={12} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(e.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={`/agendar/${e.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              title="Ver página pública"
                            >
                              <ExternalLink size={14} />
                            </a>
                            {e.status !== 'active' && (
                              <button
                                onClick={() => handleStatus(e.id, 'active')}
                                disabled={updating === e.id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition font-medium disabled:opacity-50"
                              >
                                Ativar
                              </button>
                            )}
                            {e.status !== 'suspended' && (
                              <button
                                onClick={() => handleStatus(e.id, 'suspended')}
                                disabled={updating === e.id}
                                className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition font-medium disabled:opacity-50"
                              >
                                Suspender
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
