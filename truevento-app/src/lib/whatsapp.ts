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
