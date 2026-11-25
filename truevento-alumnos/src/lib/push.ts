// Notifications on this device (Web Push): turn them on or off and keep the
// server's list of devices in sync. The phone shows them through public/push-sw.js.
import { supabase } from './supabase'
import { isIOS, isStandalone } from './pwa'

const KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState = 'on' | 'off' | 'denied' | 'install-ios' | 'unsupported'
export type PushApp = 'gestion' | 'alumnos'

function supported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4)
  const raw = atob((base64url + pad).replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function registration(): Promise<ServiceWorkerRegistration | null> {
  if (!supported()) return null
  const ready = navigator.serviceWorker.ready
  const late = new Promise<null>((r) => setTimeout(() => r(null), 8000))
  return (await Promise.race([ready, late])) as ServiceWorkerRegistration | null
}

export async function getPushState(): Promise<PushState> {
  if (import.meta.env.VITE_DEMO === '1' || !KEY) return 'unsupported'
  // on iPhone, notifications only work in the app added to the home screen
  if (isIOS() && !isStandalone()) return 'install-ios'
  if (!supported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

async function save(sub: PushSubscription, app: PushApp, lang: string) {
  const j = sub.toJSON()
  const { error } = await supabase.rpc('save_push_subscription', {
    p_app: app, p_endpoint: j.endpoint, p_p256dh: j.keys?.p256dh, p_auth: j.keys?.auth, p_lang: lang,
  })
  if (error) throw error
}

/** Asks for permission (must run from a tap) and registers this device. */
export async function enablePush(app: PushApp, lang = 'es'): Promise<PushState> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const reg = await registration()
  if (!reg || !KEY) return 'unsupported'
  const sub = (await reg.pushManager.getSubscription())
    ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY) })
  await save(sub, app, lang)
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const reg = await registration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await supabase.rpc('delete_push_subscription', { p_endpoint: sub.endpoint })
    await sub.unsubscribe()
  }
  return 'off'
}

/** Keeps the device linked to the signed-in account and its language. */
export async function resyncPush(app: PushApp, lang = 'es') {
  try {
    if ((await getPushState()) !== 'on') return
    const reg = await registration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) await save(sub, app, lang)
  } catch { /* next time */ }
}

/** A notification shown by this device itself, to check that they work. */
export async function testNotification(title: string, body: string) {
  const reg = await registration()
  await reg?.showNotification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/badge-96.png', tag: 'test' })
}
