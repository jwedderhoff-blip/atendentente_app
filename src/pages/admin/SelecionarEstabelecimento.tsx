import { useNavigate, Link } from 'react-router-dom'
import {
  Scissors, Sparkles, Dumbbell, Activity, Apple, Store, Plus, Star, Users, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useEstablishments } from '../../hooks/useEstablishments'
import { setSelectedEstablishmentId } from '../../hooks/useEstablishment'
import type { Establishment } from '../../types'

const CATEGORY_ICONS: Record<Establishment['category'], LucideIcon> = {
  salao: Scissors,
  barbearia: Scissors,
  estetica: Sparkles,
  beleza: Star,
  pilates: Dumbbell,
  aulas_coletivas: Users,
  avaliacao_fisica: Activity,
  avaliacao_nutricional: Apple,
  academia: Dumbbell,
  outro: Store,
}

const CATEGORY_LABELS: Record<Establishment['category'], string> = {
  salao: 'Salão de Beleza',
  barbearia: 'Barbearia',
  estetica: 'Estética',
  beleza: 'Serviços de Beleza',
  pilates: 'Pilates',
  aulas_coletivas: 'Aulas Coletivas',
  avaliacao_fisica: 'Avaliação Física',
  avaliacao_nutricional: 'Avaliação Nutricional',
  academia: 'Academia',
  outro: 'Outro',
}

export default function SelecionarEstabelecimento() {
  const { user } = useAuth()
  const { establishments, loading } = useEstablishments(user?.id)
  const navigate = useNavigate()

  const select = (id: string) => {
    setSelectedEstablishmentId(id)
    navigate('/admin')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Seus estabelecimentos</h1>
        <p className="text-sm text-gray-500 mb-6">Selecione qual deseja gerenciar agora</p>

        <div className="space-y-3 mb-6">
          {establishments.map((e) => {
            const Icon = CATEGORY_ICONS[e.category ?? 'outro']
            const label = CATEGORY_LABELS[e.category ?? 'outro']
            return (
              <button
                key={e.id}
                onClick={() => select(e.id)}
                className="flex items-center gap-4 w-full bg-gray-50 hover:bg-purple-50 hover:border-purple-300 border border-gray-200 rounded-2xl p-4 transition text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-700 transition">
                  <Icon size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{e.name}</p>
                  <p className="text-sm text-gray-400">{label}</p>
                  {e.address && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{e.address}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <Link
          to="/register"
          className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-purple-300 text-purple-600 rounded-2xl py-3.5 font-medium hover:bg-purple-50 transition text-sm"
        >
          <Plus size={18} />
          Cadastrar novo estabelecimento
        </Link>
      </div>
    </div>
  )
}
