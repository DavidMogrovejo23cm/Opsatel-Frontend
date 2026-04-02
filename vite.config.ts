import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true, // Escuchar en todas las interfaces para ngrok
    allowedHosts: true,
    cors: true, // Permitir cabeceras cruzadas en desarrollo
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/clientes': 'http://127.0.0.1:8000',
      '/extras': 'http://127.0.0.1:8000',
      '/configuraciones': 'http://127.0.0.1:8000',
      '/rutas_reportes': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000'
    }
  }
})