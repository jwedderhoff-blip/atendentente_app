export const isDemo =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === 'https://SEU_PROJETO.supabase.co'
