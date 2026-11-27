import { describe, expect, it } from 'vitest'
import { countryOf, joinPhone, validPhone } from '../components/PhoneInput'
import { waNumber } from './whatsapp'

describe('WhatsApp number with the country chosen', () => {
  it('Argentina gets +54 9 (WhatsApp needs the 9), never Brazil', () => {
    expect(joinPhone('AR', '221 572-7583')).toBe('+54 9 2215727583')
    expect(waNumber(joinPhone('AR', '221 572-7583'))).toBe('5492215727583')
  })
  it('a leading 0 is dropped; a code typed again is not repeated', () => {
    expect(joinPhone('AR', '0221 5727583')).toBe('+54 9 2215727583')
    expect(joinPhone('AR', '+54 9 221 5727583')).toBe('+54 9 2215727583')
    expect(joinPhone('BR', '55 88 99999 1234')).toBe('+55 88999991234')
    expect(joinPhone('BR', '88 99999-1234')).toBe('+55 88999991234')
  })
  it('other countries and the free choice', () => {
    expect(waNumber(joinPhone('US', '201 555 0123'))).toBe('12015550123')
    expect(waNumber(joinPhone('UY', '94 123 456'))).toBe('59894123456')
    expect(joinPhone('OTHER', '+81 90 1234 5678')).toBe('+81 90 1234 5678')
  })
  it('recognises the country of a saved number', () => {
    expect(countryOf('+54 9 2215727583')?.iso).toBe('AR')
    expect(countryOf('+598 94123456')?.iso).toBe('UY')
    expect(countryOf('+55 88999991234')?.iso).toBe('BR')
    expect(countryOf('2215727583')).toBeNull()
  })
  it('needs enough digits besides the code', () => {
    expect(validPhone('+54 9 22')).toBe(false)
    expect(validPhone('+54 9 2215727583')).toBe(true)
    expect(validPhone('')).toBe(false)
  })
})
