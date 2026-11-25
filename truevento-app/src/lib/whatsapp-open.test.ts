import { afterEach, describe, expect, it, vi } from 'vitest'
import { openWhatsApp } from './whatsapp'

function env(ua: string, visibleAfter = true) {
  const loc = { href: '' }
  const open = vi.fn()
  const listeners: Record<string, () => void> = {}
  vi.stubGlobal('navigator', { userAgent: ua, platform: 'iPhone', maxTouchPoints: 5 })
  vi.stubGlobal('window', { location: loc, open })
  vi.stubGlobal('document', {
    visibilityState: 'visible',
    addEventListener: (k: string, f: () => void) => { listeners[k] = f },
    removeEventListener: vi.fn(),
  })
  return { loc, open, leave: () => { if (!visibleAfter) listeners.visibilitychange?.() } }
}
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15'
const href = 'https://wa.me/5492215451174?text=Hola%2C%20soy%20Ana'

describe('opening WhatsApp', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

  it('on iPhone opens the WhatsApp app directly, no web page', () => {
    vi.useFakeTimers()
    const e = env(IPHONE, false); const ev = { preventDefault: vi.fn() }
    openWhatsApp(ev, href); e.leave(); vi.advanceTimersByTime(1500)
    expect(ev.preventDefault).toHaveBeenCalled()
    expect(e.loc.href).toBe('whatsapp://send?phone=5492215451174&text=Hola%2C%20soy%20Ana')
    expect(e.open).not.toHaveBeenCalled()
  })
  it('on iPhone without WhatsApp falls back to the wa.me page', () => {
    vi.useFakeTimers()
    const e = env(IPHONE, true)
    openWhatsApp({ preventDefault: vi.fn() }, href); vi.advanceTimersByTime(1500)
    expect(e.open).toHaveBeenCalledWith(href, '_blank', 'noopener')
  })
  it('elsewhere the link opens as usual', () => {
    env('Mozilla/5.0 (Linux; Android 14) Chrome/130'); const ev = { preventDefault: vi.fn() }
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130', platform: 'Linux', maxTouchPoints: 5 })
    openWhatsApp(ev, href)
    expect(ev.preventDefault).not.toHaveBeenCalled()
  })
})
