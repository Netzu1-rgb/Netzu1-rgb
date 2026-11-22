import { describe, expect, it } from 'vitest'
import { classAmounts, formatHours, hoursToInput, lineTotalCents, parseDecimal, parseHours, sumAmounts, sumHours, hasAtMostTwoDecimals } from './money'
import { chartBuckets, periodFor, shiftPeriod } from './dates'
import { toCsv } from './csv'
import { loginToEmail, normalizeUsername, USERNAME_PATTERN } from './username'

describe('money', () => {
  it('matches Postgres round(hours * rate, 2)', () => {
    expect(lineTotalCents(1.5, 33.33)).toBe(5000) // 49.995 -> 50.00
    expect(lineTotalCents(2.5, 120)).toBe(30000)
    expect(lineTotalCents(0.25, 0.1)).toBe(3) // 0.025 -> 0.03
    expect(lineTotalCents(1.1, 1.1)).toBe(121)
    expect(lineTotalCents(3, 0)).toBe(0)
  })

  it('computes class totals, instructor pay and school profit', () => {
    expect(classAmounts(1.5, 200, 50)).toEqual({ totalCents: 30000, instructorPayCents: 7500, profitCents: 22500 })
    expect(classAmounts(2, 180, 0)).toEqual({ totalCents: 36000, instructorPayCents: 0, profitCents: 36000 })
  })

  it('sums without floating point drift', () => {
    expect(sumAmounts([0.1, 0.2, 0.3])).toBe(0.6)
    expect(sumAmounts(['10.05', 20.1, null])).toBe(30.15)
    expect(sumHours([1.5, 2.5, 0.25])).toBe(4.25)
  })

  it('parses decimals typed with comma or dot', () => {
    expect(parseDecimal('1,5')).toBe(1.5)
    expect(parseDecimal('1.5')).toBe(1.5)
    expect(parseDecimal('1.234,50')).toBe(1234.5)
    expect(parseDecimal('1,234.50')).toBe(1234.5)
    expect(parseDecimal('R$ 200')).toBe(200)
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('-3')).toBeNull()
    expect(hasAtMostTwoDecimals(1.25)).toBe(true)
    expect(hasAtMostTwoDecimals(1.255)).toBe(false)
  })
})

describe('hours', () => {
  it('shows hours as h:mm', () => {
    expect(formatHours(1.5)).toBe('1:30 hs')
    expect(formatHours(2)).toBe('2 hs')
    expect(formatHours(0.25)).toBe('0:15 hs')
    expect(formatHours(7.75)).toBe('7:45 hs')
    expect(hoursToInput(2.5)).toBe('2:30')
  })

  it('reads hours typed as h:mm or decimals, in quarter hours', () => {
    expect(parseHours('1:30')).toBe(1.5)
    expect(parseHours('1:30 hs')).toBe(1.5)
    expect(parseHours('2')).toBe(2)
    expect(parseHours('0:45')).toBe(0.75)
    expect(parseHours('1,5')).toBe(1.5)
    expect(parseHours('1:20')).toBeNull() // not a quarter hour
    expect(parseHours('1:75')).toBeNull()
    expect(parseHours('abc')).toBeNull()
  })
})

describe('dates', () => {
  it('builds periods', () => {
    expect(periodFor('week', '2026-11-19')).toEqual({ kind: 'week', from: '2026-11-16', to: '2026-11-22' })
    expect(periodFor('month', '2026-02-10')).toEqual({ kind: 'month', from: '2026-02-01', to: '2026-02-28' })
    expect(periodFor('year', '2026-06-01')).toEqual({ kind: 'year', from: '2026-01-01', to: '2026-12-31' })
    expect(shiftPeriod(periodFor('month', '2026-01-15'), -1)).toEqual({ kind: 'month', from: '2025-12-01', to: '2025-12-31' })
    expect(shiftPeriod({ kind: 'custom', from: '2026-11-01', to: '2026-11-10' }, 1))
      .toEqual({ kind: 'custom', from: '2026-11-11', to: '2026-11-20' })
  })

  it('buckets charts by day or month', () => {
    const week = chartBuckets('2026-11-16', '2026-11-22')
    expect(week.buckets).toHaveLength(7)
    const month = chartBuckets('2026-11-01', '2026-11-30')
    expect(month.buckets.map((b) => b.label)).toEqual(['1–7', '8–14', '15–21', '22–28', '29–30'])
    expect(month.keyOf('2026-11-15')).toBe('2')
    const year = chartBuckets('2026-01-01', '2026-12-31')
    expect(year.buckets).toHaveLength(12)
    expect(year.keyOf('2026-03-09')).toBe('2026-03')
  })
})

describe('csv', () => {
  it('writes Excel-friendly CSV', () => {
    const csv = toCsv([{ a: 'Juan; "Pepe"', n: 1.5, f: '=SUM(A1)' }], [
      { header: 'Nombre', value: (r) => r.a },
      { header: 'Horas', value: (r) => r.n, numeric: true },
      { header: 'Nota', value: (r) => r.f },
    ])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Juan; ""Pepe"""')
    expect(csv).toContain(';1,5;')
    expect(csv).toContain("'=SUM(A1)")
  })
})

describe('usernames', () => {
  it('maps a username to an email', () => {
    expect(normalizeUsername(' Sebastián Comasco ')).toBe('sebastian.comasco')
    expect(loginToEmail('Sebastian', 'truevento.com')).toBe('sebastian@truevento.com')
    expect(loginToEmail('Admin@Mail.com', 'x')).toBe('admin@mail.com')
    expect(USERNAME_PATTERN.test('mika')).toBe(true)
    expect(USERNAME_PATTERN.test('a b')).toBe(false)
  })
})
