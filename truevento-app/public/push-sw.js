// Notifications on the phone (Web Push). Loaded by the app's service worker
// (vite.config.ts → workbox.importScripts), so it works with the app closed.

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { body: event.data ? event.data.text() : '' }
  }
  const title = data.title || 'TRUEVENTO'
  event.waitUntil((async () => {
    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/' },
    })
    // an open app refreshes its counters at once
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    windows.forEach((w) => w.postMessage({ type: 'push', data }))
  })())
})

// tapping the notification opens the right screen (or brings the open app forward)
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of windows) {
      if (new URL(w.url).origin === self.location.origin && 'focus' in w) {
        await w.focus()
        if ('navigate' in w) await w.navigate(target).catch(() => {})
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
