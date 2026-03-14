import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
