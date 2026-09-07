import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  MapPin, Phone, Clock, ChevronRight, MessageCircle, X,
  Scissors, Droplets, Palette, Sparkles, Dumbbell, Activity,
  Apple, Heart, Star, Eye, Zap, Leaf, ClipboardList, Wind,
  Baby, Sun, CalendarCheck, type LucideIcon,
} from 'lucide-react'
import { useEstablishmentBySlug } from '../hooks/useEstablishment'
import { useServices } from '../hooks/useServices'
import { formatCurrency } from '../lib/utils'
import type { Establishment } from '../types'
import type { Service } from '../types'

// ── Imagem hero por categoria (Unsplash) ─────────────────────────────────────
const CATEGORY_HERO: Record<Establishment['category'], string> = {
  salao: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
  barbearia: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80',
  estetica: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&auto=format&fit=crop&q=80',
  beleza: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&auto=format&fit=crop&q=80',
  pilates: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&auto=format&fit=crop&q=80',
  aulas_coletivas: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=1200&auto=format&fit=crop&q=80',
  avaliacao_fisica: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=80',
  avaliacao_nutricional: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop&q=80',
  academia: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80',
  outro: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
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
  outro: 'Estabelecimento',
}

// cor de destaque por categoria: [bg-button, shadow-button, bg-icon, text-icon, bg-badge, text-badge, gradient-from]
type CategoryColor = { btn: string; btnHover: string; shadow: string; iconBg: string; iconText: string; badge: string; badgeText: string; gradientFrom: string }
const CATEGORY_COLORS: Record<Establishment['category'], CategoryColor> = {
  salao:               { btn: 'bg-pink-500',    btnHover: 'hover:bg-pink-600',    shadow: 'shadow-pink-300',    iconBg: 'bg-pink-500',    iconText: 'text-white', badge: 'bg-pink-500/20',    badgeText: 'text-pink-100',  gradientFrom: 'from-pink-900/80' },
  barbearia:           { btn: 'bg-slate-700',   btnHover: 'hover:bg-slate-800',   shadow: 'shadow-slate-400',   iconBg: 'bg-slate-700',   iconText: 'text-white', badge: 'bg-slate-600/30',   badgeText: 'text-slate-100', gradientFrom: 'from-slate-900/90' },
  estetica:            { btn: 'bg-fuchsia-500', btnHover: 'hover:bg-fuchsia-600', shadow: 'shadow-fuchsia-300', iconBg: 'bg-fuchsia-500', iconText: 'text-white', badge: 'bg-fuchsia-500/20', badgeText: 'text-fuchsia-100', gradientFrom: 'from-fuchsia-900/80' },
  beleza:              { btn: 'bg-rose-500',    btnHover: 'hover:bg-rose-600',    shadow: 'shadow-rose-300',    iconBg: 'bg-rose-500',    iconText: 'text-white', badge: 'bg-rose-500/20',    badgeText: 'text-rose-100',  gradientFrom: 'from-rose-900/80' },
  pilates:             { btn: 'bg-violet-600',  btnHover: 'hover:bg-violet-700',  shadow: 'shadow-violet-300',  iconBg: 'bg-violet-600',  iconText: 'text-white', badge: 'bg-violet-500/20',  badgeText: 'text-violet-100', gradientFrom: 'from-violet-900/80' },
  aulas_coletivas:     { btn: 'bg-orange-500',  btnHover: 'hover:bg-orange-600',  shadow: 'shadow-orange-300',  iconBg: 'bg-orange-500',  iconText: 'text-white', badge: 'bg-orange-500/20',  badgeText: 'text-orange-100', gradientFrom: 'from-orange-900/80' },
  avaliacao_fisica:    { btn: 'bg-blue-600',    btnHover: 'hover:bg-blue-700',    shadow: 'shadow-blue-300',    iconBg: 'bg-blue-600',    iconText: 'text-white', badge: 'bg-blue-500/20',    badgeText: 'text-blue-100',  gradientFrom: 'from-blue-900/80' },
  avaliacao_nutricional:{ btn: 'bg-green-600',  btnHover: 'hover:bg-green-700',   shadow: 'shadow-green-300',   iconBg: 'bg-green-600',   iconText: 'text-white', badge: 'bg-green-500/20',   badgeText: 'text-green-100', gradientFrom: 'from-green-900/80' },
  academia:            { btn: 'bg-gray-800',    btnHover: 'hover:bg-gray-900',    shadow: 'shadow-gray-400',    iconBg: 'bg-gray-800',    iconText: 'text-white', badge: 'bg-gray-600/30',    badgeText: 'text-gray-100',  gradientFrom: 'from-gray-900/90' },
  outro:               { btn: 'bg-indigo-600',  btnHover: 'hover:bg-indigo-700',  shadow: 'shadow-indigo-300',  iconBg: 'bg-indigo-600',  iconText: 'text-white', badge: 'bg-indigo-500/20',  badgeText: 'text-indigo-100', gradientFrom: 'from-indigo-900/80' },
}

