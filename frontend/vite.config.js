import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path" // <--- Ajoute cette ligne

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Ceci dit à Vite : "Quand tu vois @, regarde dans le dossier src"
      "@": path.resolve(__dirname, "./src"),
    },
  },
})