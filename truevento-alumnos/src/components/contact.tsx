import { SCHOOL_WHATSAPP } from './Privacy'
import { openWhatsApp, waLink } from '../lib/whatsapp'
import { formatHours, longDay } from '../lib/format'
import { t } from '../i18n'
import type { Key } from '../i18n/messages'
import { Icon } from './ui'

/** WhatsApp to the school with a message about this class, in the student's language. */
export function schoolMessageLink(o: { me: string; date: string; hours: number; lang?: string }): string | null {
  return waLink(SCHOOL_WHATSAPP, t('wa.msg', {
    me: o.me, day: longDay(o.date), hours: formatHours(o.hours), classLang: t(`classLang.in.${o.lang === 'pt' || o.lang === 'en' ? o.lang : 'es'}` as Key),
  }))
}

/** Green WhatsApp button to the school: "Agree on the price on WhatsApp". */
export function AgreePriceButton({ me, date, hours, lang, label = 'wa.agree', className = '' }: {
  me: string; date: string; hours: number; lang?: string; label?: 'wa.agree' | 'wa.write'; className?: string
}) {
  const href = schoolMessageLink({ me, date, hours, lang })
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, href)}
      className={`btn bg-[#11803f] text-white shadow-[0_8px_20px_-8px_rgba(17,128,63,0.55)] hover:brightness-110 ${className}`}>
      <Icon name="whatsapp" /> {t(label)}
    </a>
  )
}

// what the school writes to a student, in the student's language
const TO_STUDENT = {
  es: 'Hola {name}, te escribimos de TRUEVENTO Kiteschool por tu clase del {day}.',
  pt: 'Olá {name}, aqui é da TRUEVENTO Kiteschool, sobre a sua aula do dia {day}.',
  en: 'Hi {name}, this is TRUEVENTO Kiteschool about your lesson on {day}.',
}

/** For the school: WhatsApp to the number the student saved in their profile. */
export function WriteToStudentButton({ name, phone, lang, date, className = '' }: {
  name: string; phone: string | null | undefined; lang?: string | null; date: string; className?: string
}) {
  const [, m, d] = date.split('-')
  const text = TO_STUDENT[lang === 'pt' || lang === 'en' ? lang : 'es']
    .replace('{name}', name.trim().split(/\s+/)[0] || name).replace('{day}', `${d}/${m}`)
  const href = waLink(phone, text)
  if (!href) return null
  return (
    <a href={href} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, href)}
      className={`btn bg-[#11803f] text-white shadow-[0_8px_20px_-8px_rgba(17,128,63,0.55)] hover:brightness-110 ${className}`}
      aria-label={t('wa.toStudentAria', { name })}>
      <Icon name="whatsapp" /> {t('wa.toStudent')}
    </a>
  )
}
