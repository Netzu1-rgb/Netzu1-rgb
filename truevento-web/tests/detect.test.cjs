// Run with the website on :8790, truevento-alumnos/public on :8767 and the students app (vite) on :5174.
// Opens the website, /instalar and the students app as each phone and checks what they detect.
const { chromium } = require('playwright')
const cases = require('./detect-cases.cjs')
const WEB = process.env.WEB || 'http://127.0.0.1:8790/'
const INS = process.env.INS || 'http://127.0.0.1:8767/instalar.html'
const APP = process.env.APP || 'http://127.0.0.1:5174/'
const webKind = (t) => /Abre esta página/.test(t) ? 'inapp' : /Escanea/.test(t) ? 'desktop' : /iOS 26/.test(t) ? 'ios26' : /iOS 18/.test(t) ? 'ios18' : /Chrome|Firefox|Edge/.test(t) ? 'chrome' : /Android/.test(t) ? 'android' : '?' + t.slice(0, 40)
const appKind = (t) => !t ? 'desktop' : /otra app/.test(t) ? 'in-app' : /iOS 26/.test(t) ? 'ios26' : /iOS 18/.test(t) ? 'ios18' : /Chrome|Firefox|Edge/.test(t) ? 'ios-chrome' : /iPad/.test(t) ? 'ipad' : /Android/.test(t) ? 'android' : '?' + t
;(async () => {
  const b = await chromium.launch()
  let bad = 0
  const rows = []
  for (const k of cases) {
    const phone = !k.desktop
    const platform = k.ipad ? 'MacIntel' : k.android ? 'Linux armv8l' : k.desktop ? (/Windows/.test(k.ua) ? 'Win32' : 'MacIntel') : 'iPhone'
    const touch = k.desktop ? 0 : 5
    const c = await b.newContext({ userAgent: k.ua, locale: 'es-AR', viewport: phone ? { width: k.ipad ? 820 : 390, height: k.ipad ? 1180 : 844 } : { width: 1366, height: 860 }, hasTouch: phone, isMobile: phone && !k.ipad })
    await c.addInitScript(([platform, touch]) => {
      Object.defineProperty(Navigator.prototype, 'platform', { get: () => platform })
      Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => touch })
    }, [platform, touch])
    const p = await c.newPage(); const errs = []
    p.on('pageerror', (e) => errs.push(e.message))
    // website
    await p.goto(WEB); await p.waitForTimeout(500)
    const web = webKind(await p.locator('[data-tm="device"]').innerText())
    // /instalar
    let ins = null
    if (k.ins) {
      await p.goto(INS); await p.waitForTimeout(500)
      ins = await p.evaluate(() => document.querySelector('.inapp') ? 'inapp' : document.querySelector('[data-v][aria-checked="true"]')?.dataset.v ?? 'none')
    }
    // students app (the guide opens by itself on phones)
    await p.goto(APP); await p.waitForTimeout(2300)
    const coach = p.locator('[aria-labelledby="coach-title"]')
    const app = appKind((await coach.count()) ? await coach.locator('p').first().innerText() : '')
    const ok = web === k.web && ins === k.ins && app === k.app && !errs.length
    if (!ok) bad++
    rows.push(`${ok ? 'OK  ' : 'MAL '} ${k.name.padEnd(40)} web=${web}${web !== k.web ? `(≠${k.web})` : ''}  instalar=${ins}${ins !== k.ins ? `(≠${k.ins})` : ''}  app=${app}${app !== k.app ? `(≠${k.app})` : ''}${errs.length ? '  errores: ' + errs.join(' | ') : ''}`)
    await c.close()
  }
  console.log(rows.join('\n'))
  console.log(`\n${cases.length - bad} de ${cases.length} bien`)
  await b.close()
  process.exit(bad ? 1 : 0)
})()
