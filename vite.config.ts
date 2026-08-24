import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Expõe variáveis sem prefixo VITE_ também (ex: SUPABASE_URL no Vercel)
  envPrefix: ['VITE_', 'SUPABASE_'],
})
