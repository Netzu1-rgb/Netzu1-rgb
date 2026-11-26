import { supabase } from './supabase'
import { enqueue } from './offline'
import { isNetworkError } from './errors'
import type {
  ClassRequest, ClassRow, PricelessStudent, UpcomingLesson, Instructor, NewClassInput, NewInstructorInput, NewStudentInput, Profile, SchoolSettings, Settlement, Student,
} from './types'

// All reads and writes go through here. Every function throws on error so callers
// can show one consistent message.

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

const CLASS_COLUMNS =
  'id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate, instructor_kind, ' +
  'total_amount, instructor_pay, school_profit, notes, settlement_id, created_at, ' +
  'student:students(full_name), instructor:instructors(full_name)'

const MAX_ROWS = 10000

// ------------------------------------------------------------------ setup & settings

export async function fetchSetupStatus(): Promise<{ completed: boolean; school_name: string }> {
  return check(await supabase.rpc('setup_status')) as { completed: boolean; school_name: string }
}

export async function fetchSettings(): Promise<SchoolSettings | null> {
  return check(await supabase.from('school_settings').select('*').maybeSingle())
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  return check(await supabase.from('profiles').select('*').eq('id', userId).maybeSingle())
}

export async function setupSchool(input: {
  school_name: string; owner1: string; owner2: string; currency: string; me: 1 | 2
}) {
  check(await supabase.rpc('setup_school', {
    p_school_name: input.school_name, p_owner1: input.owner1, p_owner2: input.owner2,
    p_currency: input.currency, p_me: input.me,
  }))
}

export async function updateSettings(input: { school_name: string; currency: string; owner1: string; owner2: string }) {
  check(await supabase.rpc('update_school_settings', {
    p_school_name: input.school_name, p_currency: input.currency, p_owner1: input.owner1, p_owner2: input.owner2,
  }))
}

// ------------------------------------------------------------------ instructors

export async function fetchInstructors(): Promise<Instructor[]> {
  const rows = check(await supabase.from('instructors').select('*').order('owner_slot', { nullsFirst: false })
    .order('full_name')) as Instructor[]
  return rows.map((r) => ({ ...r, hourly_pay: Number(r.hourly_pay) }))
}

export async function saveInstructor(input: Partial<Instructor> & { full_name: string }) {
  const payload = {
    full_name: input.full_name.trim(),
    phone: input.phone?.trim() || null,
    hourly_pay: input.hourly_pay ?? 0,
    active: input.active ?? true,
  }
  if (input.id) check(await supabase.from('instructors').update(payload).eq('id', input.id))
  else check(await supabase.from('instructors').insert(payload))
}

/** Creates an external instructor from the class form (admins). Queued when offline. */
export async function createInstructor(input: NewInstructorInput, userId: string): Promise<SaveResult> {
  const { error } = await supabase.from('instructors').insert(input)
  if (!error || error.code === '23505') return 'saved'
  if (isNetworkError(error)) {
    await enqueue('instructor', input, userId)
    return 'queued'
  }
  throw error
}

export async function fetchProfiles(): Promise<Profile[]> {
  return check(await supabase.from('profiles').select('*').order('created_at')) as Profile[]
}

// ------------------------------------------------------------------ students

export async function fetchStudents(): Promise<Student[]> {
  const rows = check(await supabase.from('students').select('*').order('full_name').limit(MAX_ROWS)) as Student[]
  return rows.map(normalizeStudent)
}

const normalizeStudent = (r: Student): Student => ({ ...r, hourly_rate: r.hourly_rate == null ? null : Number(r.hourly_rate) })

export async function fetchStudent(id: string): Promise<Student | null> {
  const row = check(await supabase.from('students').select('*').eq('id', id).maybeSingle()) as Student | null
  return row ? normalizeStudent(row) : null
}

export type SaveResult = 'saved' | 'queued'

export async function createStudent(input: NewStudentInput, userId: string): Promise<SaveResult> {
  const { error } = await supabase.from('students').insert(input)
  if (!error || error.code === '23505') return 'saved'
  if (isNetworkError(error)) {
    await enqueue('student', input, userId)
    return 'queued'
  }
  throw error
}

export async function updateStudent(id: string, input: Partial<Omit<NewStudentInput, 'id'>> & { active?: boolean }) {
  check(await supabase.from('students').update(input).eq('id', id))
}

// ------------------------------------------------------------------ classes

function normalizeClass(r: ClassRow): ClassRow {
  return {
    ...r,
    hours: Number(r.hours), student_rate: Number(r.student_rate), instructor_rate: Number(r.instructor_rate),
    total_amount: Number(r.total_amount), instructor_pay: Number(r.instructor_pay), school_profit: Number(r.school_profit),
  }
}

