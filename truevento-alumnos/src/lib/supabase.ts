// A light Supabase client: only sign-in (auth-js) and the database (postgrest-js), the two
// parts this app uses. The full client also brings files, realtime and functions, which
// made the app heavier to download with nothing in return. Same session key as before,
// so nobody has to sign in again.
import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

const base = (url ?? 'http://invalid.local').replace(/\/$/, '')
const apiKey = key ?? 'missing'

// Same database as the school's management app; this app has its own session key.
const auth = new AuthClient({
  url: `${base}/auth/v1`,
  headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
  storageKey: 'truevento-alumnos-auth',
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: false,
})

/** Every database call carries the signed-in user's token (or the public key when signed out). */
const fetchWithAuth: typeof fetch = async (input, init) => {
  const { data } = await auth.getSession()
  const headers = new Headers(init?.headers)
  if (!headers.has('apikey')) headers.set('apikey', apiKey)
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${data.session?.access_token ?? apiKey}`)
  return fetch(input, { ...init, headers })
}

const rest = new PostgrestClient(`${base}/rest/v1`, { fetch: fetchWithAuth })

export const supabase = {
  auth,
  from: rest.from.bind(rest),
  rpc: rest.rpc.bind(rest),
}
