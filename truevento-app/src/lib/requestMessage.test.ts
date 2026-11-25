import { describe, expect, it } from 'vitest'
import { requestMessage } from './requestMessage'

const base = { studentName: 'Julia Paz', from: 'Victoria', date: '2026-11-28', time: '15:00', hours: 1.5 }

describe('WhatsApp message to the student', () => {
  it('is in the student language, with the price', () => {
    expect(requestMessage({ ...base, lang: 'pt', price: 'R$ 220,00' })).toBe(
      'Oi Julia! Sou Victoria, da Truevento Kiteschool. Recebi seu pedido de aula para sábado 28/11 às 15:00 (1:30 h). O valor é R$ 220,00 por hora. Está bom pra você? Se confirmar, reservo sua aula.')
    expect(requestMessage({ ...base, lang: 'es', price: 'R$ 220,00' })).toContain('El precio es R$ 220,00 por hora. ¿Te parece bien?')
    expect(requestMessage({ ...base, lang: 'en', hours: 2 })).toBe(
      "Hi Julia! I'm Victoria from Truevento Kiteschool. I got your lesson request for Saturday 28/11 at 15:00 (2 h). Shall we agree on the price per hour?")
  })
  it('guesses the language from the number when unknown', () => {
    expect(requestMessage({ ...base, phone: '+55 88 99999-1111' })).toMatch(/^Oi Julia!/)
    expect(requestMessage({ ...base, phone: '+54 9 11 5555-2222' })).toMatch(/^¡Hola Julia!.*sábado 28\/11 a las 15:00 \(1:30 hs\)\. ¿Acordamos/)
  })
})
