import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
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