export interface ClassFilter {
  from?: string
  to?: string
  instructorId?: string
  studentId?: string
  unsettledOnly?: boolean
  settlementId?: string
}

export async function fetchClasses(f: ClassFilter = {}): Promise<ClassRow[]> {
  let q = supabase.from('classes').select(CLASS_COLUMNS)
  if (f.from) q = q.gte('class_date', f.from)
  if (f.to) q = q.lte('class_date', f.to)
  if (f.instructorId) q = q.eq('instructor_id', f.instructorId)
  if (f.studentId) q = q.eq('student_id', f.studentId)
  if (f.unsettledOnly) q = q.is('settlement_id', null)
  if (f.settlementId) q = q.eq('settlement_id', f.settlementId)
  const rows = check(await q.order('class_date', { ascending: false }).order('created_at', { ascending: false })
    .limit(MAX_ROWS)) as unknown as ClassRow[]
  return rows.map(normalizeClass)
}

export async function fetchClass(id: string): Promise<ClassRow | null> {
  const row = check(await supabase.from('classes').select(CLASS_COLUMNS).eq('id', id).maybeSingle()) as unknown as ClassRow | null
  return row ? normalizeClass(row) : null
}

/** Unpaid work of external instructors, all dates. */
export async function fetchPendingPayouts(): Promise<Pick<ClassRow, 'instructor_id' | 'instructor_pay' | 'hours'>[]> {
  const rows = check(await supabase.from('classes').select('instructor_id, instructor_pay, hours')
    .is('settlement_id', null).eq('instructor_kind', 'external').limit(MAX_ROWS)) as Pick<ClassRow, 'instructor_id' | 'instructor_pay' | 'hours'>[]
  return rows.map((r) => ({ ...r, instructor_pay: Number(r.instructor_pay), hours: Number(r.hours) }))
}

/** Hours and amounts per student (for the students list). */
export async function fetchStudentTotals(): Promise<Pick<ClassRow, 'student_id' | 'hours' | 'total_amount' | 'class_date'>[]> {
  return check(await supabase.from('classes').select('student_id, hours, total_amount, class_date').limit(MAX_ROWS * 5)) as
    Pick<ClassRow, 'student_id' | 'hours' | 'total_amount' | 'class_date'>[]
}

/**
 * Saves a class. Without connection it is queued on the device with the same id and
 * sent later, so it is never stored twice.
 */
export async function createClass(
  input: NewClassInput, userId: string, newStudent?: NewStudentInput, queueAll = false,
): Promise<SaveResult> {
  // something it depends on is still waiting to sync: keep the order in the queue
  if (queueAll) {
    if (newStudent) await enqueue('student', newStudent, userId)
    await enqueue('class', input, userId)
    return 'queued'
  }
  if (newStudent) {
    const r = await createStudent(newStudent, userId)
    if (r === 'queued') {
      await enqueue('class', input, userId)
      return 'queued'
    }
  }
  const { error } = await supabase.from('classes').insert(input)
  if (!error || error.code === '23505') return 'saved'
  if (isNetworkError(error)) {
    await enqueue('class', input, userId)
    return 'queued'
  }
  throw error
}

export async function updateClass(id: string, input: Partial<Omit<NewClassInput, 'id'>>) {
  check(await supabase.from('classes').update(input).eq('id', id))
}

export async function deleteClass(id: string) {
  check(await supabase.from('classes').delete().eq('id', id))
}

// ------------------------------------------------------------------ settlements

export async function fetchSettlements(instructorId?: string): Promise<Settlement[]> {
  let q = supabase.from('settlements').select('*, instructor:instructors(full_name)')
  if (instructorId) q = q.eq('instructor_id', instructorId)
  const rows = check(await q.order('paid_at', { ascending: false }).order('created_at', { ascending: false })
    .limit(MAX_ROWS)) as Settlement[]
  return rows.map((r) => ({ ...r, amount: Number(r.amount), total_hours: Number(r.total_hours) }))
}

export async function paySettlement(input: {
  instructorId: string; from: string; to: string; paidAt: string; expectedCount: number; expectedAmount: number; notes: string
}): Promise<string> {
  return check(await supabase.rpc('pay_settlement', {
    p_instructor_id: input.instructorId, p_from: input.from, p_to: input.to, p_paid_at: input.paidAt,
    p_expected_count: input.expectedCount, p_expected_amount: input.expectedAmount, p_notes: input.notes || null,
  })) as string
}

export async function cancelSettlement(id: string) {
  check(await supabase.rpc('cancel_settlement', { p_settlement_id: id }))
}

// ------------------------------------------------------------------ app logins (server function)

