import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Admin from './pages/Admin'
import Booking from './pages/Booking'
import Home from './pages/Home'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Booking />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
