// Renders the PWA icons from public/icons/*.svg (run: npm run icons).
// Needs Playwright with Chromium (npx playwright install chromium, or NODE_PATH to a global install).
const { chromium } = require('playwright')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')

const dir = join(__dirname, '..', 'public', 'icons')
const jobs = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
  ['icon.svg', 'favicon-64.png', 64],
]
;(async () => {
const browser = await chromium.launch()
const page = await browser.newPage()
for (const [src, out, size] of jobs) {
  const svg = readFileSync(join(dir, src), 'utf8')
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: join(dir, out), omitBackground: true })
}
await browser.close()
console.log('icons ready')
})()
