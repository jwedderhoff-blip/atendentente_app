declare const __SUPABASE_URL__: string

export const isDemo =
  !__SUPABASE_URL__ ||
  __SUPABASE_URL__ === 'https://SEU_PROJETO.supabase.co'
