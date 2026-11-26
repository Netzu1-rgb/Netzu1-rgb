import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SKILLS } from './messages'

// the school's path as the database creates it (Spanish), from the migration
const sql = readFileSync(new URL('../../../truevento-app/supabase/migrations/20261124000000_students_app.sql', import.meta.url), 'utf8')
const seed = sql.slice(sql.indexOf('insert into public.skills'), sql.indexOf(';', sql.indexOf('insert into public.skills')))
const steps = [...seed.matchAll(/\((\d), (\d+), '((?:[^']|'')+)', '((?:[^']|'')+)'\)/g)].map((m) => ({ level: +m[1], name: m[3].replace(/''/g, "'") }))

describe("the school's learning path", () => {
  it('has the 25 steps in 4 levels', () => {
    expect(steps).toHaveLength(25)
    expect([1, 2, 3, 4].map((l) => steps.filter((s) => s.level === l).length)).toEqual([7, 7, 4, 7])
    expect(steps[0].name).toBe('Reconocimiento del spot')
    expect(steps[24].name).toBe('Relanzamiento y aterrizaje por el alumno')
  })
  it('every step has its Portuguese and English names', () => {
    for (const s of steps) {
      expect(SKILLS[s.name], s.name).toBeDefined()
      expect(SKILLS[s.name].pt[0]).toBeTruthy()
      expect(SKILLS[s.name].en[0]).toBeTruthy()
    }
    expect(Object.keys(SKILLS)).toHaveLength(25)
  })
  it('keeps the words kiters use in every country', () => {
    expect(SKILLS['Body drag'].pt[0]).toBe('Body drag')
    expect(SKILLS['Waterstart con tabla'].pt[0]).toBe('Waterstart com prancha')
    expect(SKILLS['Orzar'].pt[0]).toBe('Orçar')
    expect(JSON.stringify(SKILLS)).not.toMatch(/pipa|cometa/i)
  })
})
