import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  Dumbbell,
  Store,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useEstablishment } from '../../hooks/useEstablishment'
import type { Establishment } from '../../types'

const CATEGORY_ICONS: Record<Establishment['category'], LucideIcon> = {
  salao: Scissors,
  barbearia: Scissors,
  estetica: Sparkles,
  pilates: Dumbbell,
  outro: Store,
}

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays, end: false },
  { to: '/admin/clientes', label: 'Clientes', icon: Users, end: false },
  { to: '/admin/servicos', label: 'Serviços', icon: ListChecks, end: false },
  { to: '/admin/profissionais', label: 'Profissionais', icon: UserCog, end: false },
  { to: '/admin/configuracoes', label: 'Configurações', icon: SlidersHorizontal, end: false },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const { establishment } = useEstablishment(user?.id)
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const CategoryIcon = CATEGORY_ICONS[establishment?.category ?? 'outro']

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
            <CategoryIcon size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {establishment?.name ?? 'Meu estabelecimento'}
            </p>
            <p className="text-xs text-gray-400 capitalize">{establishment?.category ?? ''}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                isActive
                  ? 'bg-purple-600 text-white'
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
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white border-r border-gray-200">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 lg:hidden flex flex-col">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm text-gray-400 truncate">
            {user?.email}
          </span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
