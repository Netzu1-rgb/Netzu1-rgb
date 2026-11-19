// Instructors sign in with a plain username. Supabase Auth needs an email, so a
// username maps to <username>@<domain>. api/users.ts repeats these rules; keep them in sync.

export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/

export function normalizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '.')
}

/** A login typed by the user: an email stays as is, a username gets the domain. */
export function loginToEmail(login: string, domain: string): string {
  const v = login.trim().toLowerCase()
  return v.includes('@') ? v : `${normalizeUsername(v)}@${domain}`
}
