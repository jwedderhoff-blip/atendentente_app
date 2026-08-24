import { Link } from 'react-router-dom'
import {
  Calendar,
  Bell,
  Briefcase,
  Users,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Agendamento online',
    description: 'Clientes agendam pelo link do seu negócio, 24 horas por dia.',
  },
  {
    icon: Bell,
    title: 'Lembretes automáticos',
    description: 'Envio automático de lembretes por WhatsApp e e-mail antes do horário.',
  },
  {
    icon: Briefcase,
    title: 'Catálogo de serviços',
    description: 'Cadastre serviços com duração e preço para facilitar a escolha do cliente.',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Histórico completo, notas e exportação em CSV a qualquer momento.',
  },
  {
    icon: CreditCard,
    title: 'Pagamento integrado',
    description: 'Receba online no ato do agendamento com checkout integrado.',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel completo',
    description: 'Visualize a agenda, equipe e desempenho em um só lugar.',
  },
]

const categories = [
  {
    emoji: '💇',
    label: 'Salão de Beleza',
    examples: ['Corte, escova e coloração', 'Manicure e pedicure'],
  },
  {
    emoji: '✂️',
    label: 'Barbearia',
    examples: ['Corte masculino e barba', 'Tratamento capilar'],
  },
  {
    emoji: '✨',
    label: 'Centro de Estética',
    examples: ['Limpeza de pele e depilação', 'Massagem e drenagem'],
  },
  {
    emoji: '🧘',
    label: 'Estúdio de Pilates',
    examples: ['Pilates individual e em grupo', 'Avaliação postural'],
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 to-indigo-100 py-20 px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          Seu negócio,{' '}
          <span className="text-purple-600">sem complicações</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto mb-8">
          Agendamento online, lembretes automáticos e gestão completa para salões, barbearias,
          estética e pilates.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/agendar/bella-vita"
            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold text-base hover:bg-purple-700 transition shadow-md"
          >
            Ver demonstração
          </Link>
          <Link
            to="/register"
            className="border-2 border-purple-600 text-purple-600 px-8 py-3 rounded-xl font-semibold text-base hover:bg-purple-50 transition"
          >
            Criar minha conta
          </Link>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-16 px-6 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
          Tudo que você precisa em um só lugar
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-gray-50 rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Para quem é */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Para quem é?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {categories.map(({ emoji, label, examples }) => (
              <div
                key={label}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="text-4xl mb-3">{emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                <ul className="space-y-1">
                  {examples.map((ex) => (
                    <li key={ex} className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-purple-600 py-16 px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          Comece grátis hoje
        </h2>
        <p className="text-purple-100 mb-8 max-w-sm mx-auto">
          Sem cartão de crédito. Configure em menos de 5 minutos.
        </p>
        <Link
          to="/register"
          className="bg-white text-purple-700 px-8 py-3 rounded-xl font-semibold text-base hover:bg-purple-50 transition shadow-md inline-block"
        >
          Criar minha conta grátis
        </Link>
      </section>

      {/* Footer mínimo */}
      <footer className="py-6 px-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Atendente App. Todos os direitos reservados.
      </footer>
    </div>
  )
}
