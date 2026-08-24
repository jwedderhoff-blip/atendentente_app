import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient

try {
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl === 'https://SEU_PROJETO.supabase.co'
  ) {
    // Modo demo — cria um cliente com URL inválida que nunca será chamado
    // graças ao guard isDemo nos hooks.
    supabase = createClient('https://demo.supabase.co', 'demo-key')
  } else {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  }
} catch {
  supabase = createClient('https://demo.supabase.co', 'demo-key')
}

export { supabase }
