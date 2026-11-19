// Dates are calendar days (YYYY-MM-DD) in the device's local time zone.

export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'custom'

export interface Period {
  kind: PeriodKind
  from: string
  to: string
}

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): string {
  return toISODate(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

/** Period containing `ref`. Weeks start on Monday. */
export function periodFor(kind: Exclude<PeriodKind, 'custom'>, ref: string = today()): Period {
  const d = parseISODate(ref)
  if (kind === 'day') return { kind, from: ref, to: ref }
  if (kind === 'week') {
    const offset = (d.getDay() + 6) % 7
    const from = addDays(ref, -offset)
    return { kind, from, to: addDays(from, 6) }
  }
  if (kind === 'month') {
    const from = new Date(d.getFullYear(), d.getMonth(), 1)
    const to = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { kind, from: toISODate(from), to: toISODate(to) }
  }
  return { kind, from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` }
}

/** Moves a period one step back (-1) or forward (+1). */
export function shiftPeriod(p: Period, step: -1 | 1): Period {
  if (p.kind === 'custom') {
    const len = daysBetween(p.from, p.to) + 1
    return { kind: 'custom', from: addDays(p.from, step * len), to: addDays(p.to, step * len) }
  }
  if (p.kind === 'day') return periodFor('day', addDays(p.from, step))
  if (p.kind === 'week') return periodFor('week', addDays(p.from, step * 7))
  const d = parseISODate(p.from)
  if (p.kind === 'month') return periodFor('month', toISODate(new Date(d.getFullYear(), d.getMonth() + step, 1)))
  return periodFor('year', `${d.getFullYear() + step}-01-01`)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / 86_400_000)
}

const longDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
const monthYear = new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit' })
const monthLong = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' })

export function formatDate(iso: string): string {
  return longDate.format(parseISODate(iso))
}

export function formatShortDate(iso: string): string {
  return shortDate.format(parseISODate(iso))
}

export function formatMonth(isoMonth: string): string {
  return monthYear.format(parseISODate(`${isoMonth}-01`)).replace('.', '')
}

export function describePeriod(p: Period): string {
  if (p.kind === 'day') return formatDate(p.from)
  if (p.kind === 'month') {
    const s = monthLong.format(parseISODate(p.from))
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
  if (p.kind === 'year') return p.from.slice(0, 4)
  return `${formatShortDate(p.from)} – ${formatShortDate(p.to)}`
}

export interface ChartBucket {
  key: string
  label: string
  /** full name for tooltips */
  title: string
}

const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'short' })

/**
 * Groups a period for charts so bars stay readable:
 * up to 7 days -> one bar per day, up to a month -> one bar per week (1–7, 8–14…),
 * longer -> one bar per month. `keyOf` maps a class date to its bar.
 */
export function chartBuckets(from: string, to: string): { buckets: ChartBucket[]; keyOf: (iso: string) => string; unit: string } {
  const days = daysBetween(from, to)
  if (days < 7) {
    const buckets = []
    for (let i = 0; i <= days; i++) {
      const iso = addDays(from, i)
      const wd = weekday.format(parseISODate(iso)).replace('.', '')
      buckets.push({ key: iso, label: `${wd} ${Number(iso.slice(8, 10))}`, title: formatDate(iso) })
    }
    return { buckets, keyOf: (iso) => iso, unit: 'por día' }
  }
  if (days <= 31) {
    const buckets = []
    for (let start = 0; start <= days; start += 7) {
      const a = addDays(from, start)
      const b = addDays(from, Math.min(start + 6, days))
      buckets.push({ key: String(start / 7), label: `${Number(a.slice(8, 10))}–${Number(b.slice(8, 10))}`, title: `${formatDate(a)} al ${formatDate(b)}` })
    }
    return { buckets, keyOf: (iso) => String(Math.floor(daysBetween(from, iso) / 7)), unit: 'por semana' }
  }
  const buckets = []
  const start = parseISODate(from)
  const end = parseISODate(to)
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
    const key = toISODate(d).slice(0, 7)
    const long = monthLong.format(d)
    buckets.push({ key, label: formatMonth(key), title: long.charAt(0).toUpperCase() + long.slice(1) })
  }
  return { buckets, keyOf: (iso) => iso.slice(0, 7), unit: 'por mes' }
}
