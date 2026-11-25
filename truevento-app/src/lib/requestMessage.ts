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
 * The school's WhatsApp message to a student about a class they asked for, in the
 * student's language (or guessed from their number), with the price when it is known.
 */
export function requestMessage(o: {
  studentName: string; lang?: string | null; phone?: string | null; from: string
  date: string; time: string; hours: number; price?: string | null
}): string {
  const lang: Lang = o.lang === 'es' || o.lang === 'pt' || o.lang === 'en' ? o.lang : langFromPhone(o.phone)
  const first = o.studentName.trim().split(/\s+/)[0]
  const [y, m, d] = o.date.split('-').map(Number)
  const day = `${DAYS[lang][new Date(y, m - 1, d).getDay()]} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
  const dur = hoursText(o.hours, lang)
  if (lang === 'pt') {
    return `Oi ${first}! Sou ${o.from}, da Truevento Kiteschool. Recebi seu pedido de aula para ${day} às ${o.time} (${dur}). ` +
      (o.price ? `O valor é ${o.price} por hora. Está bom pra você? Se confirmar, reservo sua aula.` : 'Vamos combinar o valor por hora?')
  }
  if (lang === 'en') {
    return `Hi ${first}! I'm ${o.from} from Truevento Kiteschool. I got your lesson request for ${day} at ${o.time} (${dur}). ` +
      (o.price ? `The price is ${o.price} per hour. Is that OK for you? If you confirm, I'll book your lesson.` : 'Shall we agree on the price per hour?')
  }
  return `¡Hola ${first}! Soy ${o.from}, de Truevento Kiteschool. Recibí tu pedido de clase para el ${day} a las ${o.time} (${dur}). ` +
    (o.price ? `El precio es ${o.price} por hora. ¿Te parece bien? Si confirmás, te reservo la clase.` : '¿Acordamos el precio por hora?')
}
