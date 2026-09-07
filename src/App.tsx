import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AdminLayout from './components/layout/AdminLayout'
import DemoBanner from './components/ui/DemoBanner'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Booking from './pages/Booking'
import EstabelecimentoPage from './pages/EstabelecimentoPage'
import NotFound from './pages/NotFound'
import Dashboard from './pages/admin/Dashboard'
import Agenda from './pages/admin/Agenda'
import Clientes from './pages/admin/Clientes'
import Servicos from './pages/admin/Servicos'
import Profissionais from './pages/admin/Profissionais'
import Configuracoes from './pages/admin/Configuracoes'
import SelecionarEstabelecimento from './pages/admin/SelecionarEstabelecimento'
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout'
import SuperDashboard from './pages/superadmin/SuperDashboard'
import SuperEstabelecimentos from './pages/superadmin/SuperEstabelecimentos'
import SuperPlanos from './pages/superadmin/SuperPlanos'
import SuperAssinaturas from './pages/superadmin/SuperAssinaturas'
import './index.css'

const SUPERADMIN_EMAIL = import.meta.env.VITE_SUPERADMIN_EMAIL as string | undefined

function PrivateRoute() {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <Outlet />
}

function SuperAdminRoute() {
  const { session, user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (SUPERADMIN_EMAIL && user?.email !== SUPERADMIN_EMAIL) return <Navigate to="/admin" replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/agendar/:slug" element={<EstabelecimentoPage />} />
      <Route path="/agendar/:slug/agendar" element={<Booking />} />
      <Route element={<PrivateRoute />}>
        <Route path="/selecionar" element={<SelecionarEstabelecimento />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="servicos" element={<Servicos />} />
          <Route path="profissionais" element={<Profissionais />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Route>
      <Route element={<SuperAdminRoute />}>
        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperDashboard />} />
          <Route path="estabelecimentos" element={<SuperEstabelecimentos />} />
          <Route path="planos" element={<SuperPlanos />} />
          <Route path="assinaturas" element={<SuperAssinaturas />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DemoBanner />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}