const CATEGORY_ICONS: Record<Establishment['category'], LucideIcon> = {
  salao: Scissors, barbearia: Scissors, estetica: Sparkles, beleza: Star,
  pilates: Dumbbell, aulas_coletivas: Heart, avaliacao_fisica: Activity,
  avaliacao_nutricional: Apple, academia: Dumbbell, outro: Sparkles,
}

// ── Ícone + imagem por serviço ────────────────────────────────────────────────
interface ServiceVisual { icon: LucideIcon; bg: string; text: string; img: string }

const SERVICE_RULES: { keywords: string[]; icon: LucideIcon; bg: string; text: string; img: string }[] = [
  {
    keywords: ['corte', 'cabelo', 'tesoura', 'franja', 'degrade', 'degradê'],
    icon: Scissors, bg: 'bg-violet-100', text: 'text-violet-600',
    img: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['barba', 'bigode', 'navalha', 'barbear'],
    icon: Scissors, bg: 'bg-slate-100', text: 'text-slate-600',
    img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['escova', 'progressiva', 'alisamento', 'blow'],
    icon: Wind, bg: 'bg-sky-100', text: 'text-sky-600',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['hidrat', 'nutrição', 'reconstru', 'banho de creme', 'máscara'],
    icon: Droplets, bg: 'bg-cyan-100', text: 'text-cyan-600',
    img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['color', 'tintura', 'mechas', 'loiro', 'reflexo', 'tint', 'luzes'],
    icon: Palette, bg: 'bg-pink-100', text: 'text-pink-600',
    img: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['manicure', 'pedicure', 'unha', 'nail', 'esmalt'],
    icon: Star, bg: 'bg-rose-100', text: 'text-rose-600',
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['sobrancelha', 'design', 'micropigment', 'olho', 'cílio', 'cilio'],
    icon: Eye, bg: 'bg-amber-100', text: 'text-amber-600',
    img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['depilação', 'depilacao', 'laser', 'cera', 'pelo'],
    icon: Zap, bg: 'bg-yellow-100', text: 'text-yellow-600',
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['massagem', 'massage', 'relaxamento', 'spa', 'drenagem'],
    icon: Heart, bg: 'bg-red-100', text: 'text-red-600',
    img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['facial', 'limpeza de pele', 'peeling', 'botox', 'preench'],
    icon: Sparkles, bg: 'bg-fuchsia-100', text: 'text-fuchsia-600',
    img: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['balé', 'bale', 'ballet', 'dança', 'dance', 'zumba', 'ritmos', 'contemporâneo', 'hip hop'],
    icon: Star, bg: 'bg-pink-100', text: 'text-pink-600',
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['jiu', 'karate', 'muay', 'boxe', 'luta', 'arte marcial', 'judô', 'judo', 'kung', 'krav', 'aikido', 'taekwondo'],
    icon: Zap, bg: 'bg-orange-100', text: 'text-orange-600',
    img: 'https://images.unsplash.com/photo-1555597408-26bc8e548a46?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['pilates', 'yoga', 'alongamento', 'stretching'],
    icon: Dumbbell, bg: 'bg-indigo-100', text: 'text-indigo-600',
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['academia', 'musculação', 'funcional', 'crossfit', 'treino', 'fitness'],
    icon: Dumbbell, bg: 'bg-indigo-100', text: 'text-indigo-600',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['avaliação física', 'avaliacao física', 'avaliação fisica', 'bioimpedância', 'medida', 'antropom'],
    icon: Activity, bg: 'bg-blue-100', text: 'text-blue-600',
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['nutri', 'dieta', 'alimentação', 'aliment', 'cardápio'],
    icon: Apple, bg: 'bg-green-100', text: 'text-green-600',
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['infantil', 'criança', 'baby', 'bebê'],
    icon: Baby, bg: 'bg-orange-100', text: 'text-orange-600',
    img: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['bronz', 'solário', 'autobronz'],
    icon: Sun, bg: 'bg-yellow-100', text: 'text-yellow-600',
    img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['consulta', 'avaliação', 'avaliacao', 'anamnese', 'check'],
    icon: ClipboardList, bg: 'bg-teal-100', text: 'text-teal-600',
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=75',
  },
  {
    keywords: ['natural', 'orgânic', 'botânic', 'erva'],
    icon: Leaf, bg: 'bg-lime-100', text: 'text-lime-600',
    img: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&auto=format&fit=crop&q=75',
  },
]

