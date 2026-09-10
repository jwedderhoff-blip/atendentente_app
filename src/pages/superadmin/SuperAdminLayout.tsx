import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, CreditCard, Users2, LogOut, ShieldCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/superadmin/estabelecimentos', label: 'Estabelecimentos', icon: Building2, end: false },
  { to: '/superadmin/planos', label: 'Planos', icon: CreditCard, end: false },
  { to: '/superadmin/assinaturas', label: 'Assinaturas', icon: Users2, end: false },
]

export default function SuperAdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Painel da Plataforma</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="superadmin-theme min-h-screen bg-gray-50">
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white border-r border-gray-200">
        {sidebar}
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Super Admin
          </span>
          <span className="text-sm text-gray-400 truncate">{user?.email}</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
