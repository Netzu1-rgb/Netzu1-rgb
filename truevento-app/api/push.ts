// Vercel function: delivers the notifications the database prepares (see the
// migration 20261125000000_push_notifications.sql). Only the database knows the
// shared secret, so nobody else can send notifications through it.
//
// POST /api/push   header x-push-secret   body { messages: [{ subscription, payload }] }
//
// Environment: PUSH_SECRET, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:),
// and SUPABASE_URL + SUPABASE_ANON_KEY to remove devices that no longer exist.

import webpush from 'web-push'

interface Message {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
  payload: { title: string; body?: string; url?: string; tag?: string; app?: string }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}

/** Constant-time comparison, so the secret cannot be guessed by timing. */
function sameSecret(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function valid(m: unknown): m is Message {
  const x = m as Message
  return Boolean(x?.subscription?.endpoint?.startsWith('https://') && x.subscription.keys?.p256dh && x.subscription.keys?.auth && x.payload?.title)
}

async function prune(endpoints: string[], secret: string) {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key || !endpoints.length) return
  await fetch(`${url}/rest/v1/rpc/prune_push_subscriptions`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ p_secret: secret, p_endpoints: endpoints }),
  }).catch(() => { /* next time */ })
}

export async function POST(request: Request, deps: { send?: typeof webpush.sendNotification } = {}): Promise<Response> {
  const secret = process.env.PUSH_SECRET ?? ''
  const pub = process.env.VAPID_PUBLIC_KEY ?? process.env.VITE_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!secret || !pub || !priv) return json(500, { error: 'Push is not configured (PUSH_SECRET, VAPID keys).' })
  if (!sameSecret(request.headers.get('x-push-secret') ?? '', secret)) return json(401, { error: 'Unauthorized' })

  let body: { messages?: unknown[] }
  try { body = await request.json() } catch { return json(400, { error: 'Bad JSON' }) }
  const messages = Array.isArray(body?.messages) ? body.messages.filter(valid).slice(0, 200) : []
  if (!messages.length) return json(400, { error: 'No messages' })

  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? 'mailto:truevento7@gmail.com', pub, priv)
  const send = deps.send ?? webpush.sendNotification
  const gone: string[] = []
  let sent = 0
  await Promise.all(messages.map(async (m) => {
    try {
      // high urgency and one hour to live: a request is only useful while it is fresh;
      // the topic lets a newer notification about the same class replace an older one
      await send(m.subscription, JSON.stringify(m.payload), {
        TTL: 3600,
        urgency: 'high',
        // (at most 32 URL-safe characters: the tail keeps the class id, which is unique)
        topic: m.payload.tag?.replace(/[^A-Za-z0-9]/g, '').slice(-32) || undefined,
      })
      sent++
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      // the phone removed the app or turned notifications off
      if (status === 404 || status === 410) gone.push(m.subscription.endpoint)
    }
  }))
  await prune(gone, secret)
  return json(200, { sent, gone: gone.length, failed: messages.length - sent - gone.length })
}
