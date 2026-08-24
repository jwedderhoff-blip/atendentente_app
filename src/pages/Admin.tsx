export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-gray-900">Atendente App</h1>
          <p className="text-xs text-gray-500">Painel administrativo</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {['Agenda', 'Clientes', 'Serviços', 'Relatórios', 'Configurações'].map(item => (
            <a key={item} href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition text-sm">
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <main className="ml-64 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agenda de hoje</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500 text-sm">Os agendamentos do dia aparecerão aqui após integração com Supabase.</p>
        </div>
      </main>
    </div>
  )
}
