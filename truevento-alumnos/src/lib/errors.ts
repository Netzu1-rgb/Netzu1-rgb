import { dbMessage, t } from '../i18n'

interface ErrorLike {
  message?: string
  code?: string
  details?: string
}

/** True when a request failed because there is no connection (not a server answer). */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const msg = String((err as ErrorLike)?.message ?? err ?? '')
  return /Failed to fetch|NetworkError|Load failed|fetch failed|Network request failed|ERR_INTERNET|timeout/i.test(msg)
}

/** A readable message, in the user's language, for errors from Supabase or the network. */
export function friendlyError(err: unknown): string {
  if (isNetworkError(err)) return t('err.offline')
  const e = (err ?? {}) as ErrorLike
  const msg = e.message ?? String(err)
  if (e.code === '23505') return t('err.exists')
  if (e.code === '23503') return t('err.related')
  if (/Invalid login credentials/i.test(msg)) return t('err.badLogin')
  if (/Email not confirmed/i.test(msg)) return t('err.emailConfirm')
  if (/User already registered/i.test(msg)) return t('err.registered')
  if (/Password should be/i.test(msg)) return t('err.shortPassword')
  if (/JWT expired/i.test(msg)) return t('err.expired')
  // our own messages from the database (written in Spanish), including permission ones
  if (e.code === 'P0001' || e.code === '22023' || (e.code === '42501' && !/row-level security/i.test(msg))) return dbMessage(msg)
  if (e.code === '42501' || /row-level security/i.test(msg)) return t('err.forbidden')
  return msg || t('err.unexpected')
}
