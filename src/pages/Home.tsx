import { Link } from 'react-router-dom'
import {
  Calendar,
  Bell,
  Briefcase,
  Users,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  {
    icon: Calendar,
    title: 'Agendamento online',
    description: 'Clientes agendam pelo link do seu negócio, 24 horas por dia.',
    img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&auto=format&fit=crop&q=75',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Envio automático de lembretes por WhatsApp e e-mail antes do horário.',
    img: 'https://pt.360nrs.com/assets/img/sections/whatsapp-masivos/ventajas-de-whatsapp.jpg',
  },
  {
    icon: Briefcase,
    title: 'Catálogo de serviços',
    description: 'Cadastre serviços com duração e preço para facilitar a escolha do cliente.',
    img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=75',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Histórico completo, notas e exportação em CSV a qualquer momento.',
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=75',
  },
  {
    icon: CreditCard,
    title: 'Pagamento integrado',
    description: 'Receba online no ato do agendamento com checkout integrado.',
    img: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&auto=format&fit=crop&q=75',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel completo',
    description: 'Visualize a agenda, equipe e desempenho em um só lugar.',
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=75',
  },
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

export default function Home() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-50 to-indigo-100 py-20 px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Seu negócio,{' '}
          <span className="text-indigo-600">sem complicações</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto mb-8">
          Agendamento online, lembretes automáticos e gestão completa para salões, barbearias,
          estética, pilates, avaliações físicas, nutricionais e academias.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {session ? (
            <Link
              to="/selecionar"
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-indigo-700 transition shadow-md"
            >
              Acessar minha conta
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-indigo-700 transition shadow-md"
              >
                Entrar na plataforma
              </Link>
              <Link
                to="/register"
                className="border-2 border-indigo-600 text-indigo-700 px-8 py-3 rounded-xl font-semibold text-base hover:bg-indigo-50 transition"
              >
                Criar minha conta
              </Link>
            </>
          )}
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
          Tudo que você precisa em um só lugar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, img }) => (
            <div
              key={title}
              className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition group"
            >
              {/* Foto */}
              <div className="h-40 overflow-hidden">
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              {/* Conteúdo */}
              <div className="p-5 flex flex-col gap-2">
                <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Para quem é ── */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Para quem é?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(({ label, examples, img }) => (
              <div
                key={label}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition group"
              >
                {/* Foto */}
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={img}
                    alt={label}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-3 left-4 font-bold text-white text-base drop-shadow">
                    {label}
                  </h3>
                </div>
                {/* Exemplos */}
                <div className="p-4">
                  <ul className="space-y-1.5">
                    {examples.map((ex) => (
                      <li key={ex} className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block shrink-0" />
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

      {/* ── CTA final ── */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-16 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Comece grátis hoje
        </h2>
        <p className="text-slate-300 mb-8 max-w-sm mx-auto">
          Sem cartão de crédito. Configure em menos de 5 minutos.
        </p>
        <Link
          to="/register"
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-3 rounded-xl font-semibold text-base transition shadow-lg shadow-indigo-900/50 inline-block"
        >
          Criar minha conta grátis
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} MeuToki. Todos os direitos reservados.
      </footer>
    </div>
  )
}
