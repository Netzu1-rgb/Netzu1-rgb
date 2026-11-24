import { describe, expect, it } from 'vitest'
import { addDays, endTime, formatHours, normalizeCode } from './format'
import { compass, groupDays, windLevel } from './wind'
import { timeState } from '../components/SlotPicker'

describe('format', () => {
  it('formats hours and times', () => {
    expect(formatHours(1.5)).toBe('1:30 hs')
    expect(formatHours(2)).toBe('2 hs')
    expect(endTime('10:00', 1.5)).toBe('11:30')
    expect(endTime('16:45', 0.75)).toBe('17:30')
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
  })

  it('normalizes invite codes typed any way', () => {
    expect(normalizeCode('abcd efgh')).toBe('ABCD-EFGH')
    expect(normalizeCode('ab')).toBe('AB')
    expect(normalizeCode('ABCD-EFGH-XX')).toBe('ABCD-EFGH')
  })
})

describe('wind', () => {
  it('groups the forecast by day, daytime only', () => {
    const time: string[] = []
    const speed: number[] = []
    for (const d of ['2026-11-24', '2026-11-25']) {
      for (let h = 0; h < 24; h++) {
        time.push(`${d}T${String(h).padStart(2, '0')}:00`)
        speed.push(h >= 10 && h <= 17 ? 20 : 5)
      }
    }
    const days = groupDays({ time, wind_speed_10m: speed, wind_gusts_10m: speed.map((s) => s + 5), wind_direction_10m: speed.map(() => 90) })
    expect(days).toHaveLength(2)
    expect(days[0].hours).toHaveLength(13)
    expect(days[0].avg).toBe(20)
    expect(days[0].gustMax).toBe(25)
  })

  it('classifies wind for lessons', () => {
    expect(windLevel(8)).toBe('low')
    expect(windLevel(18)).toBe('good')
    expect(windLevel(30)).toBe('strong')
    expect(compass(90)).toBe('E')
    expect(compass(350)).toBe('N')
  })
})

describe('time slots', () => {
  const busy = [{ lesson_date: '2030-01-10', start_time: '10:00', hours: 1.5 }]
  it('marks taken and overlapping times', () => {
    expect(timeState('2030-01-10', '10:00', 1, busy)).toBe('taken')
    expect(timeState('2030-01-10', '11:00', 1, busy)).toBe('taken') // inside 10:00–11:30
    expect(timeState('2030-01-10', '09:00', 1, busy)).toBe('free') // ends at 10:00
    expect(timeState('2030-01-10', '09:00', 2, busy)).toBe('noRoom') // would run into 10:00
    expect(timeState('2030-01-10', '12:00', 2, busy)).toBe('free')
    expect(timeState('2030-01-11', '10:00', 1, busy)).toBe('free') // other day
  })
})
