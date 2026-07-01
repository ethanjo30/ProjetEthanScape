import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ajoutez cette section server :
  server: {
    proxy: {
      '/api': {
        target: 'https://projetethanscape.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})