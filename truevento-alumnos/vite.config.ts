import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/*.png', 'fonts/*.woff2', 'logo-truevento.png', 'logo-truevento.svg'],
        manifest: {
          id: '/',
          name: 'TRUEVENTO Kiteschool',
          short_name: 'Truevento',
          description: 'Clases, progreso y viento · Aulas, progresso e vento · Lessons, progress and wind',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#07060f',
          background_color: '#07060f',
          categories: ['sports', 'education'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Agenda', url: '/agenda', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Viento', url: '/viento', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,woff2,webmanifest}'],
          // the install tutorial is read before installing: not kept offline
          globIgnores: ['**/instalar.html'],
          navigateFallback: '/index.html',
          // the install tutorial is its own page (app.truevento.com/instalar)
          navigateFallbackDenylist: [/^\/instalar/],
          cleanupOutdatedCaches: true,
          // notifications on the phone (public/push-sw.js)
          importScripts: ['push-sw.js'],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          // libraries in their own files: they rarely change, so after an update phones
          // download only the app's own code again
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
            if (id.includes('react-router')) return 'router'
            if (id.includes('@supabase')) return 'supabase'
            return 'vendor'
          },
        },
      },
    },
  }
})
