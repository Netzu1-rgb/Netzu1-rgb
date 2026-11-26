import { langFromPhone } from './whatsapp'

type Lang = 'es' | 'pt' | 'en'

const DAYS: Record<Lang, string[]> = {
  es: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  pt: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
}

function hoursText(h: number, lang: Lang): string {
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60)
  const t = mm ? `${hh}:${String(mm).padStart(2, '0')}` : String(hh)
  return lang === 'en' ? `${t} h` : `${t} hs`.replace(/hs$/, lang === 'pt' ? 'h' : 'hs')
}

/**
 * The school's WhatsApp message to a student about a class they asked for (a day and
 * hours), in the student's language (or guessed from their number). It proposes the
 * time and the price when the school already wrote them, else asks for them.
 */
export function requestMessage(o: {
  studentName: string; lang?: string | null; phone?: string | null
  date: string; hours: number; time?: string | null; price?: string | null
}): string {
  const lang: Lang = o.lang === 'es' || o.lang === 'pt' || o.lang === 'en' ? o.lang : langFromPhone(o.phone)
  const first = o.studentName.trim().split(/\s+/)[0]
  const [y, m, d] = o.date.split('-').map(Number)
  const day = `${DAYS[lang][new Date(y, m - 1, d).getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  const dur = hoursText(o.hours, lang)
  const both = Boolean(o.time && o.price)
  if (lang === 'pt') {
    return `Olá, ${first}! Aqui é a Truevento Kiteschool. Recebemos seu pedido de aula para ${day} (${dur}).` +
      (o.time ? ` Propomos o horário das ${o.time}.` : ' Qual horário fica melhor para você?') +
      (o.price ? ` O valor é ${o.price} por hora.` : ' Também combinamos o valor por hora.') +
      (both ? ' Está de acordo? Assim que confirmar, reservamos sua aula.' : '')
  }
  if (lang === 'en') {
    return `Hello ${first}! This is Truevento Kiteschool. We received your lesson request for ${day} (${dur}).` +
      (o.time ? ` We suggest ${o.time}.` : ' What time suits you best?') +
      (o.price ? ` The price is ${o.price} per hour.` : ' We will also agree on the price per hour.') +
      (both ? ' Does that work for you? Once you confirm, we will book your lesson.' : '')
  }
  return `¡Hola, ${first}! Te escribimos de Truevento Kiteschool. Recibimos tu pedido de clase para el ${day} (${dur}).` +
    (o.time ? ` Te proponemos el horario de las ${o.time}.` : ' ¿En qué horario te quedaría mejor?') +
    (o.price ? ` El precio es de ${o.price} por hora.` : ' También acordamos el precio por hora.') +
    (both ? ' ¿Estás de acuerdo? Una vez que nos confirmes, reservamos tu clase.' : '')
}

/** Why a class is moved, in the student's language (shown in their app and notification). */
export const RESCHEDULE_REASONS = {
  rain: { label: 'Lluvia', es: 'Pronóstico de lluvia', pt: 'Previsão de chuva', en: 'Rain forecast' },
  noWind: { label: 'Sin viento', es: 'Sin viento suficiente', pt: 'Sem vento suficiente', en: 'Not enough wind' },
  strongWind: { label: 'Viento muy fuerte', es: 'Viento demasiado fuerte', pt: 'Vento forte demais', en: 'Wind too strong' },
  other: { label: 'Otro motivo', es: '', pt: '', en: '' },
} as const
export type RescheduleReason = keyof typeof RESCHEDULE_REASONS

export function studentLang(lang?: string | null, phone?: string | null): Lang {
  return lang === 'es' || lang === 'pt' || lang === 'en' ? lang : langFromPhone(phone)
}

const WHY: Record<Exclude<RescheduleReason, 'other'>, Record<Lang, string>> = {
  rain: { es: 'Por el pronóstico de lluvia', pt: 'Por causa da previsão de chuva', en: 'Because of the rain forecast' },
  noWind: { es: 'Por falta de viento', pt: 'Por falta de vento', en: 'Because there is not enough wind' },
  strongWind: { es: 'Por el viento demasiado fuerte', pt: 'Por causa do vento forte demais', en: 'Because the wind is too strong' },
}

/** WhatsApp message telling the student their class was moved (and why). */
export function rescheduleMessage(o: {
  studentName: string; lang?: string | null; phone?: string | null; date: string; time: string; reason: RescheduleReason
}): string {
  const lang = studentLang(o.lang, o.phone)
  const first = o.studentName.trim().split(/\s+/)[0]
  const [y, m, d] = o.date.split('-').map(Number)
  const day = `${DAYS[lang][new Date(y, m - 1, d).getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  const why = o.reason === 'other' ? null : WHY[o.reason][lang]
  if (lang === 'pt') {
    return `Olá, ${first}! Aqui é a Truevento Kiteschool. ${why ? `${why}, mudamos` : 'Precisamos mudar'} sua aula para ${day} às ${o.time}. Fica bom para você?`
  }
  if (lang === 'en') {
    return `Hello ${first}! This is Truevento Kiteschool. ${why ? `${why}, we moved` : 'We had to move'} your lesson to ${day} at ${o.time}. Does that work for you?`
  }
  return `¡Hola, ${first}! Te escribimos de Truevento Kiteschool. ${why ? `${why}, pasamos` : 'Tuvimos que pasar'} tu clase al ${day} a las ${o.time}. ¿Te queda bien?`
}
