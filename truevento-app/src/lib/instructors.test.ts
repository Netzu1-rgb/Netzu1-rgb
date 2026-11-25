import { describe, expect, it } from 'vitest'
import { findInstructorByName, instructorKey } from './instructors'
import type { Instructor } from './types'

const ins = (id: string, full_name: string, active = true) => ({ id, full_name, active, kind: 'external', hourly_pay: 100 }) as Instructor

describe('instructors with the same name', () => {
  it('ignores case, accents and spaces', () => {
    expect(instructorKey('  Sebastián   Comasco ')).toBe('sebastian comasco')
    expect(instructorKey('FRAN')).toBe(instructorKey('fran'))
    expect(instructorKey('João')).toBe('joao')
  })
  it('finds the saved instructor, preferring an active one', () => {
    const list = [ins('a', 'Fran', false), ins('b', 'fran ', true), ins('c', 'Lucas')]
    expect(findInstructorByName(list, 'FRAN')?.id).toBe('b')
    expect(findInstructorByName(list, 'Franco')).toBeUndefined()
    expect(findInstructorByName(list, '')).toBeUndefined()
    expect(findInstructorByName(list, 'Lucas', 'c')).toBeUndefined()
  })
})
