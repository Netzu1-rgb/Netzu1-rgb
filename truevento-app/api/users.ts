// Vercel function: app logins for instructors and owners.
// Creating auth users needs the service role key, so it runs on the server and
// only after checking that the caller is an active admin.
//
// POST  /api/users  { instructor_id, username, password }        create a login
// PATCH /api/users  { profile_id, active?, password? }           enable/disable or reset password

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// same rules as src/lib/username.ts (kept here so the function has no app imports)
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/
const normalizeUsername = (input: string) =>
  input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '.')

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

function serviceClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Returns the service client when the bearer token belongs to an active admin. */
async function requireAdmin(request: Request): Promise<{ db: SupabaseClient; userId: string } | Response> {
  const db = serviceClient()
  if (!db) return json(500, { error: 'El servidor no tiene configurado Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' })
  const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Sesión requerida.' })
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) return json(401, { error: 'Sesión inválida o vencida. Volvé a ingresar.' })
  const { data: profile } = await db.from('profiles').select('role, active').eq('id', data.user.id).maybeSingle()
  if (!profile || profile.role !== 'admin' || !profile.active) return json(403, { error: 'Solo un administrador puede gestionar accesos.' })
  return { db, userId: data.user.id }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json()
    return b && typeof b === 'object' ? (b as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth
  const { db } = auth
  const body = await readBody(request)
  const instructorId = String(body.instructor_id ?? '')
  const username = normalizeUsername(String(body.username ?? ''))
  const password = String(body.password ?? '')
  if (!USERNAME_PATTERN.test(username)) return json(400, { error: 'Usuario inválido: de 3 a 30 letras, números, punto o guion.' })
  if (password.length < 8) return json(400, { error: 'La contraseña debe tener al menos 8 caracteres.' })

  const { data: instructor } = await db.from('instructors').select('id, full_name, kind').eq('id', instructorId).maybeSingle()
  if (!instructor) return json(404, { error: 'Instructor inexistente.' })
  const { data: linked } = await db.from('profiles').select('id').eq('instructor_id', instructorId).limit(1)
  if (linked?.length) return json(409, { error: 'Este instructor ya tiene acceso.' })

  const domain = process.env.USERNAME_DOMAIN ?? process.env.VITE_USERNAME_DOMAIN ?? 'truevento.com'
  const { data: created, error } = await db.auth.admin.createUser({
    email: `${username}@${domain}`,
    password,
    email_confirm: true,
    user_metadata: { full_name: instructor.full_name, username },
  })
  if (error || !created.user) {
    const taken = /already|registered|exists/i.test(error?.message ?? '')
    return json(taken ? 409 : 400, { error: taken ? 'Ese usuario ya existe. Elegí otro.' : error?.message ?? 'No se pudo crear el usuario.' })
  }

  const role = instructor.kind === 'owner' ? 'admin' : 'instructor'
  const { error: profileError } = await db.from('profiles').upsert({
    id: created.user.id, full_name: instructor.full_name, username, role, instructor_id: instructor.id, active: true,
  })
  if (profileError) {
    await db.auth.admin.deleteUser(created.user.id) // keep things consistent
    return json(500, { error: 'No se pudo asignar el rol. Probá de nuevo.' })
  }
  return json(201, { id: created.user.id, username, role })
}

export async function PATCH(request: Request): Promise<Response> {
  const auth = await requireAdmin(request)
  if (auth instanceof Response) return auth
  const { db, userId } = auth
  const body = await readBody(request)
  const profileId = String(body.profile_id ?? '')
  const { data: profile } = await db.from('profiles').select('id').eq('id', profileId).maybeSingle()
  if (!profile) return json(404, { error: 'Usuario inexistente.' })

  if (typeof body.password === 'string') {
    if (body.password.length < 8) return json(400, { error: 'La contraseña debe tener al menos 8 caracteres.' })
    const { error } = await db.auth.admin.updateUserById(profileId, { password: body.password })
    if (error) return json(400, { error: error.message })
  }
  if (typeof body.active === 'boolean') {
    if (profileId === userId && !body.active) return json(400, { error: 'No podés desactivar tu propio acceso.' })
    const { error } = await db.from('profiles').update({ active: body.active }).eq('id', profileId)
    if (error) return json(500, { error: 'No se pudo actualizar el acceso.' })
    // an inactive profile loses all data access at once (row level security checks it)
  }
  return json(200, { ok: true })
}
