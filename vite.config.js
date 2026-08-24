import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 3000000,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Meus Gastinhos',
        short_name: 'Gastinhos',
        description: 'Seu controle financeiro simples, privado e direto ao ponto.',
        theme_color: '#183b34',
        background_color: '#f5f3ed',
        display: 'standalone',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  build: { target: 'es2020', sourcemap: true },
})
