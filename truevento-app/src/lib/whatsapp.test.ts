import { describe, expect, it } from 'vitest'
import { langFromPhone, waLink, waNumber } from './whatsapp'

describe('WhatsApp numbers', () => {
  it('keeps numbers with a country code', () => {
    expect(waNumber('+54 9 221 545-1174')).toBe('5492215451174')
    expect(waNumber('+55 (88) 99999-1234')).toBe('5588999991234')
    expect(waNumber('0044 7700 900123')).toBe('447700900123')
  })
  it('adds Brazil to a number written with only the DDD', () => {
    expect(waNumber('(88) 99999-1234')).toBe('5588999991234')
    expect(waNumber('088 9999-1234')).toBe('558899991234')
  })
  it('refuses what cannot be a phone', () => {
    expect(waNumber('')).toBeNull()
    expect(waNumber(null)).toBeNull()
    expect(waNumber('1234')).toBeNull()
  })
  it('builds the link with the message', () => {
    expect(waLink('+54 9 221 545-1174', 'Hola, ¿precio?')).toBe('https://wa.me/5492215451174?text=Hola%2C%20%C2%BFprecio%3F')
    expect(waLink('', 'x')).toBeNull()
  })
  it('guesses the language from the country', () => {
    expect(langFromPhone('+55 88 99999-1234')).toBe('pt')
    expect(langFromPhone('+54 9 221 545-1174')).toBe('es')
    expect(langFromPhone('+44 7700 900123')).toBe('en')
  })
})
