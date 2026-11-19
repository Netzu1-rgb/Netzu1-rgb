// Money helpers. Amounts are handled as integer cents and hours as integer
// hundredths so previews match the database exactly:
//   total = round(hours * rate, 2), rounding half away from zero (Postgres numeric).

export function toCents(value: number): number {
  return Math.round(value * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

/** round(hours * rate, 2) in cents, without floating point drift. */
export function lineTotalCents(hours: number, rate: number): number {
  const h = Math.round(hours * 100) // hundredths of an hour
  const c = Math.round(rate * 100) // cents
  const product = h * c // in 1/10000 of the currency
  const sign = product < 0 ? -1 : 1
  return sign * Math.floor((Math.abs(product) + 50) / 100)
}

export interface ClassAmounts {
  totalCents: number
  instructorPayCents: number
  profitCents: number
}

export function classAmounts(hours: number, studentRate: number, instructorRate: number): ClassAmounts {
  const totalCents = lineTotalCents(hours, studentRate)
  const instructorPayCents = lineTotalCents(hours, instructorRate)
  return { totalCents, instructorPayCents, profitCents: totalCents - instructorPayCents }
}

/** Sums amounts that come from the database (numbers with up to 2 decimals). */
export function sumAmounts(values: Array<number | string | null | undefined>): number {
  return fromCents(values.reduce<number>((acc, v) => acc + toCents(Number(v ?? 0)), 0))
}

/** Sums hours (up to 2 decimals) without drift. */
export function sumHours(values: Array<number | string | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + Math.round(Number(v ?? 0) * 100), 0) / 100
}

/**
 * Parses a user-typed decimal: accepts "1,5", "1.5", "1.234,50", "1,234.50".
 * Returns null when it is not a valid non-negative number.
 */
export function parseDecimal(input: string): number | null {
  let s = input.trim().replace(/\s/g, '').replace(/^[^\d.,-]+/, '')
  if (!s) return null
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  if (lastComma > -1 && lastDot > -1) {
    // the later separator is the decimal one
    s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (lastComma > -1) {
    s = s.replace(',', '.')
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Rounds to 2 decimals and rejects more precision than the database keeps. */
export function hasAtMostTwoDecimals(n: number): boolean {
  return Math.abs(Math.round(n * 100) - n * 100) < 1e-6
}

const formatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(value: number | string | null | undefined, currency = 'BRL'): string {
  let f = formatters.get(currency)
  if (!f) {
    f = new Intl.NumberFormat('es-AR', { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    formatters.set(currency, f)
  }
  return f.format(Number(value ?? 0))
}

const hoursFormat = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

/** Hours as hours:minutes, the way the school says them: 1.5 -> "1:30 hs", 2 -> "2 hs". */
export function formatHours(value: number | string | null | undefined): string {
  return `${hoursToInput(Number(value ?? 0))} hs`
}

/** Hours for an input field: 1.5 -> "1:30", 2 -> "2". */
export function hoursToInput(hours: number): string {
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m === 0 ? String(h) : `${h}:${String(m).padStart(2, '0')}`
}

/**
 * Parses a duration typed as "1:30", "1.30 hs", "2" or "1,5". Lessons go in quarters of
 * an hour (00, 15, 30, 45 minutes) so the amount stays exact. Returns decimal hours or null.
 */
export function parseHours(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s*(hs|h|horas?)\.?$/, '').trim()
  if (!s) return null
  const hm = /^(\d{1,2})[:.](\d{2})$/.exec(s)
  let hours: number | null
  if (hm) {
    const m = Number(hm[2])
    if (m >= 60) return null
    hours = Number(hm[1]) + m / 60
  } else {
    hours = parseDecimal(s)
  }
  if (hours === null || !isQuarterHour(hours)) return null
  return Math.round(hours * 100) / 100
}

export function isQuarterHour(hours: number): boolean {
  return Math.abs(hours * 4 - Math.round(hours * 4)) < 1e-9
}

export function formatNumber(value: number | string | null | undefined): string {
  return hoursFormat.format(Number(value ?? 0))
}
