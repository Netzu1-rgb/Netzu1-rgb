import { supabase } from './supabase'
import { fetchSetupStatus } from './api'
import { loginToEmail } from './username'

// Single-person mode: when VITE_AUTO_LOGIN_PASSWORD is set, the app has no login screen.
// It signs in by itself with one internal account (created on the first run), so whoever
// opens the link goes straight into the app. Only for a private link used by one person.

const PASSWORD = import.meta.env.VITE_AUTO_LOGIN_PASSWORD
const USER = import.meta.env.VITE_AUTO_LOGIN_USER || 'escuela'
const DOMAIN = import.meta.env.VITE_USERNAME_DOMAIN || 'truevento.com'

export const SINGLE_USER = Boolean(PASSWORD) && import.meta.env.VITE_DEMO !== '1'

/** Signs in with the internal account; creates it on the very first run. */
export async function autoSignIn(): Promise<boolean> {
  if (!SINGLE_USER || !PASSWORD) return false
  const email = loginToEmail(USER, DOMAIN)
  const first = await supabase.auth.signInWithPassword({ email, password: PASSWORD })
  if (!first.error) return true
  if (!/Invalid login credentials/i.test(first.error.message)) return false
  // the account does not exist yet: only allowed before the school is set up
  const status = await fetchSetupStatus().catch(() => null)
  if (!status || status.completed) return false
  const created = await supabase.auth.signUp({ email, password: PASSWORD, options: { data: { username: USER } } })
  return Boolean(created.data.session)
}
