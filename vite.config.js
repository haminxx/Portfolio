import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Stay on Vite 7 + Rollup for production: Vite 8's Rolldown bundler has shipped React interop
    // bugs ("is not a constructor" / invalid element type) with this app's dependency graph.
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split heavy libraries into dedicated chunks for better caching
          if (id.includes('node_modules/maplibre-gl')) {
            return 'vendor-maplibre'
          }
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer'
          }
          if (id.includes('node_modules/date-fns') || id.includes('node_modules/react-day-picker')) {
            return 'vendor-dates'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/dos-proxy': {
        target: 'https://cdn.dos.zone',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/dos-proxy/, ''),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
