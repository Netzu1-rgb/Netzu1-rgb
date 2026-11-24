export type Role = 'admin' | 'instructor' | 'student'

export interface Me {
  role: Role | null
  full_name: string | null
  student_id: string | null
  instructor_id: string | null
  school_name: string
}

export type LessonStatus = 'requested' | 'confirmed' | 'cancelled' | 'done'

export interface Lesson {
  id: string
  student_id: string
  student_name: string
  instructor_id: string | null
  instructor_name: string | null
  lesson_date: string // YYYY-MM-DD
  start_time: string // HH:MM[:SS]
  hours: number
  status: LessonStatus
  student_note: string | null
  staff_note: string | null
  created_at: string
  /** staff only: the school has not set this student's price yet */
  price_pending?: boolean
}

export interface BusySlot {
  lesson_date: string
  start_time: string
  hours: number
}

export interface Person {
  id: string
  full_name: string
}

export interface Skill {
  id: string
  level: number
  position: number
  name: string
  description: string | null
}

export type SkillStatus = 'learning' | 'done'

export interface StudentSkill {
  student_id: string
  skill_id: string
  status: SkillStatus
  updated_at: string
}

export interface LessonNote {
  id: string
  student_id: string
  instructor_id: string | null
  body: string
  created_at: string
}

export interface Announcement {
  id: string
  student_id: string | null
  title: string
  body: string | null
  author_name: string | null
  created_by: string | null
  created_at: string
}

export type Experience = 'none' | 'some' | 'independent'
export const EXPERIENCE: { value: Experience; label: string }[] = [
  { value: 'none', label: 'Nunca hice kite' },
  { value: 'some', label: 'Tomé algunas clases' },
  { value: 'independent', label: 'Ya navego solo' },
]

export interface PersonalData {
  full_name: string
  phone: string
  weight_kg: number | null
  experience: Experience | null
}

export interface StudentSummary {
  full_name: string
  phone: string | null
  weight_kg: number | null
  experience: Experience | null
  start_date: string
  hours: number
  classes: number
  last_class: string | null
}

export interface InvitePreview {
  kind: 'student' | 'instructor'
  first_name: string
}

export const LEVEL_NAMES: Record<number, string> = {
  1: 'Nivel 1 · Control del kite',
  2: 'Nivel 2 · En el agua',
  3: 'Nivel 3 · Arriba de la tabla',
  4: 'Nivel 4 · Independiente',
}
export const levelName = (n: number) => LEVEL_NAMES[n] ?? `Nivel ${n}`
