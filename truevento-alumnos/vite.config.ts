import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/** Demo build only: replaces the data layer with an in-browser one (src/demo/api.ts). */
function demoBackend(): Plugin {
  const real = fileURLToPath(new URL('./src/lib/api.ts', import.meta.url))
  const demo = fileURLToPath(new URL('./src/demo/api.ts', import.meta.url))
  return {
    name: 'truevento-demo-backend',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      if (!importer || importer === demo || !/\/api(\.ts)?$/.test(source)) return null
      const resolved = await this.resolve(source, importer, { ...options, skipSelf: true })
      return resolved?.id === real ? demo : null
    },
  }
}

export default defineConfig(({ mode }) => {
  const demo = mode === 'demo'
  return {
    base: demo ? './' : '/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      'import.meta.env.VITE_DEMO': JSON.stringify(demo ? '1' : ''),
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(demo ? [demoBackend()] : []),
      VitePWA({
        disable: demo,
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
    build: demo
      ? { outDir: 'dist-demo', chunkSizeWarningLimit: 4000, rollupOptions: { output: { inlineDynamicImports: true } } }
      : undefined,
  }
})
