// Full check of the website: run from truevento-web with `node tests/site.test.cjs`.
// It serves the folder itself and uses the Playwright that is installed on the machine.
// Exit code 1 if anything fails; screenshots of each size go to tests/out/.
const http = require('http')
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const { chromium, devices } = require('playwright')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(__dirname, 'out')
const LANGS = ['es', 'pt', 'en']
const fails = []
let passed = 0
const check = (ok, what) => { if (ok) passed++; else { fails.push(what); console.log('  ✗', what) } }

// ---------- static server ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' }
function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'))
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end() }
    const size = fs.statSync(file).size
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream'
    const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range || '')
    if (range) { // video needs ranges
      const start = +range[1], end = range[2] ? +range[2] : size - 1
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 })
      return fs.createReadStream(file, { start, end }).pipe(res)
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((ok) => server.listen(0, () => ok(server)))
}

// ---------- 1. files and texts, without a browser ----------
function staticChecks() {
  console.log('Archivos y textos')
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8')
  const mainJs = fs.readFileSync(path.join(ROOT, 'js/main.js'), 'utf8')

  // the translations object, read without running the page
  const src = mainJs.slice(mainJs.indexOf('const translations'), mainJs.indexOf('};', mainJs.indexOf('const translations')) + 2)
  const translations = vm.runInNewContext(src + '; translations')
  const keys = [...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1])
  for (const lang of LANGS) {
    const missing = [...new Set(keys)].filter((k) => !translations[lang][k])
    check(!missing.length, `texto sin traducir en ${lang}: ${missing.join(', ')}`)
  }
  const unused = Object.keys(translations.es).filter((k) => !keys.includes(k))
  check(!unused.length, `textos que la página ya no usa: ${unused.join(', ')}`)
  const sameKeys = LANGS.every((l) => Object.keys(translations[l]).sort().join() === Object.keys(translations.es).sort().join())
  check(sameKeys, 'los 3 idiomas tienen los mismos textos')

  // every local file the page points to exists
  const refs = [...html.matchAll(/(?:src|href|poster)="([^"#:]+?)"/g), ...fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8').matchAll(/url\(["']?\.\.\/([^"')]+)/g)]
    .map((m) => m[1]).filter((r) => !r.startsWith('http') && !r.startsWith('mailto') && !r.startsWith('tel'))
  for (const r of new Set(refs)) check(fs.existsSync(path.join(ROOT, r.replace(/^\.\.\//, ''))), `archivo que falta: ${r}`)
  for (const f of ['tut-es.jpg', 'tut-pt.jpg', 'tut-en.jpg', 'app-icon.png']) check(fs.existsSync(path.join(ROOT, 'assets', f)), `falta assets/${f} (guía)`)

  // anchors, ids, external links
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  check(ids.length === new Set(ids).size, `ids repetidos: ${ids.filter((x, i) => ids.indexOf(x) !== i).join(', ')}`)
  for (const a of new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))) check(ids.includes(a), `el enlace #${a} no lleva a ninguna sección`)
  const blank = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((m) => m[0])
  check(blank.every((a) => /rel="[^"]*noopener/.test(a)), 'todos los enlaces que abren otra pestaña llevan rel="noopener"')
  check(!/<form\b/.test(html), 'no quedó ningún formulario de reserva')

  // functions called from the page exist; no leftovers of the old booking form
  for (const fn of new Set([...html.matchAll(/onclick="(\w+)\(/g)].map((m) => m[1]))) check(new RegExp(`function ${fn}\\b`).test(mainJs) || fn === 'setLanguage', `onclick llama a ${fn}() que no existe`)
  check(!/submitContactForm|course-dropdown|course-select/.test(mainJs), 'main.js sin código del formulario que ya no existe')

  // weight
  const kb = (f) => fs.statSync(path.join(ROOT, f)).size / 1024
  const imgs = fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => /\.(jpe?g|png)$/i.test(f))
  for (const f of imgs) check(kb('assets/' + f) < 450, `imagen pesada: ${f} (${Math.round(kb('assets/' + f))} KB)`)
  check(kb('assets/video-hevc.mp4') < 15000 && kb('assets/video-h264.mp4') < 20000, 'videos de portada livianos')
}

// ---------- 2. in the browser ----------
const SIZES = [
  ['celular-chico', { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }],
  ['iphone', devices['iPhone 14']],
  ['android', devices['Pixel 7']],
  ['tablet', { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true }],
  ['computadora', { viewport: { width: 1366, height: 860 } }],
  ['pantalla-grande', { viewport: { width: 1920, height: 1080 } }],
]

async function openPage(browser, opts, base, init) {
  const ctx = await browser.newContext({ ...opts, locale: 'es-AR' })
  if (init) await ctx.addInitScript(init)
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('error: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('consola: ' + m.text()) })
  page.on('response', (r) => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url().slice(base.length)}`) })
  await page.goto(base + '/', { waitUntil: 'load' })
  await page.waitForTimeout(600)
  return { ctx, page, errors }
}

// scroll the whole page slowly so lazy images and reveals load
async function scrollAll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
}

async function sizeChecks(browser, base) {
  for (const [name, opts] of SIZES) {
    console.log('Pantalla:', name)
    const { ctx, page, errors } = await openPage(browser, opts, base)
    const mobile = (opts.viewport?.width ?? 1000) < 1024
    await page.waitForTimeout(900)
    const video = await page.evaluate(() => { const v = document.querySelector("video"); return { ready: v.readyState, src: v.currentSrc.split("/").pop(), playing: !v.paused && v.currentTime > 0 } })
    check(video.ready >= 2 && video.playing, `${name}: el video de portada no arranca (${JSON.stringify(video)})`)
    await scrollAll(page)

    const wide = await page.evaluate(() => {
      const w = document.documentElement.clientWidth
      return [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
        if (!r.width || cs.position === 'fixed' || e.closest('#about-carousel, .overflow-hidden, [aria-hidden=true]')) return false
        return r.right > w + 1 || r.left < -1
      }).slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + [...e.classList].slice(0, 2).join('.'))
    })
    check(!(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)), `${name}: la página se corre de costado`)
    check(!wide.length, `${name}: elementos que se salen de la pantalla: ${wide.join(', ')}`)

    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.getAttribute('src')))
    check(!broken.length, `${name}: imágenes rotas: ${broken.join(', ')}`)


    // small text and tap targets
    const tiny = await page.evaluate(() => [...document.querySelectorAll('p, a, button, li, span')].filter((e) => {
      const r = e.getBoundingClientRect(); return r.width && e.textContent.trim() && e.children.length === 0 && parseFloat(getComputedStyle(e).fontSize) < 11 && !e.closest('[aria-hidden=true], .tm-stage, #app [aria-hidden], a[href="#"], footer .flex-col')
    }).slice(0, 3).map((e) => e.textContent.trim().slice(0, 30)))
    check(!tiny.length, `${name}: texto demasiado chico: ${tiny.join(' | ')}`)
    if (mobile) {
      const small = await page.evaluate(() => [...document.querySelectorAll('a, button')].filter((e) => {
        const r = e.getBoundingClientRect(); return r.width && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.pointer-events-none, footer p') && (r.height < 28 || r.width < 28) && !e.closest('[data-tm=steps], .tm-stage, p')
      }).slice(0, 4).map((e) => (e.getAttribute('aria-label') || e.textContent.trim() || e.className).slice(0, 30)))
      check(!small.length, `${name}: botones difíciles de tocar: ${small.join(' | ')}`)
    }

    // navigation
    if (mobile) {
      await page.click('#menu-btn'); await page.waitForTimeout(400)
      check(await page.evaluate(() => !document.getElementById('mobile-menu').classList.contains('pointer-events-none')), `${name}: el menú no abre`)
      await page.click('#mobile-menu a[href="#instalar"], #mobile-menu a[href="#app"]'); await page.waitForTimeout(1200)
      check(await page.evaluate(() => document.getElementById('mobile-menu').classList.contains('pointer-events-none') && getComputedStyle(document.body).overflow !== 'hidden'), `${name}: el menú no cierra al elegir una sección`)
    } else {
      await page.click('nav a[href="#app"]'); await page.waitForTimeout(1200)
    }
    const appTop = await page.$eval('#app', (e) => Math.round(e.getBoundingClientRect().top))
    check(appTop >= 0 && appTop < 140, `${name}: "App" del menú no lleva a la sección (top ${appTop})`)
    const navCovers = await page.evaluate(() => { const h = document.querySelector('#app h2').getBoundingClientRect().top; return h < document.getElementById('navbar').getBoundingClientRect().bottom })
    check(!navCovers, `${name}: el menú tapa el título de la sección`)

    // the two buttons go to the guide with that phone
    for (const os of ['ios', 'android']) {
      await page.$eval('#app', (e) => e.scrollIntoView())
      await page.click(`#app [data-tm-os="${os}"]`); await page.waitForTimeout(1300)
      const st = await page.evaluate(() => ({ top: Math.round(document.getElementById('instalar').getBoundingClientRect().top), sel: document.querySelector('#instalar [role=tab][aria-selected=true]').dataset.tmOs }))
      check(st.sel === os && st.top >= 0 && st.top < 140, `${name}: el botón ${os} no lleva a la guía (${JSON.stringify(st)})`)
    }

    // the guide: each step, when it is the one being read, shows its phone screen
    const total = await page.$$eval('#instalar .tm-step', (s) => s.length)
    const shown = []
    for (let i = 0; i < total; i++) {
      await page.evaluate(({ i, mobile }) => { const c = document.querySelectorAll('#instalar .tm-card')[i].getBoundingClientRect(); const w = document.querySelector('#instalar .tm-stage-wrap').getBoundingClientRect(); scrollBy(0, c.top + c.height / 2 - (mobile ? (w.bottom + innerHeight) / 2 : innerHeight / 2)) }, { i, mobile: (opts.viewport?.width ?? 1000) < 768 })
      await page.waitForTimeout(500)
      const st = await page.evaluate((i) => {
        const card = document.querySelectorAll('#instalar .tm-card')[i].getBoundingClientRect()
        const stage = document.querySelector('#instalar .tm-stage-wrap').getBoundingClientRect()
        const active = document.querySelector('#instalar .tm-step.is-active')
        return { active: active && +active.dataset.i, covered: card.top < stage.bottom - 4 && card.bottom > stage.top && Math.abs(card.left - stage.left) < 40, inView: card.top >= 0 && card.bottom <= innerHeight + 2 }
      }, i)
      shown.push(st.active)
      check(st.active === i, `${name}: al leer el paso ${i + 1} el teléfono muestra el paso ${st.active + 1}`)
      check(!st.covered, `${name}: el teléfono tapa el texto del paso ${i + 1}`)
      if (i === 1) await page.screenshot({ path: path.join(OUT, `${name}-guia.png`) })
    }

    check(!errors.length, `${name}: errores: ${errors.slice(0, 4).join(' | ')}`)
    await page.screenshot({ path: path.join(OUT, `${name}.png`) })
    await ctx.close()
  }
}

async function behaviourChecks(browser, base) {
  console.log('Funciones')
  const iphone = devices['iPhone 14']

  // language: buttons, texts of the guide, kept after reloading
  {
    const { ctx, page, errors } = await openPage(browser, iphone, base)
    for (const lang of LANGS) {
      await page.evaluate((l) => setLanguage(l), lang); await page.waitForTimeout(200)
      const st = await page.evaluate(() => ({ html: document.documentElement.lang, title: document.querySelector('[data-i18n=app_title]').textContent, guide: document.querySelector('#instalar [data-tm=title]').textContent, step: document.querySelector('#instalar .tm-card h3').textContent }))
      check(st.html === lang, `idioma ${lang}: <html lang> no cambia`)
      check(st.guide && st.step, `idioma ${lang}: la guía queda vacía`)
      if (lang !== 'es') check(st.title !== 'Tu escuela en el celular', `idioma ${lang}: el título sigue en español`)
    }
    await page.reload(); await page.waitForTimeout(500)
    check(await page.evaluate(() => document.documentElement.lang) === 'en', 'el idioma elegido no se recuerda al volver')
    const untranslated = await page.evaluate(() => [...document.querySelectorAll('[data-i18n]')].filter((e) => /\b(Reservá|Pedí|Tené|Instalá|Ubicación)\b/.test(e.textContent)).map((e) => e.dataset.i18n))
    check(!untranslated.length, `en inglés quedan textos en español: ${untranslated.join(', ')}`)
    check(!errors.length, `idiomas: errores: ${errors.join(' | ')}`)
    await ctx.close()
  }

  // cookies: the banner shows once, and stays closed
  {
    const { ctx, page } = await openPage(browser, iphone, base)
    await page.waitForTimeout(1300)
    const visible = async () => page.evaluate(() => { const b = document.getElementById('cookieBanner'); const r = b.getBoundingClientRect(); return getComputedStyle(b).display !== 'none' && r.top < innerHeight - 10 })
    check(await visible(), 'el aviso de cookies no aparece la primera vez')
    await page.click('#cookieBanner button:has-text("Aceptar")'); await page.waitForTimeout(700)
    check(!(await visible()), 'el aviso de cookies no se cierra')
    await page.reload(); await page.waitForTimeout(1500)
    check(!(await visible()), 'el aviso de cookies vuelve a aparecer después de aceptar')
    await ctx.close()
  }

  // privacy and terms windows
  {
    const { ctx, page } = await openPage(browser, { viewport: { width: 1366, height: 860 } }, base)
    for (const id of ['privacyModal', 'termsModal']) {
      await page.evaluate((id) => openModal(id), id); await page.waitForTimeout(400)
      check(await page.$eval('#' + id, (m) => !m.classList.contains('hidden')), `${id} no abre`)
      await page.keyboard.press('Escape'); await page.waitForTimeout(450)
      check(await page.$eval('#' + id, (m) => m.classList.contains('hidden')), `${id} no se cierra con Escape`)
      check(await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden'), `${id}: la página queda trabada después de cerrar`)
    }
    await ctx.close()
  }

  // photo carousel
  {
    const { ctx, page } = await openPage(browser, iphone, base)
    const pos = () => page.$eval('#about-carousel', (c) => c.style.transform || 'translateX(-0%)')
    await page.$eval('#about', (e) => e.scrollIntoView())
    const total = await page.$$eval('#about-carousel > *', (s) => s.length)
    const dots = await page.$$eval('.carousel-dot', (s) => s.length)
    check(total === dots, `carrusel: ${total} fotos y ${dots} puntos`)
    await page.click('[onclick="prevSlide()"]'); await page.waitForTimeout(300)
    check((await pos()).includes(`-${(total - 1) * 100}%`), 'carrusel: "anterior" desde la primera no va a la última')
    await page.click('[onclick="nextSlide()"]'); await page.waitForTimeout(300)
    check(/translateX\(-?0%\)/.test(await pos()), 'carrusel: "siguiente" desde la última no vuelve a la primera')
    await page.click('.carousel-dot >> nth=3'); await page.waitForTimeout(300)
    check((await pos()).includes('-300%'), 'carrusel: los puntos no cambian de foto')
    // swipe on a phone
    const box = await page.$eval('#about-carousel', (c) => { const r = c.parentElement.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width } })
    await page.evaluate(({ x, y, w }) => {
      const el = document.elementFromPoint(x, y)
      const t = (cx) => [new Touch({ identifier: 1, target: el, clientX: cx, clientY: y })]
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: t(x + w / 3), changedTouches: t(x + w / 3) }))
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: t(x - w / 3) }))
    }, box)
    await page.waitForTimeout(300)
    check((await pos()).includes('-400%'), 'carrusel: no se puede deslizar con el dedo')
    await ctx.close()
  }

  // links that leave the page
  {
    const { ctx, page } = await openPage(browser, iphone, base)
    const links = await page.$$eval('a[href^="http"]', (as) => as.map((a) => a.href))
    check(links.some((l) => l.startsWith('https://app.truevento.com')), 'falta el enlace a la app')
    check(links.filter((l) => l.includes('wa.me')).every((l) => /^https:\/\/wa\.me\/\d{10,15}$/.test(l.split('?')[0])), 'enlace de WhatsApp mal armado')
    check(links.every((l) => l.startsWith('https://')), `enlaces sin https: ${links.filter((l) => !l.startsWith('https://')).join(', ')}`)
    await ctx.close()
  }

  // a browser that blocks storage (Safari private mode, blocked cookies) still shows the page
  {
    const { ctx, page, errors } = await openPage(browser, iphone, base, () => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError') } })
    })
    await page.evaluate(() => setLanguage('pt')); await page.waitForTimeout(200)
    check(await page.evaluate(() => document.documentElement.lang) === 'pt', 'con el almacenamiento bloqueado no cambia el idioma')
    check(await page.$eval('#instalar .tm-card h3', (e) => !!e.textContent), 'con el almacenamiento bloqueado la guía no carga')
    check(!errors.length, `con el almacenamiento bloqueado: ${errors.slice(0, 2).join(' | ')}`)
    await ctx.close()
  }

  // without motion (accessibility setting): the guide still works
  {
    const { ctx, page, errors } = await openPage(browser, { ...iphone, reducedMotion: 'reduce' }, base)
    await page.click('#app [data-tm-os="ios"]'); await page.waitForTimeout(600)
    check(await page.$eval('#instalar', (e) => Math.abs(e.getBoundingClientRect().top) < 140), 'con movimiento reducido el botón no lleva a la guía')
    check(!errors.length, `movimiento reducido: ${errors.join(' | ')}`)
    await ctx.close()
  }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  staticChecks()
  const server = await serve()
  const base = `http://localhost:${server.address().port}`
  const browser = await chromium.launch()
  try {
    await sizeChecks(browser, base)
    await behaviourChecks(browser, base)
  } finally {
    await browser.close(); server.close()
  }
  console.log(`\n${passed} controles bien, ${fails.length} con problemas`)
  if (fails.length) { console.log(fails.map((f) => ' - ' + f).join('\n')); process.exit(1) }
})()
