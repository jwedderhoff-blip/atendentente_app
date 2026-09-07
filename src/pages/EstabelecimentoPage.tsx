import { Link, useParams } from 'react-router-dom'
import {
  MapPin, Phone, Clock, ChevronRight, MessageCircle,
  Scissors, Droplets, Palette, Sparkles, Dumbbell, Activity,
  Apple, Heart, Star, Eye, Zap, Leaf, ClipboardList, Wind,
  Baby, Sun, CalendarCheck, type LucideIcon,
} from 'lucide-react'
import { useEstablishmentBySlug } from '../hooks/useEstablishment'
import { useServices } from '../hooks/useServices'
import { formatCurrency } from '../lib/utils'
import type { Establishment } from '../types'

// ── Imagem hero por categoria (Unsplash) ─────────────────────────────────────
const CATEGORY_HERO: Record<Establishment['category'], string> = {
  salao: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
  barbearia: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80',
  estetica: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
  avaliacao_fisica: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=80',
  avaliacao_nutricional: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop&q=80',
  academia: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
  outro: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
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

// ── Ícone + imagem por serviço ────────────────────────────────────────────────
interface ServiceVisual { icon: LucideIcon; bg: string; text: string; img: string }

const SERVICE_RULES: { keywords: string[]; icon: LucideIcon; bg: string; text: string; img: string }[] = [
  {
    keywords: ['corte', 'cabelo', 'tesoura', 'franja', 'degrade', 'degradê'],
    icon: Scissors, bg: 'bg-violet-100', text: 'text-violet-600',
    img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['barba', 'bigode', 'navalha', 'barbear'],
    icon: Scissors, bg: 'bg-slate-100', text: 'text-slate-600',
    img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['escova', 'progressiva', 'alisamento', 'blow'],
    icon: Wind, bg: 'bg-sky-100', text: 'text-sky-600',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['hidrat', 'nutrição', 'reconstru', 'banho de creme', 'máscara'],
    icon: Droplets, bg: 'bg-cyan-100', text: 'text-cyan-600',
    img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['color', 'tintura', 'mechas', 'loiro', 'reflexo', 'tint', 'luzes'],
    icon: Palette, bg: 'bg-pink-100', text: 'text-pink-600',
    img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['manicure', 'pedicure', 'unha', 'nail', 'esmalt'],
    icon: Star, bg: 'bg-rose-100', text: 'text-rose-600',
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['sobrancelha', 'design', 'micropigment', 'olho', 'cílio', 'cilio'],
    icon: Eye, bg: 'bg-amber-100', text: 'text-amber-600',
    img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['depilação', 'depilacao', 'laser', 'cera', 'pelo'],
    icon: Zap, bg: 'bg-yellow-100', text: 'text-yellow-600',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['massagem', 'massage', 'relaxamento', 'spa', 'drenagem'],
    icon: Heart, bg: 'bg-red-100', text: 'text-red-600',
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['facial', 'limpeza de pele', 'peeling', 'botox', 'preench'],
    icon: Sparkles, bg: 'bg-fuchsia-100', text: 'text-fuchsia-600',
    img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['pilates', 'yoga', 'alongamento', 'stretching'],
    icon: Dumbbell, bg: 'bg-purple-100', text: 'text-purple-600',
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['academia', 'musculação', 'funcional', 'crossfit', 'treino', 'fitness'],
    icon: Dumbbell, bg: 'bg-indigo-100', text: 'text-indigo-600',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['avaliação física', 'avaliacao física', 'avaliação fisica', 'bioimpedância', 'medida', 'antropom'],
    icon: Activity, bg: 'bg-blue-100', text: 'text-blue-600',
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['nutri', 'dieta', 'alimentação', 'aliment', 'cardápio'],
    icon: Apple, bg: 'bg-green-100', text: 'text-green-600',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['infantil', 'criança', 'baby', 'bebê'],
    icon: Baby, bg: 'bg-orange-100', text: 'text-orange-600',
    img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['bronz', 'solário', 'autobronz'],
    icon: Sun, bg: 'bg-yellow-100', text: 'text-yellow-600',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['consulta', 'avaliação', 'avaliacao', 'anamnese', 'check'],
    icon: ClipboardList, bg: 'bg-teal-100', text: 'text-teal-600',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['natural', 'orgânic', 'botânic', 'erva'],
    icon: Leaf, bg: 'bg-lime-100', text: 'text-lime-600',
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&auto=format&fit=crop&q=70',
  },
]

const DEFAULT_VISUAL: ServiceVisual = {
  icon: Sparkles, bg: 'bg-purple-100', text: 'text-purple-600',
  img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&auto=format&fit=crop&q=70',
}

function getServiceVisual(name: string): ServiceVisual {
  const lower = name.toLowerCase()
  for (const rule of SERVICE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { icon: rule.icon, bg: rule.bg, text: rule.text, img: rule.img }
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
  const categoryLabel = CATEGORY_LABELS[establishment?.category ?? 'outro']
  const heroImage = CATEGORY_HERO[establishment?.category ?? 'outro']
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

      {/* ── Hero com foto da categoria ── */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img
          src={heroImage}
          alt={categoryLabel}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 max-w-lg mx-auto">
          <span className="inline-flex items-center text-xs font-semibold text-white/80 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
            {categoryLabel}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow">
            {establishment.name}
          </h1>
        </div>
      </div>

      {/* ── Card flutuante: infos + CTAs ── */}
      <div className="max-w-lg mx-auto px-4 -mt-4 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="space-y-2 mb-5">
            {establishment.address && (
              <div className="flex items-start gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={15} className="text-gray-500" />
                </div>
                <span className="pt-1.5">{establishment.address}</span>
              </div>
            )}
            {establishment.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Phone size={15} className="text-gray-500" />
                </div>
                <span>{establishment.phone}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              to={`/agendar/${slug}/agendar`}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition text-base shadow-md shadow-purple-200"
            >
              <CalendarCheck size={20} />
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

      {/* ── Lista de serviços ── */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Nossos serviços</h2>
        <p className="text-sm text-gray-400 mb-5">Toque em um serviço para agendar</p>

        {activeServices.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum serviço disponível.</p>
        ) : (
          <div className="space-y-3">
            {activeServices.map((s) => {
              const { icon: Icon, bg, text, img } = getServiceVisual(s.name)
              return (
                <Link
                  key={s.id}
                  to={`/agendar/${slug}/agendar`}
                  state={{ preselectedServiceId: s.id }}
                  className="flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-purple-300 hover:shadow-md active:scale-[.99] transition overflow-hidden group"
                >
                  {/* Foto do serviço */}
                  <div className="w-24 shrink-0 overflow-hidden">
                    <img
                      src={img}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex items-center gap-3 flex-1 px-4 py-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                      <Icon size={18} className={text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{s.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={10} /> {s.duration_minutes}min
                        </span>
                        <span className="text-xs font-bold text-purple-700">
                          {formatCurrency(s.price)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover:text-purple-400 transition" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Botão fixo em mobile ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100 lg:hidden z-20">
        <Link
          to={`/agendar/${slug}/agendar`}
          className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-2xl transition text-base w-full shadow-lg shadow-purple-300"
        >
          <CalendarCheck size={20} />
          Agendar agora
        </Link>
      </div>

      <div className="h-24 lg:hidden" />

      {/* ── Rodapé ── */}
      <div className="max-w-lg mx-auto px-4 pb-6 text-center">
        <p className="text-xs text-gray-300">Agendamento online via</p>
        <p className="text-xs font-bold text-gray-400 tracking-wide">MeuToki</p>
      </div>
    </div>
  )
}
