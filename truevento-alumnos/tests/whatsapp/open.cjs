// WhatsApp buttons never show a long link: iPhone and Android open the WhatsApp app,
// a computer opens WhatsApp Web on the chat, the demo shows a preview. Needs the local
// stack with the e2e data (ana.silva) and the demo build. Usage: node tests/whatsapp/open.cjs
const { chromium, devices } = require('playwright')
const { execFileSync } = require('child_process')
const sql = (q) => execFileSync('psql', ['-h', '127.0.0.1', '-p', '54322', '-U', 'postgres', '-d', 'postgres', '-XtAc', q], { env: { PGPASSWORD: 'postgres', PATH: process.env.PATH }, encoding: 'utf8' }).trim()
const res = []
const check = (n, c, x = '') => res.push([n, c, x])
async function studentPending(ctx, base) {
  const p = await ctx.newPage()
  await p.goto(base); await p.waitForTimeout(2000)
  if (await p.getByLabel('Contraseña').count()) {
    await p.getByLabel('Usuario').fill('ana.silva'); await p.getByLabel('Contraseña').fill('Viento2026'); await p.getByRole('button', { name: 'Entrar', exact: true }).click()
  }
  await p.locator('main').waitFor(); await p.waitForTimeout(1200)
  await p.goto(base + '/agenda'); await p.waitForTimeout(2000)
  return p
}
;(async () => {
  sql(`update public.lessons set status='cancelled' where status='requested';
       insert into public.lessons (student_id, lesson_date, hours, status) select id, current_date + 6, 1.5, 'requested' from public.students where full_name='Ana Silva'`)
  const b = await chromium.launch()
  for (const [name, dev] of [['iPhone', devices['iPhone 14']], ['iPhone sin WhatsApp', devices['iPhone 14']], ['Android', devices['Pixel 7']], ['Computadora', { viewport: { width: 1280, height: 800 } }]]) {
    const ctx = await b.newContext({ ...dev, locale: 'es-AR' })
    await ctx.route('https://web.whatsapp.com/**', (r) => r.fulfill({ body: '<title>WhatsApp Web</title>', contentType: 'text/html' }))
    await ctx.route('https://wa.me/**', (r) => r.fulfill({ body: 'wa.me', contentType: 'text/html' }))
    const p = await studentPending(ctx, 'http://127.0.0.1:5174')
    const waReq = []; ctx.on('request', (r) => { if (/wa\.me|api\.whatsapp/.test(r.url())) waReq.push(r.url()) })
    const popups = []; ctx.on('page', (pg) => popups.push(pg))
    const btn = p.getByRole('link', { name: 'Coordinar horario y precio por WhatsApp' }).first()
    await btn.click()
    // a real phone with WhatsApp leaves the page (or asks "Open in WhatsApp?"): the page loses focus
    if (name === 'iPhone') await p.evaluate(() => window.dispatchEvent(new Event('blur')))
    await p.waitForTimeout(3200)
    const urls = await Promise.all(popups.map(async (pg) => { await pg.waitForLoadState().catch(() => {}); return pg.url() }))
    if (name === 'iPhone sin WhatsApp') {
      check(`${name}: falls back to the regular WhatsApp page`, urls.length === 1 && urls[0].startsWith('https://wa.me/5492215451174'), urls.join(' '))
    } else if (name === 'Computadora') {
      check(`${name}: opens WhatsApp Web on the chat`, urls.length === 1 && urls[0].startsWith('https://web.whatsapp.com/send?phone=5492215451174&text='), urls.join(' '))
    } else {
      check(`${name}: opens the app, no web page, no link`, popups.length === 0 && waReq.length === 0 && p.url().startsWith('http://127.0.0.1:5174'), JSON.stringify({ urls, waReq, at: p.url() }))
    }
    await ctx.close()
  }
  // the demo: a preview of the message, nothing leaves the page
  const ctx = await b.newContext({ ...devices['iPhone 14'], locale: 'es-AR' })
  const p = await ctx.newPage(); const popups = []; ctx.on('page', (pg) => popups.push(pg))
  await p.goto('file:///home/user/Netzu1-rgb/truevento-alumnos/dist-demo/truevento-alumnos-demo.html'); await p.waitForTimeout(2000)
  await p.getByRole('tab', { name: 'Crear cuenta' }).click()
  await p.getByLabel('Nombre y apellido').fill('Ana Demo'); await p.getByLabel('WhatsApp').fill('+55 88 99999-1234')
  await p.getByRole('button', { name: /Nunca/ }).first().click().catch(() => {})
  await p.getByLabel('Elegí un usuario').fill('ana.demo'); await p.getByLabel('Elegí una contraseña').fill('Viento2026'); await p.locator('input[type=checkbox]').check()
  await p.getByRole('button', { name: 'Crear mi cuenta' }).click(); await p.locator('main').waitFor(); await p.waitForTimeout(1500)
  await p.getByRole('button', { name: 'Pedir clase' }).first().click(); await p.waitForTimeout(700)
  const d = p.locator('dialog')
  await d.getByRole('button', { name: 'Siguiente', exact: true }).click(); await p.waitForTimeout(600)
  await d.getByRole('button', { name: 'Siguiente', exact: true }).click(); await p.waitForTimeout(600)
  await d.getByRole('button', { name: 'Enviar pedido' }).click(); await p.waitForTimeout(1500)
  await d.getByRole('link', { name: 'Escribirnos por WhatsApp' }).click(); await p.waitForTimeout(800)
  const prev = p.locator('dialog').filter({ hasText: 'Vista previa de WhatsApp' })
  check('demo: shows the message preview, no link', await prev.count() === 1 && popups.length === 0 && await prev.getByText('Hola, soy Ana Demo. Pedí una clase en la app').count() === 1)
  await p.screenshot({ path: __dirname + '/wa-preview.png' })
  await b.close()
  console.log(res.map(([n, c, x]) => (c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' → ' + x)).join('\n'))
  console.log(res.every((r) => r[1]) ? 'WAOPEN OK' : 'WAOPEN FAIL')
})().catch((e) => { console.error(e); process.exit(1) })
