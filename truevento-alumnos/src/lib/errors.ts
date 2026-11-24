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

/** A readable Spanish message for errors from Supabase or the network. */
export function friendlyError(err: unknown): string {
  if (isNetworkError(err)) return 'Sin conexión. Revisá internet e intentá de nuevo.'
  const e = (err ?? {}) as ErrorLike
  const msg = e.message ?? String(err)
  if (e.code === '23505') return 'Ese registro ya existe.'
  if (e.code === '23503') return 'No se puede completar: hay datos relacionados (por ejemplo, clases de este alumno).'
  if (e.code === '42501' || /row-level security/i.test(msg)) return 'No tenés permiso para hacer esto.'
  if (/Invalid login credentials/i.test(msg)) return 'Usuario o contraseña incorrectos.'
  if (/Email not confirmed/i.test(msg)) return 'Tenés que confirmar tu email antes de ingresar.'
  if (/User already registered/i.test(msg)) return 'Ya existe una cuenta con ese email.'
  if (/Password should be/i.test(msg)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/JWT expired/i.test(msg)) return 'Tu sesión expiró. Volvé a ingresar.'
  if (e.code === 'P0001' || e.code === '22023') return msg // our own Spanish messages from the database
  return msg || 'Ocurrió un error inesperado.'
}
