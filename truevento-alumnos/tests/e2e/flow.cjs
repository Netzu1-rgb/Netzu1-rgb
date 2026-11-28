// End to end on the LOCAL database (cd truevento-app && npx supabase start): a student signs up,
// asks for a class, the admin sees it, the school confirms it, the student sees it confirmed,
// and reopening the app keeps her signed in. Starts its own copy of the app on :5175.
// Usage: node tests/e2e/flow.cjs
const { chromium } = require('playwright')
const { execFileSync, spawn } = require('child_process')
const path = require('path')
const APP_DIR = path.join(__dirname, '..', '..')
const env = Object.fromEntries(execFileSync('npx', ['supabase', 'status', '-o', 'env'], { cwd: path.join(APP_DIR, '..', 'truevento-app'), stdio: ['ignore', 'pipe', 'ignore'] })
  .toString().split('\n').filter((l) => l.includes('=')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }))
const API = env.API_URL, ANON = env.ANON_KEY, SERVICE = env.SERVICE_ROLE_KEY
const sql = (q) => execFileSync('psql', ['-h', '127.0.0.1', '-p', '54322', '-U', 'postgres', '-d', 'postgres', '-qtAX', '-v', 'ON_ERROR_STOP=1', '-c', q], { env: { ...process.env, PGPASSWORD: 'postgres' } }).toString().trim()
const BASE = 'http://127.0.0.1:5175'
const run = Date.now().toString(36)
const STUDENT = { user: `ana.${run}`, pass: 'Viento2026', name: `Ana E2E ${run}` }
const ADMIN = { user: `admin.${run}`, pass: 'Gestion2026' }
const steps = []
const step = (name, ok, extra = '') => { steps.push(ok); console.log(`${ok ? 'OK  ' : 'FAIL'} ${steps.length}. ${name}${extra ? ' — ' + extra : ''}`) }
async function api(p, body, token) {
  const r = await fetch(API + p, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json', Authorization: `Bearer ${token || ANON}` }, body: JSON.stringify(body) })
  const text = await r.text(); if (!r.ok) throw new Error(`${p}: ${r.status} ${text}`); return text ? JSON.parse(text) : null
}

;(async () => {
  // the school: one instructor and one admin account
  const instructorId = sql(`insert into public.instructors (full_name, kind, hourly_pay) values ('Lucas E2E ${run}', 'external', 50) returning id`)
  const adminRes = await fetch(`${API}/auth/v1/admin/users`, { method: 'POST', headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${ADMIN.user}@truevento.com`, password: ADMIN.pass, email_confirm: true, user_metadata: { username: ADMIN.user } }) }).then((r) => r.json())
  sql(`insert into public.profiles (id, full_name, username, role) values ('${adminRes.id}', 'Admin E2E', '${ADMIN.user}', 'admin')
       on conflict (id) do update set role = 'admin', full_name = 'Admin E2E', username = '${ADMIN.user}'`)

  // this copy of the app talks to the local database
  const vite = spawn('npx', ['vite', '--port', '5175', '--strictPort', '--host', '127.0.0.1'], { cwd: APP_DIR, env: { ...process.env, VITE_SUPABASE_URL: API, VITE_SUPABASE_ANON_KEY: ANON }, stdio: 'ignore' })
  for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE)).ok) break } catch {} await new Promise((r) => setTimeout(r, 500)) }
  const b = await chromium.launch()
  try {
    // 1. a new student signs up (the WhatsApp with +55 picks Brazil by itself)
    const sCtx = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-AR' })
    let s = await sCtx.newPage()
    const errors = []; s.on('pageerror', (e) => errors.push(e.message))
    await s.goto(BASE); await s.waitForTimeout(1500)
    await s.getByRole('tab', { name: 'Crear cuenta' }).click()
    await s.getByLabel('Nombre y apellido').fill(STUDENT.name)
    await s.getByLabel('WhatsApp').fill('+55 88 99999-1234')
    await s.getByText(/Nunca/).first().click().catch(() => {})
    await s.getByLabel('Elige un usuario').fill(STUDENT.user); await s.getByLabel('Elige una contraseña').fill(STUDENT.pass)
    await s.locator('input[type=checkbox]').first().check()
    await s.getByRole('button', { name: 'Crear mi cuenta' }).click()
    await s.getByText('¡Hola,').first().waitFor({ timeout: 15000 })
    step('a new student creates her account', true)
    step('her home is in neutral Spanish', await s.getByText('No tienes clases confirmadas.').count() > 0 || await s.getByText(/Pide|Toca|tienes/).count() > 0)

    // 2. she asks for a class: day (tomorrow) → hours → accept the rules → send
    await s.getByRole('button', { name: /Pedir/ }).first().click()
    await s.getByRole('button', { name: /Siguiente/ }).click(); await s.waitForTimeout(300)
    await s.getByRole('button', { name: /Siguiente/ }).click(); await s.waitForTimeout(300)
    await s.getByRole('dialog').locator('input[type=checkbox]').check()
    await s.getByRole('button', { name: 'Enviar pedido' }).click()
    await s.getByText('¡Pedido enviado!').waitFor({ timeout: 10000 })
    const lesson = sql(`select l.id || '|' || l.lesson_date from public.lessons l join public.students st on st.id = l.student_id where st.full_name = '${STUDENT.name}' order by l.created_at desc limit 1`)
    step('she asks for a class and it reaches the school', Boolean(lesson), lesson.split('|')[1])

    // 3. the admin signs in and sees the request
    const aCtx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'es-AR' })
    const a = await aCtx.newPage()
    await a.goto(BASE); await a.waitForTimeout(1500)
    await a.getByLabel('Usuario').fill(ADMIN.user); await a.getByLabel('Contraseña').fill(ADMIN.pass)
    await a.getByRole('button', { name: 'Entrar', exact: true }).click()
    await a.locator('main').waitFor({ timeout: 15000 }); await a.waitForTimeout(1500)
    let sees = await a.getByText(STUDENT.name).count() > 0
    if (!sees) { await a.goto(BASE + '/agenda'); await a.waitForTimeout(2000); sees = await a.getByText(STUDENT.name).count() > 0 }
    step('the admin sees the request in the app', sees)

    // 4. the school confirms it (time agreed on WhatsApp, price per hour, instructor)
    const tok = (await api('/auth/v1/token?grant_type=password', { email: `${ADMIN.user}@truevento.com`, password: ADMIN.pass })).access_token
    const [lessonId, day] = lesson.split('|')
    await api('/rest/v1/rpc/confirm_request', { p_lesson: lessonId, p_rate: 120, p_instructor: instructorId, p_time: '10:00', p_date: day, p_hours: 1.5 }, tok)
    step('the school confirms it', sql(`select status from public.lessons where id = '${lessonId}'`) === 'confirmed')

    // 5. the student sees it confirmed, with her instructor
    await s.reload(); await s.waitForTimeout(3000)
    step('the student sees her class confirmed', await s.getByText('Confirmada').count() > 0 && await s.getByText(`Lucas E2E ${run}`).count() > 0)

    // 6. closing and opening the app keeps her signed in
    await s.close(); s = await sCtx.newPage(); await s.goto(BASE); await s.waitForTimeout(3000)
    step('reopening the app goes straight in', await s.getByText('¡Hola,').count() > 0 && await s.getByLabel('Contraseña').count() === 0)
    step('no errors on the page', errors.length === 0, errors.join(' | '))
  } catch (e) {
    step('flow stopped', false, e.message.split('\n')[0])
  } finally {
    await b.close(); vite.kill()
  }
  const ok = steps.every(Boolean)
  console.log(ok ? `\nE2E OK (${steps.length} pasos)` : '\nE2E FAIL'); process.exit(ok ? 0 : 1)
})()
