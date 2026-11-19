import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/** Serves the Vercel functions in /api during `vite dev`, so the whole app runs locally. */
function devApi(): Plugin {
  return {
    name: 'truevento-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/users', async (req, res) => {
        try {
          const mod = (await server.ssrLoadModule('/api/users.ts')) as Record<string, (r: Request) => Promise<Response>>
          const handler = mod[req.method ?? 'GET']
          if (!handler) {
            res.statusCode = 405
            res.end()
            return
          }
          const chunks: Buffer[] = []
          for await (const c of req) chunks.push(c as Buffer)
          const request = new Request(`http://localhost${req.originalUrl ?? req.url}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.config.logger.error(String(err))
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Error interno' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // make server-only variables (no VITE_ prefix) visible to the dev API
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return {
    define: { __APP_VERSION__: JSON.stringify(pkg.version) },
    plugins: [
      react(),
      tailwindcss(),
      devApi(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: false,
        includeAssets: ['icons/*.png', 'icons/*.svg', 'fonts/*.woff2', 'logo-truevento.jpg'],
        manifest: {
          id: '/',
          name: 'TRUEVENTO · Gestión de la escuela',
          short_name: 'TRUEVENTO',
          description: 'Registro de clases, alumnos, instructores y liquidaciones de TRUEVENTO Kiteschool.',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['standalone', 'minimal-ui'],
          orientation: 'portrait',
          theme_color: '#0b2545',
          background_color: '#0b2545',
          categories: ['business', 'productivity', 'sports'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            { name: 'Registrar clase', short_name: 'Registrar', url: '/registrar', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Historial', url: '/historial', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
        workbox: {
          // the app shell is cached so the app opens without connection;
          // data is cached by the app itself (IndexedDB), never by the service worker
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2,webmanifest}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        },
        devOptions: { enabled: false },
      }),
    ],
    build: { chunkSizeWarningLimit: 900 },
  }
})
