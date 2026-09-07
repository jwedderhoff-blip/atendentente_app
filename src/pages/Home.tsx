import { Link } from 'react-router-dom'
import {
  Calendar,
  Bell,
  Briefcase,
  Users,
  CreditCard,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Imagens do slideshow hero
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&auto=format&fit=crop&q=80', // salão
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1600&auto=format&fit=crop&q=80', // barbearia
  'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1600&auto=format&fit=crop&q=80', // pilates
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&auto=format&fit=crop&q=80', // academia
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&auto=format&fit=crop&q=80', // estética
]

const features = [
  {
    icon: Calendar,
    title: 'Agendamento online',
    description: 'Clientes agendam pelo link do seu negócio, 24 horas por dia.',
    color: '#6366f1',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Envio automático de lembretes por WhatsApp e e-mail antes do horário.',
    color: '#8b5cf6',
  },
  {
    icon: Briefcase,
    title: 'Catálogo de serviços',
    description: 'Cadastre serviços com duração e preço para facilitar a escolha.',
    color: '#ec4899',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Histórico completo, notas e exportação em CSV a qualquer momento.',
    color: '#14b8a6',
  },
  {
    icon: CreditCard,
    title: 'Pagamento integrado',
    description: 'Receba online no ato do agendamento com checkout integrado.',
    color: '#f59e0b',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel completo',
    description: 'Visualize a agenda, equipe e desempenho em um só lugar.',
    color: '#3b82f6',
  },
]

const stats = [
  { value: 'Quem acredita,', label: 'cresce com a gente', icon: TrendingUp },
  { value: '98%', label: 'Satisfação dos clientes', icon: Star },
  { value: '< 5 min', label: 'Para configurar', icon: Clock },
  { value: 'Grátis', label: 'Para começar', icon: CheckCircle2 },
]

const categories = [
  {
    label: 'Salão de Beleza',
    examples: ['Corte, escova e coloração', 'Manicure e pedicure'],
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Barbearia',
    examples: ['Corte masculino e barba', 'Tratamento capilar'],
    img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Serviços de Beleza',
    examples: ['Unhas e nail design', 'Cílios, sobrancelhas e micropigmentação'],
    img: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Centro de Estética',
    examples: ['Limpeza de pele e depilação', 'Massagem e drenagem'],
    img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Estúdio de Pilates',
    examples: ['Pilates individual e em grupo', 'Avaliação postural'],
    img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Aulas Coletivas',
    examples: ['Balé, dança e zumba', 'Jiu-jitsu, karatê e artes marciais'],
    img: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Avaliação Física',
    examples: ['Bioimpedância e antropometria', 'Prescrição de treino'],
    img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Avaliação Nutricional',
    examples: ['Consulta e plano alimentar', 'Acompanhamento nutricional'],
    img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&auto=format&fit=crop&q=75',
  },
  {
    label: 'Academia',
    examples: ['Personal trainer e musculação', 'Aulas funcionais e crossfit'],
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=75',
  },
]

const testimonials = [
  {
    name: 'Mariana Costa',
    role: 'Salão da Mari',
    text: 'Reduzi faltas em 70% com os lembretes automáticos. Minha agenda nunca esteve tão organizada.',
    avatar: 'MC',
    color: '#ec4899',
  },
  {
    name: 'Rafael Mendes',
    role: 'Barbearia RM',
    text: 'Meus clientes adoraram poder agendar pelo celular a qualquer hora. Aumentei os agendamentos em 40%.',
    avatar: 'RM',
    color: '#334155',
  },
  {
    name: 'Juliana Freitas',
    role: 'Studio Pilates Flex',
    text: 'A gestão de turmas e avaliações ficou simples. Economizo horas por semana que antes gastava no WhatsApp.',
    avatar: 'JF',
    color: '#7c3aed',
  },
]

