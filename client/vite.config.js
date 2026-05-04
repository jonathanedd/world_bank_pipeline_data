import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react-simple-maps', 'd3-scale', 'prop-types'], // Forzamos a Vite a procesar estas librerías
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true, // Esto permite mezclar require con import
    },
  },
})