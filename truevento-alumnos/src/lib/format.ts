// Dates are the school's local calendar days (YYYY-MM-DD); times are HH:MM.

const pad = (n: number) => String(n).padStart(2, '0')

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function today(): string {
  return isoDate(new Date())
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return isoDate(new Date(y, m - 1, d + days))
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Hoy", "Mañana" or "Jue 28 nov". */
export function dayLabel(iso: string): string {
  const t = today()
  if (iso === t) return 'Hoy'
  if (iso === addDays(t, 1)) return 'Mañana'
  if (iso === addDays(t, -1)) return 'Ayer'
  return cap(parse(iso).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '').replace(',', ''))
}

/** "jueves 28 de noviembre" (capitalized: "Jueves 28 de noviembre"). */
export function longDay(iso: string, capital = false): string {
  const s = parse(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return capital ? cap(s) : s
}

export function shortTime(t: string): string {
  return t.slice(0, 5)
}

/** End time of a lesson: 10:00 + 1:30 -> 11:30. */
export function endTime(start: string, hours: number): string {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + Math.round(hours * 60)
  return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`
}

/** 1.5 -> "1:30 hs", 2 -> "2 hs". */
export function formatHours(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${m === 0 ? h : `${h}:${pad(m)}`} hs`
}

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'recién'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function firstName(full: string | null | undefined): string {
  return (full ?? '').trim().split(/\s+/)[0] ?? ''
}

/** Invite codes are shown as ABCD-EFGH; people may type them any way. */
export function normalizeCode(input: string): string {
  const c = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  return c.length > 4 ? `${c.slice(0, 4)}-${c.slice(4)}` : c
}

export const DURATIONS = [1, 1.5, 2, 2.5, 3]
export const START_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
