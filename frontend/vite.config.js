import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'rentease-rwanda-production.up.railway.app',
        changeOrigin: true
      },
      '/uploads': {
        target: 'rentease-rwanda-production.up.railway.app',
        changeOrigin: true
      }
    }
  }
})
