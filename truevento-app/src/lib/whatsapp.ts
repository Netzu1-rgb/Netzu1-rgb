// WhatsApp links (wa.me) with a message ready to send.

/**
 * The number as wa.me wants it: country code and number, digits only.
 * "+54 9 221 545-1174" → "5492215451174". Without a country code, a Brazilian
 * number (DDD + 8 or 9 digits) gets 55 in front.
 */
export function waNumber(phone: string | null | undefined): string | null {
  const raw = (phone ?? '').trim()
  let digits = raw.replace(/\D/g, '')
  if (raw.startsWith('00')) digits = digits.slice(2)
  else if (!raw.startsWith('+') && (digits.length === 10 || digits.length === 11)) digits = '55' + digits.replace(/^0/, '')
  return digits.length >= 10 ? digits : null
}

export function waLink(phone: string | null | undefined, text?: string): string | null {
  const n = waNumber(phone)
  if (!n) return null
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** A good guess of a person's language from their number (+55 Brazil, Spanish-speaking countries). */
export function langFromPhone(phone: string | null | undefined): 'es' | 'pt' | 'en' {
  const n = waNumber(phone) ?? ''
  if (n.startsWith('55')) return 'pt'
  if (/^(54|598|595|56|57|58|51|52|591|593|34|506|507|502|503|504|505|53|1809)/.test(n)) return 'es'
  return 'en'
}

/** What the demo shows instead of leaving the page (see WhatsAppPreview). */
export const WA_PREVIEW_EVENT = 'tv-whatsapp-preview'

type Platform = 'ios' | 'android' | 'desktop'
export function platform(nav: { userAgent: string; platform?: string; maxTouchPoints?: number } = navigator): Platform {
  if (/iphone|ipad|ipod/i.test(nav.userAgent) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1)) return 'ios'
  if (/android/i.test(nav.userAgent)) return 'android'
  return 'desktop'
}

/** Where each device goes: the WhatsApp app on phones, WhatsApp Web on computers. */
export function whatsAppTargets(href: string, where: Platform): { app: string | null; web: string } | null {
  const m = /^https:\/\/wa\.me\/(\d*)(?:\?text=(.*))?$/.exec(href)
  if (!m) return null
  const [, phone, text] = m
  // without a number, WhatsApp asks whom to send it to
  const q = [phone && `phone=${phone}`, text && `text=${text}`].filter(Boolean).join('&')
  if (where === 'ios') return { app: `whatsapp://send?${q}`, web: href }
  if (where === 'android') {
    // the WhatsApp app (or WhatsApp Business); if none is installed, Chrome opens the fallback
    return { app: `intent://send?${q}#Intent;scheme=whatsapp;S.browser_fallback_url=${encodeURIComponent(href)};end`, web: href }
  }
  return { app: null, web: `https://web.whatsapp.com/send?${q}` }
}

/**
 * Opens the chat with the message ready and never shows a long link: on iPhone and
 * Android the WhatsApp app opens straight away; on a computer, WhatsApp Web opens on
 * the chat. In the demo, a preview of the message is shown instead.
 */
export function openWhatsApp(e: { preventDefault: () => void }, href: string) {
  const where = platform()
  const t = whatsAppTargets(href, where)
  if (!t) return // not a WhatsApp link: open it as usual
  e.preventDefault()
  if (import.meta.env.VITE_DEMO === '1') {
    const m = /^https:\/\/wa\.me\/(\d*)(?:\?text=(.*))?$/.exec(href)!
    window.dispatchEvent(new CustomEvent(WA_PREVIEW_EVENT, { detail: { phone: m[1], text: m[2] ? decodeURIComponent(m[2]) : '' } }))
    return
  }
  if (!t.app) {
    window.open(t.web, '_blank', 'noopener')
    return
  }
  // WhatsApp opening (or the phone asking "Open in WhatsApp?") hides or blurs the page
  let left = false
  const onLeave = () => { left = true }
  document.addEventListener('visibilitychange', onLeave, { once: true })
  window.addEventListener('blur', onLeave, { once: true })
  window.addEventListener('pagehide', onLeave, { once: true })
  window.location.href = t.app
  // nothing happened: WhatsApp is not on this iPhone, open the regular chat page
  setTimeout(() => {
    document.removeEventListener('visibilitychange', onLeave)
    window.removeEventListener('blur', onLeave)
    window.removeEventListener('pagehide', onLeave)
    if (!left && document.visibilityState === 'visible' && where === 'ios') window.open(t.web, '_blank', 'noopener')
  }, 2500)
}
