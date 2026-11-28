import { describe, expect, it } from 'vitest'
import { addDays, endTime, formatHours, normalizeCode } from './format'
import { compass } from './wind'
import { timeState } from '../components/SlotPicker'
import { dbMessage, setLanguage, t } from '../i18n'

setLanguage('es')

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
    expect(normalizeCode('Admin7')).toBe('ADMIN7')
    expect(normalizeCode('abcdefg')).toBe('ABCDEFG')
    expect(normalizeCode('ABCD-EFGH-XX')).toBe('ABCD-EFGH')
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

describe('languages', () => {
  it('translates texts, units and database messages', () => {
    setLanguage('pt')
    expect(formatHours(1.5)).toBe('1:30 h')
    expect(t('home.hello', { name: 'Julia' })).toBe('Olá, Julia!')
    expect(dbMessage('Ese horario ya está reservado. Elegí otro.')).toBe('Esse horário já está reservado. Escolha outro.')
    expect(compass(270)).toBe('O')
    setLanguage('en')
    expect(dbMessage('Falta el precio por hora de Julia Paz: lo pone la escuela en la app de gestión (Solicitudes).'))
      .toBe("Julia Paz's price per hour is missing: the school sets it in the management app (Requests).")
    expect(compass(270)).toBe('W')
    setLanguage('es')
    expect(dbMessage('Clase inexistente.')).toBe('Clase inexistente.')
  })
})

describe("the school's day", () => {
  it('is the day in Ceará, wherever the phone is', async () => {
    const { vi } = await import('vitest')
    const { today, schoolMinutesNow } = await import('./format')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-26T02:30:00Z')) // 23:30 of the 25th in Ceará, already the 26th in Europe
    expect(today()).toBe('2026-11-25')
    expect(schoolMinutesNow()).toBe(23 * 60 + 30)
    vi.setSystemTime(new Date('2026-11-26T03:10:00Z')) // 00:10 of the 26th in Ceará
    expect(today()).toBe('2026-11-26')
    vi.useRealTimers()
  })
})

describe('neutral Spanish for database messages', () => {
  it('turns voseo into tú', async () => {
    const { neutralSpanish } = await import('../i18n')
    expect(neutralSpanish('Ya tenés muchas solicitudes pendientes. Esperá a que la escuela responda.')).toBe('Ya tienes muchas solicitudes pendientes. Espera a que la escuela responda.')
    expect(neutralSpanish('Solo podés confirmar clases que vas a dar vos.')).toBe('Solo puedes confirmar clases que vas a dar tú.')
    expect(neutralSpanish('Elegí otro.')).toBe('Elige otro.')
  })
})
