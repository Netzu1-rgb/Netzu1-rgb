import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

// The session (access + refresh token) is kept by supabase-js and refreshed
// automatically; app data itself lives in Postgres, never in localStorage.
export const supabase = createClient(url ?? 'http://invalid.local', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'truevento-auth' },
})
