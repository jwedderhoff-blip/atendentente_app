import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Download, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import { useClients } from '../../hooks/useClients'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { formatPhone } from '../../lib/utils'

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
            <ul className="divide-y divide-gray-50">
              {filtered.map((client) => (
                <li key={client.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <User size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatPhone(client.phone)}
                      {client.email && ` · ${client.email}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {format(new Date(client.created_at), "d 'de' MMM", { locale: ptBR })}
                    </p>
                  </div>
                </li>
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
