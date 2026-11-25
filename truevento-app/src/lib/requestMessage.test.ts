import { describe, expect, it } from 'vitest'
import { requestMessage } from './requestMessage'

const base = { studentName: 'Julia Paz', date: '2026-11-28', hours: 1.5 }

describe('WhatsApp message to the student', () => {
  it('asks for the time and the price when nothing is set yet', () => {
    expect(requestMessage({ ...base, lang: 'es' })).toBe(
      '¡Hola, Julia! Te escribimos de Truevento Kiteschool. Recibimos tu pedido de clase para el sábado 28/11 (1:30 hs). ¿En qué horario te quedaría mejor? También acordamos el precio por hora.')
  })
  it('proposes the time and the price in the student language', () => {
    expect(requestMessage({ ...base, lang: 'pt', time: '15:00', price: 'R$ 220,00' })).toBe(
      'Olá, Julia! Aqui é a Truevento Kiteschool. Recebemos seu pedido de aula para sábado 28/11 (1:30 h). Propomos o horário das 15:00. O valor é R$ 220,00 por hora. Está de acordo? Assim que confirmar, reservamos sua aula.')
    expect(requestMessage({ ...base, lang: 'en', hours: 2, time: '10:00' })).toBe(
      'Hello Julia! This is Truevento Kiteschool. We received your lesson request for Saturday 28/11 (2 h). We suggest 10:00. We will also agree on the price per hour.')
  })
  it('guesses the language from the number when unknown', () => {
    expect(requestMessage({ ...base, phone: '+55 88 99999-1111' })).toMatch(/^Olá, Julia!/)
    expect(requestMessage({ ...base, phone: '+54 9 11 5555-2222' })).toMatch(/^¡Hola, Julia!/)
  })
})
