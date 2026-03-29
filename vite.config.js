import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // No manualChunks: Vite 8 (Rolldown) + custom vendor splits for react / motion / firebase
    // produced cross-chunk bindings where `new` on a component/class threw "is not a constructor".
    rollupOptions: {},
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
        rewrite: (path) => path.replace(/^\/api\/dos-proxy/, ''),
      },
    },
  },
})
