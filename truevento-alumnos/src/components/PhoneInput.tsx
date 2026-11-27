import { useEffect, useState } from 'react'
import { getLang, t } from '../i18n'

/**
 * WhatsApp number with the country chosen from a list: the code is put in front, so a
 * number is never taken as being from another country. Saved as "+<code> <number>".
 * Argentina's mobile numbers need a 9 after +54 for WhatsApp, so it is part of its code.
 */
export const COUNTRIES: { iso: string; flag: string; name: string; code: string; example: string }[] = [
  { iso: 'BR', flag: '🇧🇷', name: 'Brasil', code: '+55', example: '88 99999-1234' },
  { iso: 'AR', flag: '🇦🇷', name: 'Argentina', code: '+54 9', example: '221 555-1234' },
  { iso: 'UY', flag: '🇺🇾', name: 'Uruguay', code: '+598', example: '94 123 456' },
  { iso: 'CL', flag: '🇨🇱', name: 'Chile', code: '+56', example: '9 6123 4567' },
  { iso: 'PY', flag: '🇵🇾', name: 'Paraguay', code: '+595', example: '981 123456' },
  { iso: 'CO', flag: '🇨🇴', name: 'Colombia', code: '+57', example: '321 1234567' },
  { iso: 'PE', flag: '🇵🇪', name: 'Perú', code: '+51', example: '912 345 678' },
  { iso: 'MX', flag: '🇲🇽', name: 'México', code: '+52', example: '55 1234 5678' },
  { iso: 'ES', flag: '🇪🇸', name: 'España', code: '+34', example: '612 34 56 78' },
  { iso: 'PT', flag: '🇵🇹', name: 'Portugal', code: '+351', example: '912 345 678' },
  { iso: 'IT', flag: '🇮🇹', name: 'Italia', code: '+39', example: '312 345 6789' },
  { iso: 'FR', flag: '🇫🇷', name: 'France', code: '+33', example: '6 12 34 56 78' },
  { iso: 'DE', flag: '🇩🇪', name: 'Deutschland', code: '+49', example: '1512 3456789' },
  { iso: 'NL', flag: '🇳🇱', name: 'Nederland', code: '+31', example: '6 12345678' },
  { iso: 'CH', flag: '🇨🇭', name: 'Schweiz', code: '+41', example: '78 123 45 67' },
  { iso: 'GB', flag: '🇬🇧', name: 'United Kingdom', code: '+44', example: '7700 900123' },
  { iso: 'US', flag: '🇺🇸', name: 'USA / Canada', code: '+1', example: '201 555 0123' },
  { iso: 'IL', flag: '🇮🇱', name: 'Israel', code: '+972', example: '50 123 4567' },
]

const OTHER = 'OTHER'

/** The country of a saved number (the longest code that matches), or null. */
export function countryOf(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits.startsWith('+')) return null
  return [...COUNTRIES]
    .sort((a, b) => b.code.replace(/\D/g, '').length - a.code.replace(/\D/g, '').length)
    .find((c) => digits.startsWith('+' + c.code.replace(/\D/g, ''))) ?? null
}

/** A first guess of the person's country: the phone's region, else the app's language. */
export function guessCountry(): string {
  const regions = (typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [])
    .map((l) => (l.split('-')[1] ?? '').toUpperCase())
  const found = regions.find((r) => COUNTRIES.some((c) => c.iso === r))
  if (found) return found
  return getLang() === 'pt' ? 'BR' : getLang() === 'es' ? 'AR' : 'US'
}

/** The number to save: the country code and the digits typed (without a leading 0). */
export function joinPhone(iso: string, national: string): string {
  const raw = national.trim()
  if (iso === OTHER || !iso) return raw
  const c = COUNTRIES.find((x) => x.iso === iso)!
  let digits = raw.replace(/\D/g, '').replace(/^0+/, '')
  // someone who types the code again: do not repeat it
  const code = c.code.replace(/\D/g, '')
  if (digits.startsWith(code) && digits.length > code.length + 7) digits = digits.slice(code.length)
  if (iso === 'AR' && digits.startsWith('54')) digits = digits.slice(2).replace(/^9/, '')
  return digits ? `${c.code} ${digits}` : ''
}

/** Splits a saved number into country and the rest, to edit it. */
function splitPhone(phone: string): { iso: string; national: string } {
  // a new number: no country chosen, the person has to pick it
  if (!phone.trim()) return { iso: '', national: '' }
  const c = countryOf(phone)
  if (c) return { iso: c.iso, national: phone.replace(/[^\d+]/g, '').slice(1 + c.code.replace(/\D/g, '').length) }
  return phone.trim().startsWith('+') ? { iso: OTHER, national: phone.trim() } : { iso: guessCountry(), national: phone.trim() }
}

export function PhoneInput({ id, value, onChange, required }: {
  id: string; value: string; onChange: (v: string) => void; required?: boolean
}) {
  const [{ iso, national }, setParts] = useState(() => splitPhone(value))
  // a value that changes from outside (e.g. the saved data loading) is shown
  useEffect(() => {
    if (joinPhone(iso, national) !== value) setParts(splitPhone(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const set = (next: { iso: string; national: string }) => {
    // a number typed or pasted with its "+code": choose that country
    if (next.national.trim().startsWith('+')) {
      const c = countryOf(next.national)
      if (c) next = { iso: c.iso, national: next.national.replace(/[^\d+]/g, '').slice(1 + c.code.replace(/\D/g, '').length) }
    }
    setParts(next)
    onChange(joinPhone(next.iso, next.national))
  }
  const c = COUNTRIES.find((x) => x.iso === iso)
  return (
    <div className="flex gap-2">
      <select aria-label={t('phone.country')} value={iso} required
        className={`input w-[8.5rem] shrink-0 px-2 ${iso ? '' : 'text-ink-mute ring-2 ring-amber-400/70'}`}
        onChange={(e) => set({ iso: e.target.value, national })}>
        {!iso && <option value="" disabled>{t('phone.pick')}</option>}
        {COUNTRIES.map((x) => <option key={x.iso} value={x.iso}>{x.flag} {x.code}</option>)}
        <option value={OTHER}>🌐 {t('phone.other')}</option>
      </select>
      <input id={id} className="input min-w-0 flex-1" type="tel" inputMode="tel" autoComplete="tel-national" maxLength={30} required={required}
        placeholder={c ? c.example : '+00 000 000 0000'} value={national}
        onChange={(e) => set({ iso, national: e.target.value })} />
    </div>
  )
}

/** Enough digits besides the country code to be a real number. */
export function validPhone(phone: string): boolean {
  const all = phone.replace(/\D/g, '')
  const c = countryOf(phone)
  const national = c ? all.length - c.code.replace(/\D/g, '').length : all.length
  // always with the country code: a number without it is never valid
  return phone.trim().startsWith('+') && national >= 6
}

/** The message for a wrong number: the country is missing, or the number is too short. */
export function phoneError(phone: string): 'err.country' | 'err.phone' | null {
  if (!phone.trim().startsWith('+')) return phone.replace(/\D/g, '').length ? 'err.country' : 'err.phone'
  return validPhone(phone) ? null : 'err.phone'
}
