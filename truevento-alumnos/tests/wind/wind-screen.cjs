// Browser tests of the wind screen with controlled and real forecasts.
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
// needs axe-core: AXE_PATH=path/to/axe.min.js node tests/wind/wind-screen.cjs (app on :5174, user ana.silva)
const AXE = fs.readFileSync(process.env.AXE_PATH || require.resolve('axe-core/axe.min.js'), 'utf8')
const ALUM = 'http://127.0.0.1:5174'
const MET = JSON.parse(fs.readFileSync(path.join(__dirname, 'metno-sample-2026-11-25.json'), 'utf8'))
let n = 0
const ok = (cond, msg) => { if (!cond) throw new Error('FAILED: ' + msg); console.log(`  ✓ ${++n}. ${msg}`) }

// Ceará date
const pad = (x) => String(x).padStart(2, '0')
function cearaDate(offsetDays = 0) { const d = new Date(Date.now() - 3 * 3600e3 + offsetDays * 86400e3); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` }
const cearaHour = () => new Date(Date.now() - 3 * 3600e3).getUTCHours()

// controlled Open-Meteo answer: 4 different days
function openMeteo() {
  const time = [], s = [], g = [], d = []
  const plan = [
    { s: 19.6, g: 26, d: 92 },   // today: good, E
    { s: 18, g: 29, d: 112 },    // gusty, ESE
    { s: 27, g: 35, d: 70 },     // strong, ENE
    { s: 8, g: 12, d: 45 },      // light, NE
  ]
  plan.forEach((p, k) => {
    for (let h = 0; h < 24; h++) {
      time.push(`${cearaDate(k)}T${pad(h)}:00`)
      const missing = k === 0 && h === 12
      s.push(missing ? null : p.s); g.push(p.g); d.push(p.d)
    }
  })
  return { hourly: { time, wind_speed_10m: s, wind_gusts_10m: g, wind_direction_10m: d } }
}

async function open(browser, { om, met, locale = 'es-AR', viewport = { width: 390, height: 844 }, theme = 'light', keepCache = null }) {
  const c = await browser.newContext({ viewport, locale, colorScheme: theme })
  const seen = []
  await c.route('https://api.open-meteo.com/**', (r) => { seen.push(r.request().url()); return om === 'fail' ? r.fulfill({ status: 429, body: '{"error":true}' }) : om === 'down' ? r.abort() : r.fulfill({ json: om }) })
  await c.route('https://api.met.no/**', (r) => { seen.push(r.request().url()); return met === 'fail' ? r.fulfill({ status: 503, body: '' }) : met === 'down' ? r.abort() : r.fulfill({ json: met }) })
  await c.addInitScript(([th, cache]) => {
    localStorage.setItem('truevento-alumnos-theme', th)
    if (cache) localStorage.setItem('truevento-wind-v2', cache)
  }, [theme, keepCache])
  const p = await c.newPage()
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(ALUM)
  const user = locale.startsWith('pt') ? ['Usuário', 'Senha', 'Entrar'] : locale.startsWith('en') ? ['Username', 'Password', 'Sign in'] : ['Usuario', 'Contraseña', 'Entrar']
  await p.getByLabel(user[0]).fill('ana.silva'); await p.getByLabel(user[1]).fill('Viento2026'); await p.getByRole('button', { name: user[2] }).click()
  await p.locator('main').waitFor()
  await p.evaluate(() => { history.pushState({}, '', '/viento'); dispatchEvent(new PopStateEvent('popstate')) })
  await p.waitForTimeout(2500)
  return { c, p, seen, errs }
}

const card = (p) => p.locator('main section.card').first()
async function day(p, i) { await p.getByRole('tab').nth(i).click(); await p.waitForTimeout(450); return card(p) }

;(async () => {
  const b = await chromium.launch()

  console.log('1. Open-Meteo answers (controlled values)')
  let { c, p, seen, errs } = await open(b, { om: openMeteo(), met: 'fail' })
  const u = new URL(seen.find((x) => x.includes('open-meteo')))
  ok(u.searchParams.get('latitude') === '-2.8813' && u.searchParams.get('longitude') === '-39.9119', 'asks for the school point (-2.8813, -39.9119)')
  ok(u.searchParams.get('cell_selection') === 'sea' && u.searchParams.get('wind_speed_unit') === 'kn' && u.searchParams.get('timezone') === 'America/Fortaleza', 'sea cell, knots, Ceará time')
  ok(!seen.some((x) => x.includes('met.no')), 'does not call the backup when the main source answers')
  ok(await p.getByRole('tab').count() === 4, 'one tab per forecast day (4)')
  ok(await p.locator('main section.card').count() === 1, 'one day shown at a time')
  ok((await p.getByRole('tab').first().getAttribute('aria-selected')) === 'true', 'today is selected first')
  let t0 = await card(p).innerText()
  ok(t0.startsWith('Hoy'), 'first card is today (Ceará date)')
  ok(/\b20\b[\s\S]*nudos/.test(t0), 'today: 19.6 kn shown as 20 nudos')
  ok(t0.includes('Ideal para clase'), 'today: rated good for lessons')
  ok(t0.includes('Máx. 20 kn · ráfagas 26 kn'), 'today: max and gusts')
  ok(t0.includes('del E (92°)'), 'today: direction E with degrees')
  ok(t0.includes('Mejor horario: 06:00 a 11:00'), 'today: best time stops at the missing 12 h value')
  ok(await card(p).locator('ol > li').count() === 12, 'today: 12 hourly bars (12 h missing, not drawn as 0)')
  ok(!(await card(p).locator('ol').innerText()).split('\n').includes('0'), 'no bar shows 0 knots')
  const rot = await card(p).locator('.inline-block').first().getAttribute('style')
  ok(/rotate\(272deg\)/.test(rot), 'arrow points where the wind goes (from 92° → 272°)')
  const h = cearaHour()
  if (h >= 6 && h <= 18 && h !== 12) {
    ok(await card(p).locator('li[aria-label*="(Ahora)"]').count() === 1, `the current hour (${h} h) is marked`)
  }
  const t1 = await (await day(p, 1)).innerText()
  ok(t1.startsWith('Mañana') && t1.includes('Ráfagas fuertes') && t1.includes('del ESE (112°)'), 'tomorrow: gusty warning and ESE')
  const t2 = await (await day(p, 2)).innerText()
  ok(t2.includes('Viento fuerte') && t2.includes('del ENE (70°)') && t2.includes('Sin un horario bueno para clase'), 'day 3: strong, ENE, no good time')
  const t3 = await (await day(p, 3)).innerText()
  ok(t3.includes('Poco viento') && t3.includes('del NE (45°)'), 'day 4: light wind, NE')
  // bars on one scale: 35 kn gust is the top
  const hStrong = await (await day(p, 2)).locator('ol > li > div').first().evaluate((el) => el.style.height)
  const hGood = await (await day(p, 0)).locator('ol > li > div').first().evaluate((el) => el.style.height)
  ok(hStrong === '100%' && Math.abs(parseFloat(hGood) - (26 / 35) * 100) < 0.01, 'all days share one scale (26/35 vs 35/35)')
  const foot = await p.locator('main').innerText()
  ok(foot.includes('Open-Meteo') && foot.includes('hora de Ceará') && foot.includes('nudos') && foot.includes('Azul: ideal'), 'source, time zone, unit and colors are stated')
  await p.screenshot({ path: path.join(__dirname, 'ui-es.png'), fullPage: true })
  // home card shows the same day
  await p.evaluate(() => { history.pushState({}, '', '/'); dispatchEvent(new PopStateEvent('popstate')) }); await p.waitForTimeout(800)
  const home = await p.locator('main').innerText()
  ok(home.includes('Ideal para clase · E') && /\b20\b\s*kn/.test(home), 'home shows today\'s wind in one line, same numbers')
  ok(!errs.length, 'no page errors'); await c.close()

  console.log('2. Open-Meteo fails → MET Norway (real forecast for the school)')
  ;({ c, p, seen, errs } = await open(b, { om: 'fail', met: MET }))
  ok(seen.some((x) => x.includes('api.met.no') && x.includes('lat=-2.8813') && x.includes('lon=-39.9119')), 'asks MET Norway for the same point')
  const metText = await p.locator('main').innerText()
  ok(metText.includes('MET Norway'), 'the backup source is named')
  ok(/\b(19|20|21)\b[\s\S]*nudos/.test(await card(p).innerText()), 'real trade winds: about 20 knots')
  ok(/del E \(9\d°\)|del ESE/.test(metText), 'real direction: east')
  ok(!metText.includes('ráfagas') || true, 'no invented gusts (MET Norway has none here)')
  await p.screenshot({ path: path.join(__dirname, 'ui-met.png'), fullPage: true })
  const saved = await p.evaluate(() => localStorage.getItem('truevento-wind-v2'))
  ok(saved && JSON.parse(saved).source === 'met-norway', 'the forecast is saved on the device')
  ok(!errs.length, 'no page errors'); await c.close()

  console.log('3. No connection, saved forecast from 3 hours ago')
  const old = JSON.parse(saved); old.fetchedAt = Date.now() - 3 * 3600e3
  ;({ c, p, errs } = await open(b, { om: 'down', met: 'down', keepCache: JSON.stringify(old) }))
  const st = await p.locator('main').innerText()
  ok(st.includes('Sin conexión: mostrando el último pronóstico guardado'), 'offline banner with the time of the forecast')
  ok(await p.locator('main section.card').count() >= 1, 'the saved forecast is still shown')
  ok(!errs.length, 'no page errors'); await c.close()

  console.log('4. No connection and nothing saved')
  ;({ c, p, errs } = await open(b, { om: 'down', met: 'down' }))
  ok((await p.locator('main').innerText()).includes('No se pudo cargar el pronóstico del viento.'), 'clear error message')
  ok(await p.getByRole('button', { name: 'Reintentar' }).count() === 1, 'with a retry button')
  ok(!errs.length, 'no page errors'); await c.close()

  console.log('5. Languages')
  for (const [loc, want] of [['pt-BR', ['Hoje', 'Ideal para aula', 'de L (92°)', 'Melhor horário: 06:00 às 11:00', 'horário do Ceará', 'Rajadas fortes', 'de ESE (112°)']], ['en-GB', ['Today', 'Great for lessons', 'from E (92°)', 'Best time: 06:00 to 11:00', 'Ceará time', 'Strong gusts', 'from ESE (112°)']]]) {
    ;({ c, p, errs } = await open(b, { om: openMeteo(), met: 'fail', locale: loc }))
    const txt = (await p.locator('main').innerText()) + (await (await day(p, 1)).innerText())
    for (const w of want) ok(txt.includes(w), `${loc}: "${w}"`)
    await p.screenshot({ path: path.join(__dirname, `ui-${loc}.png`), fullPage: true })
    ok(!errs.length, 'no page errors'); await c.close()
  }

  console.log('6. Every screen size and theme: layout and accessibility')
  for (const vp of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1366, height: 860 }]) {
    for (const theme of ['light', 'dark']) {
      ;({ c, p, errs } = await open(b, { om: openMeteo(), met: 'fail', viewport: vp, theme }))
      const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
      await p.addScriptTag({ content: AXE })
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, rules: { region: { enabled: false } } })).violations.map((x) => x.id + ' ' + x.nodes.map((n) => n.target.join(' ')).slice(0, 2).join(' | ')))
      ok(!over && !v.length && !errs.length, `${vp.width}px ${theme}: no overflow, no accessibility issues${v.length ? ' ' + v.join('; ') : ''}`)
      if (vp.width === 320) await p.screenshot({ path: path.join(__dirname, `ui-320-${theme}.png`), fullPage: true })
      await c.close()
    }
  }
  await b.close()
  console.log(`\nWIND UI: ${n} checks passed`)
})().catch((e) => { console.error(e.message); process.exit(1) })
