import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The Vercel–Supabase integration injects SUPABASE_URL / SUPABASE_ANON_KEY
// (no VITE_ prefix). Map them so the client bundle can read them via
// import.meta.env.VITE_SUPABASE_*. VITE_* vars in .env take precedence
// for local development.
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? ''

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
  },
  build: {
    // Code-split vendor bundles so the initial load is smaller
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router')) {
            return 'vendor-react'
          }
          if (id.includes('i18next')) return 'vendor-i18n'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('zustand') || id.includes('lz-string') || id.includes('canvas-confetti')) {
            return 'vendor-utils'
          }
        },
      },
    },
    // Raise the warning threshold slightly — we know the split is good
    chunkSizeWarningLimit: 400,
  },
})
