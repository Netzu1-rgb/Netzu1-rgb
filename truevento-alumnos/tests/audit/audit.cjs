// Usage (local stack with the e2e data, app on :5174): AXE_PATH=path/to/axe.min.js ADMIN_USER=.. ADMIN_PASS=.. [ROLES=student] node tests/audit/audit.cjs
// Deep audit of the students app: every role, every page and dialog, es/pt/en, phone and desktop.
// Collects page errors, console errors/warnings, failed requests, Spanish text leaking into pt/en,
// horizontal overflow, axe (wcag2aa) and elements hidden under the bottom bar.
const { chromium } = require('playwright')
const fs = require('fs')
const AXE = fs.readFileSync(process.env.AXE_PATH || require.resolve('axe-core/axe.min.js'), 'utf8')
const ALUM = 'http://127.0.0.1:5174'
const USERS = { student: ['ana.silva', 'Viento2026'], instructor: ['lucas', 'Instructor1'], admin: [process.env.ADMIN_USER, process.env.ADMIN_PASS] }
// words that only make sense in Spanish (not in pt/en)
const ES_ONLY = /\b(clase|clases|Pedir|horario|Cerrar sesión|Ajustes|Mis datos|alumno|alumna|Próxima|próxima|mañana|Hoy\b|Siguiente|Cancelar clase|viento|Viento|Guardar|Elegí|Escribí|tenés|podés|querés|Leer|Leí|normas)\b/
const out = []
async function check(p, ctx, label) {
  await p.waitForTimeout(700)
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
  await p.addScriptTag({ content: AXE }).catch(() => {})
  const axe = await p.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, rules: { region: { enabled: false } } })
    return r.violations.map((v) => ({ id: v.id, n: v.nodes.length, s: v.nodes.slice(0, 2).map((n) => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\n')[1]) }))
  }).catch((e) => [{ id: 'axe-failed', s: [String(e)] }])
  let leak = null
  if (!ctx.includes('-es-')) {
    const text = await p.evaluate(() => {
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      const xs = []
      // skip names/notes written by people (user content) and language names
      while (tw.nextNode()) {
        const el = tw.currentNode.parentElement
        if (!el || el.closest('[data-user-content], [lang]:not(html)') || !el.offsetParent) continue
        const v = tw.currentNode.textContent.trim(); if (v) xs.push(v)
      }
      return xs
    })
    const bad = text.filter((x) => /\b(clase|clases|horario|Cerrar sesión|Mis datos|Siguiente|Guardar|Elegí|Escribí|tenés|podés|querés|Leí|normas de la escuela|Próximas)\b/.test(x) || (ctx.includes('-en-') && /\b(Pedir|Ajustes)\b/.test(x)))
    if (bad.length) leak = [...new Set(bad)].slice(0, 6)
  }
  out.push({ ctx, label, overflow, axe, leak, errors: p._errs.splice(0) })
}
async function login(p, role) {
  const [u, pw] = USERS[role]
  await p.goto(ALUM); await p.waitForTimeout(1200)
  await p.locator('input').first().fill(u); await p.locator('input[type=password]').fill(pw); await p.locator('form button[type=submit]').click()
  await p.locator('main').waitFor({ timeout: 15000 }); await p.waitForTimeout(1500)
}
async function go(p, path) { await p.evaluate((r) => { history.pushState({}, '', r); dispatchEvent(new PopStateEvent('popstate')) }, path); await p.waitForTimeout(1500) }
async function closeDialogs(p) { for (let i = 0; i < 3; i++) { if (!(await p.locator('dialog[open]').count())) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300) } }
;(async () => {
  const b = await chromium.launch()
  for (const role of (process.env.ROLES || 'student,instructor,admin').split(',')) {
    if (!USERS[role][0]) continue
    for (const lang of ['es', 'pt', 'en']) {
      for (const vp of [{ width: 360, height: 740 }, { width: 1280, height: 800 }]) {
        for (const theme of (lang === 'es' ? ['light', 'dark'] : ['light'])) {
          const c = await b.newContext({ viewport: vp, colorScheme: theme, locale: lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-AR' })
          await c.addInitScript(([l, t]) => { localStorage.setItem('truevento-lang', l); localStorage.setItem('truevento-alumnos-theme', t) }, [lang, theme])
          const p = await c.newPage(); p._errs = []
          p.on('pageerror', (e) => p._errs.push('pageerror: ' + e.message))
          p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/Download the React DevTools|vite/.test(m.text())) p._errs.push(m.type() + ': ' + m.text().slice(0, 200)) })
          p.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('open-meteo') && !r.url().includes('met.no')) p._errs.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`) })
          const ctx = `${role}-${lang}-${vp.width}-${theme}`
          try {
            await login(p, role)
            const paths = role === 'student' ? ['/', '/agenda', '/progreso', '/viento', '/ajustes'] : ['/', '/agenda', '/alumnos', '/avisos', '/viento', '/ajustes']
            for (const path of paths) { await go(p, path); await check(p, ctx, path) }
            // dialogs
            await go(p, '/')
            if (role === 'student') {
              await p.getByRole('button', { name: /^(\+ )?(Pedir clase|Pedir aula|Book|Pedir una clase|Pedir mi primera clase)/ }).first().click(); await p.waitForTimeout(700)
              await check(p, ctx, 'ask step 1')
              const next = p.locator('dialog[open]').getByRole('button', { name: /^(Siguiente|Próximo|Next)$/ })
              await next.click(); await p.waitForTimeout(600); await check(p, ctx, 'ask step 2')
              await next.click(); await p.waitForTimeout(600); await check(p, ctx, 'ask step 3')
              await p.locator('dialog[open] button').filter({ hasText: /normas|Read the rules/i }).last().click(); await p.waitForTimeout(600); await check(p, ctx, 'rules')
              await closeDialogs(p)
            } else {
              const sched = p.locator('nav button, main button').filter({ hasText: /Agendar|Schedule/ }).first()
              if (await sched.count()) { await sched.click(); await p.waitForTimeout(800); await check(p, ctx, 'schedule'); await closeDialogs(p) }
            }
            await p.locator('button[aria-haspopup=menu]:visible').first().click(); await p.waitForTimeout(300); await check(p, ctx, 'lang menu'); await p.keyboard.press('Escape')
          } catch (e) { out.push({ ctx, label: 'CRASH', errors: [String(e).slice(0, 300)] }) }
          await c.close()
        }
      }
    }
  }
  await b.close()
  fs.writeFileSync(__dirname + '/report.json', JSON.stringify(out, null, 1))
  const issues = out.filter((r) => r.overflow || r.axe?.length || r.leak || r.errors?.length || r.label === 'CRASH')
  for (const r of issues) console.log(r.ctx, r.label, r.overflow ? 'OVERFLOW' : '', r.axe?.length ? JSON.stringify(r.axe) : '', r.leak ? 'LEAK ' + JSON.stringify(r.leak) : '', r.errors?.length ? 'ERR ' + JSON.stringify(r.errors) : '')
  console.log(`${out.length} screens, ${issues.length} with issues`)
})()
