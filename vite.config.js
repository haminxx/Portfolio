import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
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
