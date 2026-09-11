import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CreditCard, Users2, Bell, LogOut, ShieldCheck, Receipt,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/superadmin/estabelecimentos', label: 'Estabelecimentos', icon: Building2, end: false },
  { to: '/superadmin/planos', label: 'Planos', icon: CreditCard, end: false },
  { to: '/superadmin/assinaturas', label: 'Assinaturas', icon: Users2, end: false },
  { to: '/superadmin/cobrancas', label: 'Cobranças', icon: Receipt, end: false },
  { to: '/superadmin/notificacoes', label: 'Notificações', icon: Bell, end: false },
]

export default function SuperAdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="superadmin-theme min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        {/* Identificação */}
        <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 leading-tight">Painel da Plataforma</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sair"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition shrink-0"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* Abas */}
        <nav className="flex gap-1 px-2 sm:px-4 overflow-x-auto" aria-label="Seções do painel">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition',
                  isActive
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
