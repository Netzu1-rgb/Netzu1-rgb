// WhatsApp buttons never show a long link: iPhone and Android open the WhatsApp app,
// a computer opens WhatsApp Web on the chat. Needs the local
// stack with the e2e data (ana.silva). Usage: node tests/whatsapp/open.cjs
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
  await b.close()
  console.log(res.map(([n, c, x]) => (c ? 'OK   ' : 'FAIL ') + n + (c ? '' : ' → ' + x)).join('\n'))
  console.log(res.every((r) => r[1]) ? 'WAOPEN OK' : 'WAOPEN FAIL')
})().catch((e) => { console.error(e); process.exit(1) })