const DEFAULT_VISUAL: ServiceVisual = {
  icon: Sparkles, bg: 'bg-indigo-100', text: 'text-indigo-600',
  img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=75',
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

// ── Modal de detalhes do serviço ──────────────────────────────────────────────
interface ServiceDetailModalProps {
  service: Service
  slug: string
  onClose: () => void
}

function ServiceDetailModal({ service, slug, onClose }: ServiceDetailModalProps) {
  const navigate = useNavigate()
  const { icon: Icon, bg, text, img } = getServiceVisual(service.name)

  const handleBook = () => {
    navigate(`/agendar/${slug}/agendar`, { state: { preselectedServiceId: service.id } })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sheet — desliza de baixo em mobile, centralizado em desktop */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-6">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]">

          {/* Imagem do serviço — fixa no topo, não rola */}
          <div className="relative h-52 sm:h-56 overflow-hidden shrink-0 rounded-t-3xl sm:rounded-t-3xl">
            <img
              src={img}
              alt={service.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Botão fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Conteúdo rolável */}
          <div className="overflow-y-auto flex-1 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={20} className={text} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{service.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock size={13} /> {service.duration_minutes} min
                  </span>
                  <span className="text-sm font-bold text-indigo-600">
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
            </div>

            {service.description ? (
              <p className="text-sm text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {service.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic mb-6">
                Sem descrição adicional para este serviço.
              </p>
            )}

            {/* Resumo em chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                <Clock size={11} /> {service.duration_minutes} minutos
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 font-semibold px-3 py-1.5 rounded-full">
                {formatCurrency(service.price)}
              </span>
            </div>
          </div>

          {/* CTAs — fixos no rodapé, não rolam */}
          <div className="p-6 pt-0 flex flex-col gap-2.5 shrink-0">
            <button
              onClick={handleBook}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-4 rounded-2xl transition text-base shadow-md shadow-indigo-200"
            >
              <CalendarCheck size={20} />
              Agendar este serviço
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-semibold py-3.5 rounded-2xl transition text-base"
            >
              Escolher outro serviço
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function EstabelecimentoPage() {
  const { slug } = useParams<{ slug: string }>()
  const { establishment, loading } = useEstablishmentBySlug(slug)
  const { services } = useServices(establishment?.id)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const activeServices = services.filter((s) => s.active)
  const category = establishment?.category ?? 'outro'
  const categoryLabel = CATEGORY_LABELS[category]
  const heroImage = establishment?.logo_url ?? CATEGORY_HERO[category]
  const colors = CATEGORY_COLORS[category]
  const CategoryIcon = CATEGORY_ICONS[category]
  const whatsappUrl = establishment?.phone
    ? `https://wa.me/55${formatPhone(establishment.phone)}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!establishment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-gray-500 mb-2">Estabelecimento não encontrado.</p>
          <Link to="/" className="text-sm text-indigo-600 hover:underline">Voltar ao início</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={heroImage}
          alt={categoryLabel}
          className="w-full h-full object-cover"
        />
        {/* gradiente duplo: cor da categoria em baixo, escuro no topo */}
        <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradientFrom} via-black/20 to-black/40`} />

        {/* Badge de categoria no topo */}
        <div className="absolute top-4 left-0 right-0 flex justify-center">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${colors.badge} ${colors.badgeText} backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20`}>
            <CategoryIcon size={11} />
            {categoryLabel}
          </span>
        </div>

        {/* Nome + tagline no rodapé do hero */}
        <div className="absolute bottom-14 left-0 right-0 px-5 max-w-lg mx-auto text-center">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">
            {establishment.name}
          </h1>
          {establishment.tagline && (
            <p className="mt-1 text-sm sm:text-base text-white/80 drop-shadow">
              {establishment.tagline}
            </p>
          )}
        </div>
      </div>

      {/* ── Ícone flutuante + card de infos ── */}
      <div className="max-w-lg mx-auto px-4 -mt-6 relative z-10">

        {/* Ícone da categoria flutuando sobre o hero */}
        <div className="flex justify-center -mt-8 mb-4">
          <div className={`w-16 h-16 rounded-2xl ${colors.iconBg} ${colors.iconText} flex items-center justify-center shadow-xl ring-4 ring-white`}>
            <CategoryIcon size={30} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5">
          {/* Infos de contato */}
          {(establishment.address || establishment.phone) && (
            <div className="space-y-2 mb-5">
              {establishment.address && (
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={14} className="text-gray-400" />
                  </div>
                  <span className="pt-1.5 leading-snug">{establishment.address}</span>
                </div>
              )}
              {establishment.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-gray-400" />
                  </div>
                  <span>{establishment.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col gap-2.5">
            <Link
              to={`/agendar/${slug}/agendar`}
              className={`flex items-center justify-center gap-2 ${colors.btn} ${colors.btnHover} active:scale-95 text-white font-bold py-4 rounded-2xl transition text-base shadow-lg ${colors.shadow}`}
            >
              <CalendarCheck size={20} />
              Agendar agora
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] active:scale-95 text-white font-semibold py-3.5 rounded-2xl transition text-base"
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
        <p className="text-sm text-gray-400 mb-5">Toque em um serviço para ver detalhes e agendar</p>

        {activeServices.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum serviço disponível.</p>
        ) : (
          <div className="space-y-3">
            {activeServices.map((s) => {
              const { icon: Icon, bg, text, img } = getServiceVisual(s.name)
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className="w-full flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md active:scale-[.99] transition overflow-hidden group text-left"
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
                        <span className="text-xs font-bold text-indigo-700">
                          {formatCurrency(s.price)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 shrink-0 group-hover:text-indigo-400 transition" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Botão fixo em mobile ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-gray-100 lg:hidden z-20">
        <Link
          to={`/agendar/${slug}/agendar`}
          className={`flex items-center justify-center gap-2 ${colors.btn} ${colors.btnHover} text-white font-bold py-3.5 rounded-2xl transition text-base w-full shadow-lg ${colors.shadow}`}
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

      {/* ── Modal de detalhes do serviço ── */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          slug={slug!}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}