async function callUsersApi(method: 'POST' | 'PATCH', body: unknown) {
  if (import.meta.env.VITE_DEMO === '1') {
    const demo = await import('../demo/supabase')
    return demo.demoUsersApi(method, body)
  }
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const res = await fetch('/api/users', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
    body: JSON.stringify(body),
  })
  const json = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`)
  return json
}

export function createLogin(input: { instructor_id: string; username: string; password: string }) {
  return callUsersApi('POST', input)
}

export function updateLogin(input: { profile_id: string; active?: boolean; password?: string }) {
  return callUsersApi('PATCH', input)
}

// ------------------------------------------------------------------ students & instructors app

/** One-time code for a student or instructor to join the students app (admins only). */
export async function createInvite(kind: 'student' | 'instructor', targetId: string): Promise<string> {
  return check(await supabase.rpc('create_invite', { p_kind: kind, p_target: targetId })) as string
}

/** Classes students asked for in their app (today onwards), with the student's data. */
export async function fetchRequests(): Promise<ClassRequest[]> {
  const t = new Date()
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  const rows = check(await supabase.from('lessons')
    .select('id, lesson_date, start_time, hours, class_lang, rules_accepted_at, student_note, instructor_id, created_at, student:students(*)')
    .eq('status', 'requested').gte('lesson_date', today)
    .order('lesson_date').order('start_time')) as unknown as ClassRequest[]
  return rows.map((r) => ({ ...r, hours: Number(r.hours), start_time: r.start_time?.slice(0, 5) ?? null, student: normalizeStudent(r.student) }))
}

/**
 * Confirmed classes (scheduled from the students app) whose student has no price per
 * hour yet, grouped by student. They stay pending here until the price is set.
 */
export async function fetchPriceless(): Promise<PricelessStudent[]> {
  const rows = check(await supabase.from('lessons')
    .select('id, lesson_date, start_time, hours, instructor:instructors(full_name), student:students!inner(*)')
    .eq('status', 'confirmed').is('student.hourly_rate', null)
    .order('lesson_date').order('start_time')) as unknown as
    { id: string; lesson_date: string; start_time: string; hours: number; instructor: { full_name: string } | null; student: Student }[]
  const by = new Map<string, PricelessStudent>()
  for (const r of rows) {
    const g = by.get(r.student.id) ?? { student: normalizeStudent(r.student), lessons: [] }
    g.lessons.push({ id: r.id, lesson_date: r.lesson_date, start_time: r.start_time.slice(0, 5), hours: Number(r.hours), instructor_name: r.instructor?.full_name ?? null })
    by.set(r.student.id, g)
  }
  return [...by.values()]
}

/** Sets the student's price per hour, the agreed time (and hours) and confirms the class. */
export async function confirmRequest(lessonId: string, rate: number, instructorId: string, time: string, hours: number, lang: string) {
  check(await supabase.rpc('confirm_request', { p_lesson: lessonId, p_rate: rate, p_instructor: instructorId, p_time: time, p_hours: hours, p_lang: lang }))
}

/** Confirmed classes from today on, for the agenda (admins can move them). */
export async function fetchUpcoming(): Promise<UpcomingLesson[]> {
  const t = new Date()
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  const rows = check(await supabase.from('lessons')
    .select('id, lesson_date, start_time, hours, class_lang, staff_note, instructor:instructors(full_name), student:students(*)')
    .eq('status', 'confirmed').gte('lesson_date', today)
    .order('lesson_date').order('start_time').limit(60)) as unknown as
    (Omit<UpcomingLesson, 'instructor_name'> & { instructor: { full_name: string } | null })[]
  return rows.map(({ instructor, ...r }) => ({ ...r, start_time: r.start_time.slice(0, 5), hours: Number(r.hours), instructor_name: instructor?.full_name ?? null, student: normalizeStudent(r.student) }))
}

/** Admins move a confirmed class to another day and time (rain, no wind...). */
export async function rescheduleLesson(id: string, date: string, time: string, reason: string | null) {
  check(await supabase.rpc('reschedule_lesson', { p_lesson: id, p_date: date, p_time: time, p_reason: reason }))
}

/** Times already taken on a day (confirmed classes and requests with a time). */
export async function busyTimes(date: string, excludeId: string): Promise<{ start: string; hours: number }[]> {
  const rows = check(await supabase.rpc('busy_slots', { p_from: date, p_to: date, p_exclude: excludeId })) as { start_time: string; hours: number }[]
  return rows.map((r) => ({ start: r.start_time.slice(0, 5), hours: Number(r.hours) }))
}

export async function rejectRequest(lessonId: string) {
  check(await supabase.rpc('cancel_lesson', { p_lesson: lessonId, p_note: null }))
}
