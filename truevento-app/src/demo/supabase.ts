// Demo backend: a small in-browser stand-in for the Supabase client, used only by
// `npm run build:demo` (vite.config.ts swaps it in for src/lib/supabase.ts).
// It starts empty (two owners, no data) and mirrors the database rules that matter on screen: money columns, owner pay = 0,
// instructors see only their own data, settled classes are frozen, settlements.
// Data lives in this browser's localStorage; nothing is sent anywhere.

/* eslint-disable @typescript-eslint/no-explicit-any */
import { lineTotalCents } from '../lib/money'

type Row = Record<string, any>
interface DB {
  school_settings: Row[]
  instructors: Row[]
  profiles: Row[]
  students: Row[]
  classes: Row[]
  settlements: Row[]
  users: { id: string; email: string; password: string }[]
}
type Table = Exclude<keyof DB, 'users'>

const KEY = 'truevento-demo-v2'
export const DEMO_DOMAIN = 'usuarios.truevento.app'

const uid = () => crypto.randomUUID()

// starts empty: the two owners and their logins, no students, classes or payments
function seed(): DB {
  const o1 = uid(), o2 = uid()
  const u1 = uid(), u2 = uid()
  return {
    school_settings: [{ id: 1, school_name: 'TRUEVENTO', currency: 'BRL', setup_completed_at: new Date().toISOString() }],
    instructors: [
      { id: o1, full_name: 'Victoria Linde', phone: null, kind: 'owner', owner_slot: 1, hourly_pay: 0, active: true },
      { id: o2, full_name: 'Sebastián Comasco', phone: null, kind: 'owner', owner_slot: 2, hourly_pay: 0, active: true },
    ],
    profiles: [
      { id: u1, full_name: 'Victoria Linde', username: 'victoria', role: 'admin', instructor_id: o1, active: true, created_at: '' },
      { id: u2, full_name: 'Sebastián Comasco', username: 'sebastian', role: 'admin', instructor_id: o2, active: true, created_at: '' },
    ],
    students: [],
    classes: [],
    settlements: [],
    users: [
      { id: u1, email: `victoria@${DEMO_DOMAIN}`, password: 'demo1234' },
      { id: u2, email: `sebastian@${DEMO_DOMAIN}`, password: 'demo1234' },
    ],
  }
}

const cents = (c: number) => c / 100

function withMoney(c: Row): Row {
  const total = lineTotalCents(Number(c.hours), Number(c.student_rate))
  const pay = lineTotalCents(Number(c.hours), Number(c.instructor_rate))
  return { ...c, total_amount: cents(total), instructor_pay: cents(pay), school_profit: cents(total - pay) }
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as DB
  } catch { /* storage blocked: keep in memory */ }
  const db = seed()
  save(db)
  return db
}
let db = load()
function save(d: DB = db) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* ignore */ }
}

export function resetDemo() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('truevento-demo-v1'); localStorage.removeItem('truevento-demo-session') } catch { /* ignore */ }
  try { indexedDB.deleteDatabase('truevento') } catch { /* ignore */ }
}

// ------------------------------------------------------------------ session

let session: any = null
try { session = JSON.parse(localStorage.getItem('truevento-demo-session') ?? 'null') } catch { session = null }
// a session from an older demo points to users that no longer exist
if (session && !db.users.some((u) => u.id === session.user?.id)) session = null
// the demo opens straight into the app as the administrator (no login screen);
// signing out shows the login screen until the page is reloaded
if (!session) {
  const admin = db.users.find((u) => u.email.startsWith('victoria@'))
  if (admin) session = { access_token: 'demo', user: { id: admin.id, email: admin.email } }
}
const listeners = new Set<(event: string, s: any) => void>()
function setSession(s: any, event: string) {
  session = s
  try { localStorage.setItem('truevento-demo-session', JSON.stringify(s)) } catch { /* ignore */ }
  listeners.forEach((fn) => fn(event, s))
}

const me = () => db.profiles.find((p) => p.id === session?.user?.id && p.active) ?? null
const isAdmin = () => me()?.role === 'admin'
const myInstructor = () => me()?.instructor_id ?? null

