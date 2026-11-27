// Many students at once on the LOCAL stack: each opens the app (summary, agenda, taken times)
// over the same API the phones use. Prints requests per second, latency and errors.
const autocannon = require('autocannon') // npm i autocannon (only for this test)
const fs = require('fs')

const env = Object.fromEntries(fs.readFileSync('/home/user/Netzu1-rgb/truevento-alumnos/.env.local', 'utf8')
  .split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const URL = 'http://127.0.0.1:54321'
const KEY = env.VITE_SUPABASE_ANON_KEY
const DOMAIN = env.VITE_USERNAME_DOMAIN

;(async () => {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `ana.silva@${DOMAIN}`, password: 'Viento2026' }),
  })
  const token = (await r.json()).access_token
  if (!token) throw new Error('no token')
  const day = (n) => { const d = new Date(Date.now() + n * 86400e3); return d.toISOString().slice(0, 10) }
  const headers = { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const requests = [
    { method: 'POST', path: '/rest/v1/rpc/my_student_summary', headers, body: '{}' },
    { method: 'POST', path: '/rest/v1/rpc/agenda', headers, body: JSON.stringify({ p_from: day(-30), p_to: day(60) }) },
    { method: 'POST', path: '/rest/v1/rpc/busy_slots', headers, body: JSON.stringify({ p_from: day(0), p_to: day(60), p_exclude: null }) },
    { method: 'POST', path: '/rest/v1/rpc/instructor_directory', headers, body: '{}' },
  ]
  for (const connections of [50, 200]) {
    const res = await autocannon({ url: URL, connections, duration: 15, requests })
    console.log(`${connections} usuarios a la vez: ${Math.round(res.requests.average)} consultas/s · latencia media ${res.latency.average} ms · p99 ${res.latency.p99} ms · errores ${res.errors + res.non2xx} de ${res.requests.total}`)
  }
})()
