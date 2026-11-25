import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import webpush from 'web-push'
import { POST } from './push'

const keys = webpush.generateVAPIDKeys()
const sub = (n: number) => ({ endpoint: `https://push.example/${n}`, keys: { p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM', auth: 'tBHItJI5svbpez7KI4CCXg' } })
const msg = (n: number, title = 'Nueva solicitud de clase') => ({ subscription: sub(n), payload: { title, body: 'Ana pidió el 28/11 a las 10:00', url: '/solicitudes', tag: 'request-abc-123', app: 'gestion' } })
const req = (body: unknown, secret = 'x'.repeat(32)) =>
  new Request('http://localhost/api/push', { method: 'POST', headers: { 'x-push-secret': secret, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

describe('POST /api/push', () => {
  beforeEach(() => {
    process.env.PUSH_SECRET = 'x'.repeat(32)
    process.env.VAPID_PUBLIC_KEY = keys.publicKey
    process.env.VAPID_PRIVATE_KEY = keys.privateKey
    process.env.SUPABASE_URL = 'https://db.example'
    process.env.SUPABASE_ANON_KEY = 'anon'
  })
  afterEach(() => vi.restoreAllMocks())

  it('refuses requests without the secret', async () => {
    const send = vi.fn()
    expect((await POST(req({ messages: [msg(1)] }, 'wrong'), { send })).status).toBe(401)
    expect((await POST(req({ messages: [msg(1)] }, ''), { send })).status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('refuses when push is not configured', async () => {
    delete process.env.VAPID_PRIVATE_KEY
    expect((await POST(req({ messages: [msg(1)] }), { send: vi.fn() })).status).toBe(500)
  })

  it('sends each message with the payload, high urgency, 1 h to live and a topic', async () => {
    const send = vi.fn().mockResolvedValue({ statusCode: 201 })
    const res = await POST(req({ messages: [msg(1), msg(2, '¡Clase confirmada!')] }), { send })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: 2, gone: 0, failed: 0 })
    expect(send).toHaveBeenCalledTimes(2)
    const [s, payload, opts] = send.mock.calls[1]
    expect(s.endpoint).toBe('https://push.example/2')
    expect(JSON.parse(payload)).toMatchObject({ title: '¡Clase confirmada!', url: '/solicitudes', app: 'gestion' })
    expect(opts).toMatchObject({ TTL: 3600, urgency: 'high', topic: 'requestabc123' })
  })

  it('keeps the unique end of long tags as the topic (32 characters at most)', async () => {
    const send = vi.fn().mockResolvedValue({})
    const m = msg(5); m.payload.tag = 'request-3f2a9c1e-77b0-4d8e-9a51-0c6e2b4d9f10'
    await POST(req({ messages: [m] }), { send })
    expect(send.mock.calls[0][2].topic).toBe('3f2a9c1e77b04d8e9a510c6e2b4d9f10')
  })

  it('removes devices the push service no longer knows', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('1'))
    const send = vi.fn()
      .mockResolvedValueOnce({ statusCode: 201 })
      .mockRejectedValueOnce(Object.assign(new Error('gone'), { statusCode: 410 }))
      .mockRejectedValueOnce(Object.assign(new Error('server'), { statusCode: 500 }))
    const res = await POST(req({ messages: [msg(1), msg(2), msg(3)] }), { send })
    expect(await res.json()).toEqual({ sent: 1, gone: 1, failed: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://db.example/rest/v1/rpc/prune_push_subscriptions')
    expect(JSON.parse(String(init!.body))).toEqual({ p_secret: 'x'.repeat(32), p_endpoints: ['https://push.example/2'] })
  })

  it('ignores malformed messages and refuses an empty list', async () => {
    const send = vi.fn().mockResolvedValue({})
    const bad = [{ subscription: { endpoint: 'http://insecure/1', keys: { p256dh: 'a', auth: 'b' } }, payload: { title: 'x' } }, { foo: 1 }]
    expect((await POST(req({ messages: bad }), { send })).status).toBe(400)
    expect((await POST(req({ messages: [...bad, msg(4)] }), { send })).status).toBe(200)
    expect(send).toHaveBeenCalledTimes(1)
  })
})