const offline = () => (typeof navigator !== 'undefined' && !navigator.onLine)
const NET = { data: null, error: { message: 'TypeError: Failed to fetch' } }
const fail = (message: string, code = 'P0001') => ({ data: null, error: { message, code } })
const delay = () => new Promise((r) => setTimeout(r, 120))

// what each role may read (mirrors row level security)
function visible(table: Table): Row[] {
  const rows = db[table]
  if (!me()) return []
  if (isAdmin()) return rows
  const ins = myInstructor()
  switch (table) {
    case 'instructors': return rows.filter((r) => r.id === ins)
    case 'classes': return rows.filter((r) => r.instructor_id === ins)
    case 'settlements': return rows.filter((r) => r.instructor_id === ins)
    case 'profiles': return rows.filter((r) => r.id === session?.user?.id)
    default: return rows
  }
}

const FK: Record<string, Record<string, [Table, string]>> = {
  classes: { student: ['students', 'student_id'], instructor: ['instructors', 'instructor_id'] },
  settlements: { instructor: ['instructors', 'instructor_id'] },
}

// ------------------------------------------------------------------ query builder

class Query implements PromiseLike<any> {
  private filters: ((r: Row) => boolean)[] = []
  private orders: [string, boolean, boolean][] = []
  private max = Infinity
  private single = false
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private payload: any
  private embeds: string[] = []

  constructor(private table: Table) {}

