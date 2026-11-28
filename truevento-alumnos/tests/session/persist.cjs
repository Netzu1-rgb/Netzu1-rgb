// The account stays signed in: reopening the app (even days later, with an expired
// access token, or offline) goes straight in. Usage: node tests/session/persist.cjs [url]
// (default http://127.0.0.1:5174 with the e2e user ana.silva)
const { chromium } = require('playwright')
const BASE = process.argv[2] || 'http://127.0.0.1:5174'
const real = BASE.startsWith('http://127')
;(async () => {
  const b = await chromium.launch(); const out = []
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-AR' })
  let p = await ctx.newPage()
  await p.goto(BASE); await p.waitForTimeout(2000)
  if (real) { await p.getByLabel('Usuario').fill('ana.silva'); await p.getByLabel('Contraseña').fill('Viento2026'); await p.getByRole('button', { name: 'Entrar', exact: true }).click() }
  else { await p.getByRole('tab', { name: 'Crear cuenta' }).click(); await p.getByLabel('Nombre y apellido').fill('Ana Prueba'); await p.getByLabel('WhatsApp').fill('+55 88 99999-1234')
    await p.getByRole('button', { name: 'Nunca' }).first().click().catch(() => {}); await p.getByText(/Nunca hice|Nunca/).first().click().catch(() => {})
    await p.getByLabel('Elige un usuario').fill('ana.prueba'); await p.getByLabel('Elige una contraseña').fill('Viento2026'); await p.locator('input[type=checkbox]').check(); await p.getByRole('button', { name: 'Crear mi cuenta' }).click() }
  await p.locator('main').waitFor({ timeout: 15000 }); await p.waitForTimeout(1500)
  out.push(['logged in', await p.getByText('¡Hola,').count() > 0])
  // close the app and open it again
  await p.close(); p = await ctx.newPage(); await p.goto(BASE); await p.waitForTimeout(3500)
  out.push(['reopened: straight in, no login', await p.locator('main').count() === 1 && await p.getByLabel('Contraseña').count() === 0])
  if (real) {
    // days later: the access token has expired; it must renew by itself
    await p.evaluate(() => { const k = 'truevento-alumnos-auth'; const s = JSON.parse(localStorage.getItem(k)); s.expires_at = Math.floor(Date.now() / 1000) - 3600; s.access_token = s.access_token.slice(0, -4) + 'xxxx'; localStorage.setItem(k, JSON.stringify(s)) })
    await p.close(); p = await ctx.newPage(); await p.goto(BASE); await p.waitForTimeout(5000)
    out.push(['expired token renewed, still in', await p.locator('main').count() === 1 && await p.getByLabel('Contraseña').count() === 0 && await p.getByText('¡Hola,').count() > 0])
    // offline start keeps the account too
    await ctx.setOffline(true); await p.reload().catch(() => {}); await p.waitForTimeout(3000)
    out.push(['offline start: still in', await p.getByLabel('Contraseña').count() === 0])
    await ctx.setOffline(false)
  }
  console.log(out.map(([n, v]) => (v ? 'OK   ' : 'FAIL ') + n).join('\n'))
  console.log(out.every(([, v]) => v) ? 'PERSIST OK' : 'PERSIST FAIL')
  await b.close()
})().catch((e) => { console.error(e.message); process.exit(1) })
