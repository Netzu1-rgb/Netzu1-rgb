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

import { phoneError } from '../components/PhoneInput'

describe('the country is required', () => {
  it('a number without its country asks for the country', () => {
    expect(phoneError('221 572-7583')).toBe('err.country')
    expect(phoneError('')).toBe('err.phone')
    expect(phoneError('+54 9 22')).toBe('err.phone')
    expect(phoneError('+54 9 2215727583')).toBeNull()
  })
})

import { detectBrowser } from './pwa'

describe('which phone and browser, for the install guide', () => {
  const ios = (v: string, os = '18_6') => `Mozilla/5.0 (iPhone; CPU iPhone OS ${os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v} Mobile/15E148 Safari/604.1`
  it('tells the iPhone versions and browsers apart', () => {
    expect(detectBrowser(ios('26.0'))).toBe('ios26')
    expect(detectBrowser(ios('17.5', '17_5'))).toBe('ios18')
    expect(detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1')).toBe('ios-chrome')
    expect(detectBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0')).toBe('in-app')
    expect(detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15', 5, 'MacIntel')).toBe('ipad')
    expect(detectBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36')).toBe('android')
    expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36', 0, 'Win32')).toBe('desktop')
  })
})

describe('detectBrowser on iOS 26 (frozen "OS 18_6") and inside other apps', () => {
  const ios = (rest: string) => `Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${rest}`
  it('reads Safari\'s own version', () => {
    expect(detectBrowser(ios('Version/26.1 Mobile/15E148 Safari/604.1'), 5, 'iPhone')).toBe('ios26')
    expect(detectBrowser(ios('Version/18.6 Mobile/15E148 Safari/604.1'), 5, 'iPhone')).toBe('ios18')
  })
  it('an app\'s own browser (no "Safari/") cannot install', () => {
    expect(detectBrowser(ios('Mobile/15E148'), 5, 'iPhone')).toBe('in-app')
  })
})
