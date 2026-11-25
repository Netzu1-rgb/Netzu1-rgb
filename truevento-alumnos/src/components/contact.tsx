import { SCHOOL_WHATSAPP } from './Privacy'
import { waLink } from '../lib/whatsapp'
import { formatHours, longDay, shortTime } from '../lib/format'
import { t } from '../i18n'
import { Icon } from './ui'

/** Who agrees the price with students (the school's owner). */
export const SCHOOL_CONTACT = (import.meta.env.VITE_SCHOOL_CONTACT as string | undefined) ?? 'Victoria'

/** WhatsApp to the school with a message about this class, in the student's language. */
export function schoolMessageLink(o: { me: string; date: string; time: string; hours: number }): string | null {
  return waLink(SCHOOL_WHATSAPP, t('wa.msg', {
    name: SCHOOL_CONTACT, me: o.me, day: longDay(o.date, true), time: shortTime(o.time), hours: formatHours(o.hours),
  }))
}

/** Green WhatsApp button: "Agree on the price with Victoria". */
export function AgreePriceButton({ me, date, time, hours, label = 'wa.agree', className = '' }: {
  me: string; date: string; time: string; hours: number; label?: 'wa.agree' | 'wa.write'; className?: string
}) {
  const href = schoolMessageLink({ me, date, time, hours })
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className={`btn bg-[#1fa855] text-white shadow-[0_8px_20px_-8px_rgba(31,168,85,0.6)] hover:brightness-110 ${className}`}>
      <Icon name="whatsapp" /> {t(label, { name: SCHOOL_CONTACT })}
    </a>
  )
}
