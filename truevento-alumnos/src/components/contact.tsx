import { SCHOOL_WHATSAPP } from './Privacy'
import { openWhatsApp, waLink } from '../lib/whatsapp'
import { formatHours, longDay } from '../lib/format'
import { t } from '../i18n'
import { Icon } from './ui'

/** WhatsApp to the school with a message about this class, in the student's language. */
export function schoolMessageLink(o: { me: string; date: string; hours: number }): string | null {
  return waLink(SCHOOL_WHATSAPP, t('wa.msg', {
    me: o.me, day: longDay(o.date), hours: formatHours(o.hours),
  }))
}

/** Green WhatsApp button to the school: "Agree on the price on WhatsApp". */
export function AgreePriceButton({ me, date, hours, label = 'wa.agree', className = '' }: {
  me: string; date: string; hours: number; label?: 'wa.agree' | 'wa.write'; className?: string
}) {
  const href = schoolMessageLink({ me, date, hours })
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, href)}
      className={`btn bg-[#11803f] text-white shadow-[0_8px_20px_-8px_rgba(17,128,63,0.55)] hover:brightness-110 ${className}`}>
      <Icon name="whatsapp" /> {t(label)}
    </a>
  )
}
