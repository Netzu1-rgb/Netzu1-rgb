export type Role = 'admin' | 'instructor'
export type InstructorKind = 'owner' | 'external'

export interface SchoolSettings {
  id: number
  school_name: string
  currency: string
  setup_completed_at: string | null
}

export interface Profile {
  id: string
  full_name: string | null
  username: string | null
  role: Role | null
  instructor_id: string | null
  active: boolean
}

export interface Instructor {
  id: string
  full_name: string
  phone: string | null
  kind: InstructorKind
  owner_slot: 1 | 2 | null
  hourly_pay: number
  active: boolean
}

export interface Student {
  id: string
  full_name: string
  phone: string | null
  start_date: string
  /** null: signed up in the students app and the school has not set the price yet */
  hourly_rate: number | null
  default_instructor_id: string | null
  notes: string | null
  active: boolean
  weight_kg?: number | null
  experience?: 'none' | 'some' | 'independent' | null
  self_registered?: boolean
  /** language of the students app, for the school's messages */
  lang?: 'es' | 'pt' | 'en' | null
  /** true while it only exists on this device, waiting to sync */
  pending?: boolean
}

export interface ClassRow {
  id: string
  student_id: string
  instructor_id: string
  class_date: string
  hours: number
  student_rate: number
  instructor_rate: number
  instructor_kind: InstructorKind
  total_amount: number
  instructor_pay: number
  school_profit: number
  notes: string | null
  settlement_id: string | null
  created_at: string
  student?: { full_name: string } | null
  instructor?: { full_name: string } | null
  pending?: boolean
}

export interface Settlement {
  id: string
  instructor_id: string
  period_start: string
  period_end: string
  classes_count: number
  total_hours: number
  amount: number
  paid_at: string
  notes: string | null
  created_at: string
  instructor?: { full_name: string } | null
}

export interface NewClassInput {
  id: string
  student_id: string
  instructor_id: string
  class_date: string
  hours: number
  student_rate: number
  instructor_rate?: number
  notes: string | null
}

export interface NewInstructorInput {
  id: string
  full_name: string
  hourly_pay: number
  active: boolean
}

export interface NewStudentInput {
  id: string
  full_name: string
  phone: string | null
  start_date: string
  hourly_rate: number
  default_instructor_id: string | null
  notes: string | null
}

/** A class a student asked for in the students app, waiting for the school. */
export interface ClassRequest {
  id: string
  lesson_date: string
  /** null: the time is agreed with the student on WhatsApp */
  start_time: string | null
  hours: number
  student_note: string | null
  instructor_id: string | null
  created_at: string
  student: Student
}

/** A confirmed class from today on (scheduled in the students app or confirmed from a request). */
export interface UpcomingLesson {
  id: string
  lesson_date: string
  start_time: string
  hours: number
  staff_note: string | null
  instructor_name: string | null
  student: Student
}

/** A student with confirmed classes and no price per hour yet: those classes stay pending. */
export interface PricelessStudent {
  student: Student
  lessons: { id: string; lesson_date: string; start_time: string; hours: number; instructor_name: string | null }[]
}

export const EXPERIENCE_LABEL: Record<string, string> = {
  none: 'Nunca hizo kite',
  some: 'Tomó algunas clases',
  independent: 'Ya navega solo',
}
