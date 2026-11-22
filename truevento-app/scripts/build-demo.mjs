// Builds the self-contained demo page (dist-demo/truevento-demo.html): one HTML file with
// the app's script, styles, fonts and images inlined. Run: npm run build:demo
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'dist-demo')
execSync('npx vite build --mode demo', { cwd: root, stdio: 'inherit' })

let html = readFileSync(join(out, 'index.html'), 'utf8')
const read = (p) => readFileSync(join(out, p.replace(/^\.?\//, '')))
const dataUri = (p, type) => `data:${type};base64,${read(p).toString('base64')}`

// public files the app points to by absolute path
const assets = {
  '/fonts/outfit-latin.woff2': 'font/woff2',
  '/fonts/outfit-latin-ext.woff2': 'font/woff2',
  '/icons/icon-192.png': 'image/png',
  '/icons/favicon-64.png': 'image/png',
  '/logo-truevento.png': 'image/png',
}
const inlineAssets = (text) => {
  for (const [path, type] of Object.entries(assets)) {
    text = text.split(`..${path}`).join(path).split(`.${path}`).join(path).split(path).join(dataUri(path, type))
  }
  return text
}

const css = html.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
const js = html.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/)
const styles = inlineAssets(read(css[1]).toString('utf8'))
const script = inlineAssets(read(js[1]).toString('utf8')).replace(/<\/script/gi, '<\\/script')

const title = '<title>TRUEVENTO App</title>'
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(js[0], '')
const headStyle = html.match(/<style>[\s\S]*?<\/style>/)[0]

const page = [
  title,
  '<meta name="theme-color" content="#07060f">',
  inlineAssets(headStyle),
  `<style>${styles}</style>`,
  inlineAssets(body).trim(),
  `<script type="module">${script}</script>`,
].join('\n')
writeFileSync(join(out, 'truevento-demo.html'), page)
console.log(`demo page: dist-demo/truevento-demo.html (${(page.length / 1024 / 1024).toFixed(2)} MB)`)
