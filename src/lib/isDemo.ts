const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL

export const isDemo =
  !supabaseUrl ||
  supabaseUrl === 'https://SEU_PROJETO.supabase.co'
