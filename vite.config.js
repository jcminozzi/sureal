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
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 3000000,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'surReal IQ',
        short_name: 'surReal IQ',
        description: 'Seu dinheiro, com inteligência. Copiloto financeiro pessoal e privado.',
        theme_color: '#12212a',
        background_color: '#f4f6f9',
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
