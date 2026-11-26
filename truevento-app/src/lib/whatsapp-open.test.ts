import { describe, expect, it } from 'vitest'
import { platform, whatsAppTargets } from './whatsapp'

const href = 'https://wa.me/5492215451174?text=Hola%2C%20soy%20Ana'
const IPHONE = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15', platform: 'iPhone', maxTouchPoints: 5 }
const IPAD = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 }
const ANDROID = { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130 Mobile', platform: 'Linux armv8l', maxTouchPoints: 5 }
const PC = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130', platform: 'Win32', maxTouchPoints: 0 }

describe('opening WhatsApp without long links', () => {
  it('knows the device', () => {
    expect(platform(IPHONE)).toBe('ios')
    expect(platform(IPAD)).toBe('ios')
    expect(platform(ANDROID)).toBe('android')
    expect(platform(PC)).toBe('desktop')
  })
  it('iPhone: opens the WhatsApp app with the message', () => {
    expect(whatsAppTargets(href, 'ios')).toEqual({ app: 'whatsapp://send?phone=5492215451174&text=Hola%2C%20soy%20Ana', web: href })
  })
  it('Android: opens the WhatsApp app, with the regular page only if it is not installed', () => {
    const t = whatsAppTargets(href, 'android')!
    expect(t.app).toBe(`intent://send?phone=5492215451174&text=Hola%2C%20soy%20Ana#Intent;scheme=whatsapp;S.browser_fallback_url=${encodeURIComponent(href)};end`)
  })
  it('computer: opens WhatsApp Web directly on the chat', () => {
    expect(whatsAppTargets(href, 'desktop')).toEqual({ app: null, web: 'https://web.whatsapp.com/send?phone=5492215451174&text=Hola%2C%20soy%20Ana' })
  })
  it('without a number, WhatsApp asks whom to send it to', () => {
    expect(whatsAppTargets('https://wa.me/?text=Hola', 'ios')!.app).toBe('whatsapp://send?text=Hola')
    expect(whatsAppTargets('https://wa.me/5492215451174', 'desktop')!.web).toBe('https://web.whatsapp.com/send?phone=5492215451174')
  })
  it('other links are left alone', () => {
    expect(whatsAppTargets('https://truevento.com', 'ios')).toBeNull()
  })
})