  select(cols = '*') {
    if (this.op === 'select') this.embeds = [...cols.matchAll(/(\w+):\w+\(/g)].map((m) => m[1])
    return this
  }
  insert(p: any) { this.op = 'insert'; this.payload = p; return this }
  update(p: any) { this.op = 'update'; this.payload = p; return this }
  upsert(p: any) { this.op = 'insert'; this.payload = p; return this }
  delete() { this.op = 'delete'; return this }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this }
  gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this }
  lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this }
  is(c: string, v: any) { this.filters.push((r) => (r[c] ?? null) === v); return this }
  order(c: string, o: { ascending?: boolean; nullsFirst?: boolean } = {}) { this.orders.push([c, o.ascending ?? true, o.nullsFirst ?? false]); return this }
  limit(n: number) { this.max = n; return this }
  maybeSingle() { this.single = true; return this }
  single_() { this.single = true; return this }

  then<A, B>(ok?: ((v: any) => A | PromiseLike<A>) | null, err?: ((e: any) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return delay().then(() => this.run()).then(ok, err)
  }

  private run(): any {
    if (offline()) return NET
    if (!me() && this.table !== 'school_settings') return { data: this.single ? null : [], error: null }
    if (this.op === 'insert') return this.doInsert()
    let rows = visible(this.table).filter((r) => this.filters.every((f) => f(r)))
    if (this.op === 'update') return this.doUpdate(rows)
    if (this.op === 'delete') return this.doDelete(rows)
    rows = [...rows]
    for (const [c, asc, nullsFirst] of [...this.orders].reverse()) {
      rows.sort((a, b) => {
        const x = a[c] ?? null, y = b[c] ?? null
        if (x === y) return 0
        if (x === null) return nullsFirst ? -1 : 1
        if (y === null) return nullsFirst ? 1 : -1
        return (x < y ? -1 : 1) * (asc ? 1 : -1)
      })
    }
    rows = rows.slice(0, this.max).map((r) => this.embed(r))
    return { data: this.single ? rows[0] ?? null : rows, error: null }
  }

  private embed(r: Row): Row {
    const out = { ...r }
    for (const alias of this.embeds) {
      const fk = FK[this.table]?.[alias]
      if (!fk) continue
      const target = db[fk[0]].find((x) => x.id === r[fk[1]])
      out[alias] = target ? { full_name: target.full_name } : null
    }
    return out
  }

  private doInsert() {
    const items = Array.isArray(this.payload) ? this.payload : [this.payload]
    for (const raw of items) {
      const row: Row = { id: uid(), ...raw }
      if (db[this.table].some((r) => r.id === row.id)) {
        if (this.table === 'profiles') { Object.assign(db.profiles.find((p) => p.id === row.id)!, row); continue }
        return fail('duplicate key value violates unique constraint', '23505')
      }
      if (this.table === 'students') {
        Object.assign(row, { active: true, created_at: new Date().toISOString(), notes: row.notes ?? null })
      } else if (this.table === 'instructors') {
        if (!isAdmin()) return fail('No tenés permiso para hacer esto.', '42501')
        Object.assign(row, { kind: 'external', owner_slot: null, active: row.active ?? true })
      } else if (this.table === 'classes') {
        const ins = db.instructors.find((i) => i.id === row.instructor_id)
        if (!ins) return fail('Instructor inexistente.')
        if (!isAdmin() && row.instructor_id !== myInstructor()) return fail('No tenés permiso para hacer esto.', '42501')
        if (!isAdmin() && !ins.active) return fail('Tu usuario de instructor está inactivo. Hablá con la escuela.')
        row.instructor_kind = ins.kind
        row.instructor_rate = ins.kind === 'owner' ? 0 : isAdmin() ? row.instructor_rate ?? ins.hourly_pay : ins.hourly_pay
        Object.assign(row, withMoney(row), { settlement_id: null, created_at: new Date().toISOString() })
      }
      db[this.table].push(row)
    }
    save()
    return { data: null, error: null }
  }

  private doUpdate(rows: Row[]) {
    if (!isAdmin() && this.table !== 'profiles') return { data: null, error: null } // RLS: nothing to update
    for (const r of rows) {
      if (this.table === 'classes') {
        if (r.settlement_id) return fail('Esta clase ya está incluida en una liquidación pagada y no se puede modificar.')
        const next = { ...r, ...this.payload, settlement_id: r.settlement_id }
        const ins = db.instructors.find((i) => i.id === next.instructor_id)
        next.instructor_kind = ins?.kind ?? next.instructor_kind
        if (ins?.kind === 'owner') next.instructor_rate = 0
        Object.assign(r, withMoney(next))
      } else if (this.table === 'instructors') {
        Object.assign(r, this.payload, { kind: r.kind, owner_slot: r.owner_slot })
        if (r.kind === 'owner') Object.assign(r, { hourly_pay: 0, active: true })
      } else {
        Object.assign(r, this.payload)
      }
    }
    save()
    return { data: null, error: null }
  }

  private doDelete(rows: Row[]) {
    if (!isAdmin()) return { data: null, error: null }
    for (const r of rows) {
      if (this.table === 'classes' && r.settlement_id) return fail('Esta clase ya está incluida en una liquidación pagada y no se puede eliminar.')
      if (this.table === 'students' && db.classes.some((c) => c.student_id === r.id)) return fail('Tiene clases registradas.', '23503')
    }
    const ids = new Set(rows.map((r) => r.id))
    ;(db[this.table] as Row[]) = db[this.table].filter((r) => !ids.has(r.id))
    save()
    return { data: null, error: null }
  }
}

// ------------------------------------------------------------------ rpc

