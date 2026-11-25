import type { Instructor } from './types'

/** The same name in any case, with or without accents or extra spaces
 *  (same rule as public.instructor_key in the database). */
export function instructorKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** An instructor already saved with this name (active ones first). */
export function findInstructorByName(list: Instructor[] | undefined, name: string, exceptId?: string): Instructor | undefined {
  const key = instructorKey(name)
  if (!key) return undefined
  return (list ?? [])
    .filter((i) => i.id !== exceptId && instructorKey(i.full_name) === key)
    .sort((a, b) => Number(b.active) - Number(a.active))[0]
}
