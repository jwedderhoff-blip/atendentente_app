import { isDemo } from '../../lib/isDemo'

export default function DemoBanner() {
  if (!isDemo) return null

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-yellow-400 text-yellow-900 text-sm flex items-center justify-between px-4 py-2 shadow-md">
      <span className="font-medium">
        Modo demonstração — configure o Supabase para ativar todas as funcionalidades
      </span>
      <a
        href="https://github.com/jwedderhoff/atendentente_app#readme"
        target="_blank"
        rel="noopener noreferrer"
        className="ml-4 shrink-0 bg-yellow-900 text-yellow-100 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-yellow-800 transition"
      >
        Ver instruções
      </a>
    </div>
  )
}