async function rpc(name: string, a: any = {}) {
  await delay()
  if (offline()) return NET
  switch (name) {
    case 'setup_status':
      return { data: { completed: true, school_name: db.school_settings[0].school_name }, error: null }
    case 'update_school_settings': {
      if (!isAdmin()) return fail('Solo un administrador puede cambiar la configuración.', '42501')
      Object.assign(db.school_settings[0], { school_name: a.p_school_name.trim(), currency: a.p_currency })
      db.instructors.find((i) => i.owner_slot === 1)!.full_name = a.p_owner1.trim()
      db.instructors.find((i) => i.owner_slot === 2)!.full_name = a.p_owner2.trim()
      save()
      return { data: null, error: null }
    }
    case 'pay_settlement': {
      if (!isAdmin()) return fail('Solo un administrador puede registrar pagos.', '42501')
      const ins = db.instructors.find((i) => i.id === a.p_instructor_id)
      if (!ins) return fail('Instructor inexistente.')
      if (ins.kind === 'owner') return fail('Los dueños no generan pagos de instructor.')
      const rows = db.classes.filter((c) => c.instructor_id === ins.id && !c.settlement_id && c.class_date >= a.p_from && c.class_date <= a.p_to)
      if (!rows.length) return fail('No hay clases pendientes de pago en ese período.')
      const amountCents = rows.reduce((s, c) => s + Math.round(c.instructor_pay * 100), 0)
      if (rows.length !== a.p_expected_count || amountCents !== Math.round(a.p_expected_amount * 100)) {
        return fail('Las clases del período cambiaron mientras revisabas. Volvé a calcular la liquidación.')
      }
      const id = uid()
      db.settlements.push({
        id, instructor_id: ins.id, period_start: a.p_from, period_end: a.p_to, classes_count: rows.length,
        total_hours: rows.reduce((s, c) => s + Math.round(c.hours * 100), 0) / 100, amount: cents(amountCents),
        paid_at: a.p_paid_at, notes: a.p_notes ?? null, created_at: new Date().toISOString(),
      })
      rows.forEach((c) => { c.settlement_id = id })
      save()
      return { data: id, error: null }
    }
    case 'cancel_settlement': {
      if (!isAdmin()) return fail('Solo un administrador puede anular pagos.', '42501')
      db.classes.forEach((c) => { if (c.settlement_id === a.p_settlement_id) c.settlement_id = null })
      db.settlements = db.settlements.filter((s) => s.id !== a.p_settlement_id)
      save()
      return { data: null, error: null }
    }
    case 'create_invite': {
      if (!isAdmin()) return fail('Solo un administrador puede invitar.', '42501')
      const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      const pick = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
      return { data: `${pick()}-${pick()}`, error: null }
    }
    default:
      return fail(`Función no disponible en la demo: ${name}`)
  }
}

// ------------------------------------------------------------------ users (stands in for /api/users)

export async function demoUsersApi(method: 'POST' | 'PATCH', body: any): Promise<any> {
  await delay()
  if (!isAdmin()) throw new Error('Solo un administrador puede gestionar accesos.')
  if (method === 'POST') {
    const ins = db.instructors.find((i) => i.id === body.instructor_id)
    if (!ins) throw new Error('Instructor inexistente.')
    if (db.profiles.some((p) => p.instructor_id === ins.id)) throw new Error('Este instructor ya tiene acceso.')
    const email = `${body.username}@${DEMO_DOMAIN}`
    if (db.users.some((u) => u.email === email)) throw new Error('Ese usuario ya existe. Elegí otro.')
    const id = uid()
    db.users.push({ id, email, password: body.password })
    db.profiles.push({ id, full_name: ins.full_name, username: body.username, role: ins.kind === 'owner' ? 'admin' : 'instructor', instructor_id: ins.id, active: true, created_at: new Date().toISOString() })
  } else {
    const p = db.profiles.find((x) => x.id === body.profile_id)
    if (!p) throw new Error('Usuario inexistente.')
    if (typeof body.password === 'string') db.users.find((u) => u.id === p.id)!.password = body.password
    if (typeof body.active === 'boolean') p.active = body.active
  }
  save()
  return { ok: true }
}

// ------------------------------------------------------------------ client

export const isConfigured = true

export const supabase = {
  from: (table: Table) => new Query(table),
  rpc,
  auth: {
    async getSession() { return { data: { session }, error: null } },
    onAuthStateChange(fn: (event: string, s: any) => void) {
      listeners.add(fn)
      return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      await delay()
      const u = db.users.find((x) => x.email === email.toLowerCase() && x.password === password)
      if (!u) return { data: { session: null }, error: { message: 'Invalid login credentials' } }
      const s = { access_token: 'demo', user: { id: u.id, email: u.email } }
      setSession(s, 'SIGNED_IN')
      return { data: { session: s }, error: null }
    },
    async signUp() { return { data: { session: null }, error: { message: 'No disponible en la demo.' } } },
    async signOut() { setSession(null, 'SIGNED_OUT'); return { error: null } },
    async updateUser({ password }: { password: string }) {
      const u = db.users.find((x) => x.id === session?.user?.id)
      if (u) { u.password = password; save() }
      return { data: {}, error: null }
    },
  },
}
