import { Link, useParams } from 'react-router-dom'
import {
  MapPin, Phone, Clock, ChevronRight, MessageCircle,
  Scissors, Droplets, Palette, Sparkles, Dumbbell, Activity,
  Apple, Heart, Star, Eye, Zap, Leaf, ClipboardList, Wind,
  Baby, Sun, Store, type LucideIcon,
} from 'lucide-react'
import { useEstablishmentBySlug } from '../hooks/useEstablishment'
import { useServices } from '../hooks/useServices'
import { formatCurrency } from '../lib/utils'
import type { Establishment } from '../types'

// ── Ícone do estabelecimento por categoria ────────────────────────────────────
const CATEGORY_ICONS: Record<Establishment['category'], LucideIcon> = {
  salao: Scissors,
  barbearia: Scissors,
  estetica: Sparkles,
  pilates: Dumbbell,
  avaliacao_fisica: Activity,
  avaliacao_nutricional: Apple,
  academia: Dumbbell,
  outro: Store,
}

const CATEGORY_LABELS: Record<Establishment['category'], string> = {
  salao: 'Salão de Beleza',
  barbearia: 'Barbearia',
  estetica: 'Estética',
  pilates: 'Pilates',
  avaliacao_fisica: 'Avaliação Física',
  avaliacao_nutricional: 'Avaliação Nutricional',
  academia: 'Academia',
  outro: 'Estabelecimento',
}

// ── Ícone por serviço (mesmas regras do Booking) ──────────────────────────────
interface ServiceVisual { icon: LucideIcon; bg: string; text: string }

const SERVICE_RULES: { keywords: string[]; icon: LucideIcon; bg: string; text: string }[] = [
  { keywords: ['corte', 'cabelo', 'tesoura', 'franja', 'degrade', 'degradê'], icon: Scissors, bg: 'bg-violet-100', text: 'text-violet-600' },
  { keywords: ['barba', 'bigode', 'navalha', 'barbear'], icon: Scissors, bg: 'bg-slate-100', text: 'text-slate-600' },
  { keywords: ['escova', 'progressiva', 'alisamento', 'blow'], icon: Wind, bg: 'bg-sky-100', text: 'text-sky-600' },
  { keywords: ['hidrat', 'nutrição', 'reconstru', 'banho de creme', 'máscara'], icon: Droplets, bg: 'bg-cyan-100', text: 'text-cyan-600' },
  { keywords: ['color', 'tintura', 'mechas', 'loiro', 'reflexo', 'tint', 'luzes'], icon: Palette, bg: 'bg-pink-100', text: 'text-pink-600' },
  { keywords: ['manicure', 'pedicure', 'unha', 'nail', 'esmalt'], icon: Star, bg: 'bg-rose-100', text: 'text-rose-600' },
  { keywords: ['sobrancelha', 'design', 'micropigment', 'olho', 'cílio', 'cilio'], icon: Eye, bg: 'bg-amber-100', text: 'text-amber-600' },
  { keywords: ['depilação', 'depilacao', 'laser', 'cera', 'pelo'], icon: Zap, bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { keywords: ['massagem', 'massage', 'relaxamento', 'spa', 'drenagem'], icon: Heart, bg: 'bg-red-100', text: 'text-red-600' },
  { keywords: ['facial', 'limpeza de pele', 'peeling', 'botox', 'preench'], icon: Sparkles, bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' },
  { keywords: ['pilates', 'yoga', 'alongamento', 'stretching'], icon: Dumbbell, bg: 'bg-purple-100', text: 'text-purple-600' },
  { keywords: ['academia', 'musculação', 'funcional', 'crossfit', 'treino', 'fitness'], icon: Dumbbell, bg: 'bg-indigo-100', text: 'text-indigo-600' },
  { keywords: ['avaliação física', 'avaliacao física', 'avaliação fisica', 'bioimpedância', 'medida', 'antropom'], icon: Activity, bg: 'bg-blue-100', text: 'text-blue-600' },
  { keywords: ['nutri', 'dieta', 'alimentação', 'aliment', 'cardápio'], icon: Apple, bg: 'bg-green-100', text: 'text-green-600' },
  { keywords: ['infantil', 'criança', 'baby', 'bebê'], icon: Baby, bg: 'bg-orange-100', text: 'text-orange-600' },
  { keywords: ['bronz', 'solário', 'autobronz'], icon: Sun, bg: 'bg-yellow-100', text: 'text-yellow-600' },
  { keywords: ['consulta', 'avaliação', 'avaliacao', 'anamnese', 'check'], icon: ClipboardList, bg: 'bg-teal-100', text: 'text-teal-600' },
  { keywords: ['natural', 'orgânic', 'botânic', 'erva'], icon: Leaf, bg: 'bg-lime-100', text: 'text-lime-600' },
]

const DEFAULT_VISUAL: ServiceVisual = { icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-600' }

function getServiceVisual(name: string): ServiceVisual {
  const lower = name.toLowerCase()
  for (const rule of SERVICE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { icon: rule.icon, bg: rule.bg, text: rule.text }
    }
  }
  return DEFAULT_VISUAL
}

function formatPhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export default function EstabelecimentoPage() {
  const { slug } = useParams<{ slug: string }>()
  const { establishment, loading } = useEstablishmentBySlug(slug)
  const { services } = useServices(establishment?.id)

  const activeServices = services.filter((s) => s.active)
  const CategoryIcon = CATEGORY_ICONS[establishment?.category ?? 'outro']
  const categoryLabel = CATEGORY_LABELS[establishment?.category ?? 'outro']
  const whatsappUrl = establishment?.phone
    ? `https://wa.me/55${formatPhone(establishment.phone)}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-gray-500 mb-2">Estabelecimento não encontrado.</p>
          <Link to="/" className="text-sm text-purple-600 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 pt-10 pb-8">

          {/* Logo + nome */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
              <CategoryIcon size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{establishment.name}</h1>
            <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-purple-700 bg-purple-50 px-3 py-1 rounded-full font-medium">
              {categoryLabel}
            </span>
          </div>

          {/* Infos */}
          <div className="space-y-2.5 mb-6">
            {establishment.address && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span>{establishment.address}</span>
              </div>
            )}
            {establishment.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span>{establishment.phone}</span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Link
              to={`/agendar/${slug}/agendar`}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-semibold py-3.5 rounded-2xl transition text-base shadow-md shadow-purple-200"
            >
              <Clock size={18} />
              Agendar agora
            </Link>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold py-3.5 rounded-2xl transition text-base"
              >
                <MessageCircle size={18} />
                Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Serviços */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Nossos serviços</h2>
        <p className="text-sm text-gray-400 mb-4">Toque em um serviço para agendar</p>

        {activeServices.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum serviço disponível.</p>
        ) : (
          <div className="space-y-3">
            {activeServices.map((s) => {
              const { icon: Icon, bg, text } = getServiceVisual(s.name)
              return (
                <Link
                  key={s.id}
                  to={`/agendar/${slug}/agendar`}
                  state={{ preselectedServiceId: s.id }}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:border-purple-300 hover:shadow-sm active:scale-[.99] transition shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon size={22} className={text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{s.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} /> {s.duration_minutes}min
                      </span>
                      <span className="text-xs font-semibold text-purple-700">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="max-w-lg mx-auto px-4 pb-10 text-center">
        <p className="text-xs text-gray-300">Agendamento online via</p>
        <p className="text-xs text-gray-400 font-semibold">MeuToki</p>
      </div>
    </div>
  )
}
