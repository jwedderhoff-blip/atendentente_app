import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <p className="text-8xl font-extrabold text-purple-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
      <p className="text-gray-500 mb-8">
        O endereço que você tentou acessar não existe ou foi removido.
      </p>
      <Link
        to="/"
        className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition"
      >
        Voltar para o início
      </Link>
    </div>
  )
}
