import { describe, expect, it } from 'vitest'
import { requestMessage } from './requestMessage'

const base = { studentName: 'Julia Paz', date: '2026-11-28', time: '15:00', hours: 1.5 }

describe('WhatsApp message to the student', () => {
  it('is in the student language, with the price', () => {
    expect(requestMessage({ ...base, lang: 'pt', price: 'R$ 220,00' })).toBe(
      'Olá, Julia! Aqui é a Truevento Kiteschool. Recebemos seu pedido de aula para sábado 28/11 às 15:00 (1:30 h). O valor é R$ 220,00 por hora. Está de acordo? Assim que confirmar, reservamos sua aula.')
    expect(requestMessage({ ...base, lang: 'es', price: 'R$ 220,00' })).toContain('El precio es de R$ 220,00 por hora. ¿Estás de acuerdo?')
    expect(requestMessage({ ...base, lang: 'en', hours: 2 })).toBe(
      "Hello Julia! This is Truevento Kiteschool. We received your lesson request for Saturday 28/11 at 15:00 (2 h). We would like to agree on the price per hour with you.")
  })
  it('guesses the language from the number when unknown', () => {
    expect(requestMessage({ ...base, phone: '+55 88 99999-1111' })).toMatch(/^Olá, Julia!/)
    expect(requestMessage({ ...base, phone: '+54 9 11 5555-2222' })).toMatch(/^¡Hola, Julia! Te escribimos de Truevento Kiteschool\..*sábado 28\/11 a las 15:00 \(1:30 hs\)\. Queremos acordar/)
  })
})
