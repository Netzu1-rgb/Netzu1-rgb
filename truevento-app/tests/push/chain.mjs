// End-to-end check of the notification chain, locally:
//   database (private.notify) → pg_net → /api/push (vite dev) → web-push (VAPID, aes128gcm)
//   → a fake push service over HTTPS, which decrypts the message like a phone would.
// Needs: `supabase start`, the dev server started by this script, docker, openssl.
// Usage: node tests/push/chain.mjs
import { execFileSync, spawn } from 'node:child_process'
import { createECDH, randomBytes } from 'node:crypto'
import { createServer } from 'node:https'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ece from 'http_ece'

const DB = 'supabase_db_truevento'
const env = Object.fromEntries(readFileSync(new URL('../../.env.local', import.meta.url), 'utf8')
  .split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]))
const sql = (q) => execFileSync('docker', ['exec', DB, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tAc', q], { encoding: 'utf8' }).trim()
const gateway = execFileSync('docker', ['inspect', DB, '--format', '{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}'], { encoding: 'utf8' }).trim()
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1 }

// 1. a "phone": its push keys, as a browser would create them
const phone = createECDH('prime256v1'); phone.generateKeys()
const authSecret = randomBytes(16)
const b64 = (b) => Buffer.from(b).toString('base64url')

// 2. the fake push service (HTTPS with a throwaway certificate)
const dir = mkdtempSync(join(tmpdir(), 'push-chain-'))
execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes', '-days', '1',
  '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem')], { stdio: 'ignore' })
const received = []
const service = createServer({ key: readFileSync(join(dir, 'key.pem')), cert: readFileSync(join(dir, 'cert.pem')) }, (req, res) => {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const gone = req.url.endsWith('/gone')
    received.push({ url: req.url, headers: req.headers, body: Buffer.concat(chunks) })
    res.writeHead(gone ? 410 : 201).end()
  })
}).listen(9443)

// 3. the management app's dev server, trusting that certificate
const PORT = 5191
const vite = spawn('npx', ['vite', '--port', String(PORT), '--host', '0.0.0.0', '--strictPort'], {
  cwd: new URL('../..', import.meta.url).pathname, env: { ...process.env, NODE_EXTRA_CA_CERTS: join(dir, 'cert.pem') }, stdio: 'ignore', detached: true })
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`http://127.0.0.1:${PORT}/`)).ok) break } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 500))
}

const ADMIN = '00000000-0000-0000-0000-00000000c4a1'
try {
  // the dev server refuses calls without the secret
  const r401 = await fetch(`http://127.0.0.1:${PORT}/api/push`, { method: 'POST', body: '{}', headers: { 'x-push-secret': 'nope' } })
  if (r401.status !== 401) fail(`expected 401 without the secret, got ${r401.status}`)

  sql(`insert into private.push_config (id, url, secret) values (1, 'http://${gateway}:${PORT}/api/push', '${env.PUSH_SECRET}')
       on conflict (id) do update set url = excluded.url, secret = excluded.secret`)
  sql(`insert into auth.users (id, instance_id, aud, role, email) values ('${ADMIN}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'chain@test.local');
       insert into public.push_subscriptions (user_id, app, endpoint, p256dh, auth, lang) values
         ('${ADMIN}', 'gestion', 'https://localhost:9443/phone', '${b64(phone.getPublicKey())}', '${b64(authSecret)}', 'es'),
         ('${ADMIN}', 'gestion', 'https://localhost:9443/gone', '${b64(phone.getPublicKey())}', '${b64(authSecret)}', 'es');`)
  sql(`select private.notify(array['${ADMIN}'::uuid], 'gestion', '{"url": "/solicitudes", "tag": "request-chain-1",
       "es": {"title": "Nueva solicitud de clase", "body": "Ana pidió el 28/11 a las 10:00"}}'::jsonb)`)

  for (let i = 0; i < 40 && received.length < 2; i++) await new Promise((r) => setTimeout(r, 500))
  const msg = received.find((x) => x.url === '/phone')
  if (!msg) fail(`the push service got nothing (pg_net: ${sql('select status_code, error_msg from net._http_response order by id desc limit 1')})`)
  else {
    const h = msg.headers
    if (h['content-encoding'] !== 'aes128gcm') fail(`encoding ${h['content-encoding']}`)
    if (h.ttl !== '3600' || h.urgency !== 'high' || h.topic !== 'requestchain1') fail(`headers ttl=${h.ttl} urgency=${h.urgency} topic=${h.topic}`)
    if (!/^vapid t=.+, k=/.test(h.authorization ?? '')) fail('missing VAPID authorization')
    const jwt = JSON.parse(Buffer.from(h.authorization.split('t=')[1].split(',')[0].split('.')[1], 'base64url'))
    if (jwt.aud !== 'https://localhost:9443') fail(`VAPID audience ${jwt.aud}`)
    const plain = ece.decrypt(msg.body, { version: 'aes128gcm', privateKey: phone, authSecret: b64(authSecret) })
    const payload = JSON.parse(plain.toString('utf8'))
    console.log('decrypted on the "phone":', payload)
    if (payload.title !== 'Nueva solicitud de clase' || payload.url !== '/solicitudes' || payload.app !== 'gestion') fail('payload')
  }
  // the device the push service said is gone (410) was removed from the database
  for (let i = 0; i < 20; i++) {
    if (sql(`select count(*) from public.push_subscriptions where endpoint like '%/gone'`) === '0') break
    await new Promise((r) => setTimeout(r, 300))
  }
  if (sql(`select count(*) from public.push_subscriptions where endpoint like '%/gone'`) !== '0') fail('gone device not pruned')
  if (sql(`select count(*) from public.push_subscriptions where endpoint like '%/phone'`) !== '1') fail('live device was removed')
} finally {
  sql(`delete from auth.users where id = '${ADMIN}'; delete from private.push_config;`)
  process.kill(-vite.pid); service.close()
}
if (!process.exitCode) console.log('PUSH CHAIN OK: database → pg_net → /api/push → push service → decrypted')
