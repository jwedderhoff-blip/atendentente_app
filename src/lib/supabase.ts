import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare const __SUPABASE_URL__: string
declare const __SUPABASE_KEY__: string

let supabase: SupabaseClient

try {
  if (!__SUPABASE_URL__ || __SUPABASE_URL__ === 'https://SEU_PROJETO.supabase.co') {
    supabase = createClient('https://demo.supabase.co', 'demo-key')
  } else {
    supabase = createClient(__SUPABASE_URL__, __SUPABASE_KEY__)
  }
} catch {
  supabase = createClient('https://demo.supabase.co', 'demo-key')
}

export { supabase }
