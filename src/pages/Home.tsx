export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Atendente App</h1>
        <p className="text-lg text-gray-600 mb-8">
          Agendamento online para salões, barbearias, estética e pilates
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/agendar" className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
            Agendar agora
          </a>
          <a href="/admin" className="border border-purple-600 text-purple-600 px-6 py-3 rounded-xl font-medium hover:bg-purple-50 transition">
            Área do profissional
          </a>
        </div>
      </div>
    </div>
  )
}