export default function Home() {
  const { session } = useAuth()
  const n = HERO_IMAGES.length
  // Duração de cada slide: 6s, transição: 1.5s
  const slideDuration = 6
  const fadeDuration = 1.5
  const totalCycle = n * slideDuration

  return (
    <div className="min-h-screen bg-white">

      {/* ── Keyframes para slideshow e Ken Burns ── */}
      <style>{`
        @keyframes kenburns-1 {
          0%   { transform: scale(1)    translate(0%, 0%); }
          100% { transform: scale(1.12) translate(-2%, -1%); }
        }
        @keyframes kenburns-2 {
          0%   { transform: scale(1.08) translate(1%, 1%); }
          100% { transform: scale(1)    translate(-1%, 2%); }
        }
        @keyframes kenburns-3 {
          0%   { transform: scale(1)    translate(-1%, 1%); }
          100% { transform: scale(1.10) translate(2%, -2%); }
        }
        @keyframes kenburns-4 {
          0%   { transform: scale(1.05) translate(0%, -1%); }
          100% { transform: scale(1)    translate(-2%, 1%); }
        }
        @keyframes kenburns-5 {
          0%   { transform: scale(1)    translate(1%, 0%); }
          100% { transform: scale(1.12) translate(-1%, -2%); }
        }
        @keyframes slide-fade {
          0%                                          { opacity: 0; }
          ${(fadeDuration / totalCycle * 100).toFixed(1)}%  { opacity: 1; }
          ${((slideDuration - fadeDuration) / totalCycle * 100).toFixed(1)}% { opacity: 1; }
          ${(slideDuration / totalCycle * 100).toFixed(1)}% { opacity: 0; }
          100%                                        { opacity: 0; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50%      { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
        }
      `}</style>

      {/* ══════════════════════════════════════════
          HERO — slideshow de fundo + Ken Burns
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Slides empilhados */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0"
            style={{
              animation: `slide-fade ${totalCycle}s ease-in-out ${i * slideDuration}s infinite`,
              opacity: i === 0 ? 1 : 0,
              zIndex: 0,
            }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              style={{
                animation: `kenburns-${i + 1} ${totalCycle}s ease-in-out ${i * slideDuration}s infinite alternate`,
              }}
            />
          </div>
        ))}

        {/* Overlay gradiente — mais escuro para contraste do texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(5,4,20,0.70) 0%, rgba(5,4,20,0.78) 50%, rgba(5,4,20,0.92) 100%)',
            zIndex: 1,
          }}
        />

        {/* Conteúdo */}
        <div className="relative text-center px-6 max-w-4xl mx-auto" style={{ zIndex: 2 }}>
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold uppercase tracking-widest"
            style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.5)', color: '#a5b4fc' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" style={{ animation: 'pulse-glow 2s infinite' }} />
            Desenvolvida para o seu negócio
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6"
            style={{ textShadow: '0 2px 16px rgba(0,0,0,0.7)' }}
          >
            Seu negócio,{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #a5b4fc 0%, #d8b4fe 50%, #f9a8d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
              }}
            >
              sem complicações
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            Agendamento online, lembretes automáticos e gestão completa para salões,
            barbearias, estética, pilates, aulas coletivas e muito mais.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            {session ? (
              <Link
                to="/selecionar"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
                }}
              >
                Acessar minha conta <ArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
                  }}
                >
                  Começar grátis agora <ArrowRight size={18} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: 'white',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  Já tenho conta
                </Link>
              </>
            )}
          </div>

          {/* Prova social */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['MC', 'RM', 'JF', 'AS', 'PL'].map((initials, i) => (
                <div
                  key={initials}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ring-2 ring-black/30"
                  style={{
                    background: ['#ec4899','#334155','#7c3aed','#16a34a','#f59e0b'][i],
                    zIndex: 5 - i,
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-white/80 text-sm" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}>
              Junte-se a quem já acredita e <span className="text-white font-semibold">cresce com a gente</span>
            </p>

          </div>
        </div>

        {/* Seta scroll */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/50 text-xs"
          style={{ zIndex: 2, animation: 'float-up 2.5s ease-in-out infinite' }}
        >
          <span>Scroll</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12L2 6h12L8 12z" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}
        className="py-12 px-6"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                style={{ background: 'rgba(99,102,241,0.25)' }}
              >
                <Icon size={22} className="text-indigo-300" />
              </div>
              <p className="text-3xl font-extrabold text-white">{value}</p>
              <p className="text-sm text-indigo-300">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FUNCIONALIDADES
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Recursos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Ferramentas profissionais pensadas para quem trabalha com serviços e precisa de tempo livre.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DEPOIMENTOS
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Quem usa, recomenda
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar, color }) => (
              <div key={name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col gap-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" className="text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PARA QUEM É
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Segmentos</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Para quem é?</h2>
            <p className="text-gray-500 mt-3">Do salão ao estúdio de pilates, o MeuToki se adapta ao seu negócio.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(({ label, examples, img }) => (
              <div
                key={label}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-bold text-white text-base drop-shadow">
                    {label}
                  </h3>
                </div>
                <div className="p-4">
                  <ul className="space-y-1.5">
                    {examples.map((ex) => (
                      <li key={ex} className="text-sm text-gray-500 flex items-center gap-2">
                        <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="relative py-24 px-6 text-center overflow-hidden">
        {/* Fundo animado */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ec4899 0%, transparent 40%), radial-gradient(circle at 60% 80%, #8b5cf6 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-2xl mx-auto" style={{ zIndex: 1 }}>
          <p className="text-indigo-300 font-semibold text-sm uppercase tracking-widest mb-4">Comece hoje</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Seu negócio merece uma{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #818cf8, #c084fc)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              gestão profissional
            </span>
          </h2>
          <p className="text-slate-400 mb-10 text-lg">
            Sem cartão de crédito. Configure em menos de 5 minutos.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-all duration-200 hover:scale-105 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 12px 40px rgba(99,102,241,0.5)',
            }}
          >
            Criar minha conta grátis <ArrowRight size={20} />
          </Link>
          <p className="text-slate-500 text-sm mt-5">
            Sem complicações. Do cadastro ao primeiro agendamento em minutos.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 text-center text-sm text-gray-400 bg-white border-t border-gray-100">
        <p className="mb-1 font-semibold text-gray-600">MeuToki</p>
        © {new Date().getFullYear()} MeuToki. Todos os direitos reservados.
      </footer>
    </div>
  )
}
