// Service worker check in a real browser: a push message shows the notification with
// the right text, icons and target, and an open window hears about it.
// Usage: node tests/push/sw.cjs http://127.0.0.1:4173
const { chromium } = require('playwright')
const url = process.argv[2]
;(async () => {
  const browser = await chromium.launch({ channel: 'chromium' })
  const ctx = await browser.newContext()
  await ctx.grantPermissions(['notifications'], { origin: new URL(url).origin })
  const page = await ctx.newPage()
  await page.goto(url)
  const cdp = await ctx.newCDPSession(page)
  await cdp.send('ServiceWorker.enable')
  let regId
  cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => { for (const r of e.registrations) if (!r.isDeleted) regId = r.registrationId })
  await page.evaluate(() => navigator.serviceWorker.ready)
  for (let i = 0; i < 20 && !regId; i++) await page.waitForTimeout(250)
  await page.evaluate(() => { window.__push = []; navigator.serviceWorker.addEventListener('message', (e) => window.__push.push(e.data)) })
  const payload = { title: 'Nueva solicitud de clase', body: 'Ana pidió el 28/11 a las 10:00', url: '/solicitudes', tag: 'request-1', app: 'gestion' }
  await cdp.send('ServiceWorker.deliverPushMessage', { origin: new URL(url).origin, registrationId: regId, data: JSON.stringify(payload) })
  await page.waitForTimeout(1500)
  const shown = await page.evaluate(async () => (await (await navigator.serviceWorker.ready).getNotifications())
    .map((n) => ({ title: n.title, body: n.body, icon: n.icon, badge: n.badge, tag: n.tag, data: n.data })))
  const heard = await page.evaluate(() => window.__push)
  const ok = shown.length === 1 && shown[0].title === payload.title && shown[0].body === payload.body &&
    shown[0].icon.endsWith('/icons/icon-192.png') && shown[0].badge.endsWith('/icons/badge-96.png') &&
    shown[0].tag === 'request-1' && shown[0].data.url === '/solicitudes' && heard.length === 1 && heard[0].type === 'push'
  // the files the notification needs are served
  for (const f of ['/icons/icon-192.png', '/icons/badge-96.png', '/push-sw.js']) {
    const r = await page.request.get(new URL(f, url).href)
    if (!r.ok()) { console.log('missing', f); process.exitCode = 1 }
  }
  console.log(JSON.stringify({ shown, heard }))
  console.log(ok ? 'SW PUSH OK' : 'SW PUSH FAIL')
  if (!ok) process.exitCode = 1
  await browser.close()
})()
