// Every call to the database goes through here.
import { supabase } from './supabase'
import { loginToEmail, normalizeUsername, USERNAME_PATTERN } from './username'
import type {
  Announcement, BusySlot, InvitePreview, Lesson, LessonNote, Me, PersonalData, Person, Skill, SkillStatus, StudentSkill, StudentSummary,
} from './types'

const DOMAIN = (import.meta.env.VITE_USERNAME_DOMAIN as string | undefined) ?? 'truevento.com'

function check<T>(res: { data: T; error: unknown } | { data: unknown; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

// ------------------------------------------------------------------ session

export async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

export function onAuthChange(fn: (userId: string | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => fn(session?.user.id ?? null))
  return () => data.subscription.unsubscribe()
}

export async function signIn(login: string, password: string) {
  check(await supabase.auth.signInWithPassword({ email: loginToEmail(login, DOMAIN), password }))
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function validUsername(username: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(username))
}

/** Creates the login (username + password). Then the account is linked with
 *  registerStudent (a new student) or claimInvite (a code from the school). */
export async function signUpAccount(username: string, password: string) {
  const user = normalizeUsername(username)
  const res = await supabase.auth.signUp({
    email: `${user}@${DOMAIN}`,
    password,
    options: { data: { username: user } },
  })
  check(res)
  if (!res.data.session) {
    // projects that require email confirmation return no session
    check(await supabase.auth.signInWithPassword({ email: `${user}@${DOMAIN}`, password }))
  }
}

export async function registerStudent(d: PersonalData) {
  check(await supabase.rpc('register_student', {
    p_full_name: d.full_name, p_phone: d.phone, p_weight: d.weight_kg, p_experience: d.experience,
  }))
}

export async function updateMyDetails(d: Pick<PersonalData, 'phone' | 'weight_kg' | 'experience'>) {
  check(await supabase.rpc('update_my_details', { p_phone: d.phone, p_weight: d.weight_kg, p_experience: d.experience }))
}

/** The student's app language, so the school writes to them in it. */
export async function setMyLang(lang: string) {
  await supabase.rpc('set_my_lang', { p_lang: lang })
}

export async function claimInvite(code: string) {
  check(await supabase.rpc('claim_invite', { p_code: code }))
}

/** The school's admin code: this account becomes an admin. */
export async function claimAdminCode(code: string, name: string) {
  check(await supabase.rpc('claim_admin_code', { p_code: code, p_name: name }))
}

export async function invitePreview(code: string): Promise<InvitePreview | null> {
  return check(await supabase.rpc('invite_preview', { p_code: code })) as InvitePreview | null
}

export async function getMe(): Promise<Me | null> {
  return check(await supabase.rpc('app_me')) as Me | null
}

// ------------------------------------------------------------------ agenda

export async function agenda(from: string, to: string): Promise<Lesson[]> {
  const rows = check(await supabase.rpc('agenda', { p_from: from, p_to: to })) as Lesson[]
  return rows.map((r) => ({ ...r, hours: Number(r.hours) }))
}

/** Taken times (requested or confirmed classes), without names. */
export async function busySlots(from: string, to: string, excludeId: string | null): Promise<BusySlot[]> {
  const rows = check(await supabase.rpc('busy_slots', { p_from: from, p_to: to, p_exclude: excludeId })) as BusySlot[]
  return rows.map((r) => ({ ...r, start_time: r.start_time.slice(0, 5), hours: Number(r.hours) }))
}

export async function instructorDirectory(): Promise<Person[]> {
  return check(await supabase.rpc('instructor_directory')) as Person[]
}

export async function requestLesson(date: string, time: string | null, hours: number, instructorId: string | null, note: string, lang: string) {
  check(await supabase.rpc('request_lesson', {
    p_date: date, p_time: time, p_hours: hours, p_instructor: instructorId, p_note: note || null, p_lang: lang,
    // the student accepted the school's rules for this booking
    p_accept_rules: true,
  }))
}

/** Staff: the language the class is taught in. */
export async function setClassLang(id: string, lang: string) {
  check(await supabase.rpc('set_class_lang', { p_lesson: id, p_lang: lang }))
}

export async function scheduleLesson(studentId: string, instructorId: string, date: string, time: string, hours: number, note: string): Promise<string> {
  return check(await supabase.rpc('schedule_lesson', {
    p_student: studentId, p_instructor: instructorId, p_date: date, p_time: time, p_hours: hours, p_note: note || null,
  })) as string
}

export async function confirmLesson(id: string, instructorId: string, date: string, time: string, hours: number, note: string) {
  check(await supabase.rpc('confirm_lesson', {
    p_lesson: id, p_instructor: instructorId, p_date: date, p_time: time, p_hours: hours, p_note: note || null,
  }))
}

export async function cancelLesson(id: string, note: string) {
  check(await supabase.rpc('cancel_lesson', { p_lesson: id, p_note: note || null }))
}

export async function completeLesson(id: string, hours: number, note: string, learning: string[], done: string[]) {
  check(await supabase.rpc('complete_lesson', {
    p_lesson: id, p_hours: hours, p_note: note || null, p_learning: learning, p_done: done,
  }))
}

// ------------------------------------------------------------------ students and progress

export async function myStudentSummary(): Promise<StudentSummary | null> {
  const s = check(await supabase.rpc('my_student_summary')) as StudentSummary | null
  return s && { ...s, hours: Number(s.hours), classes: Number(s.classes) }
}

/** School staff only: active students' names. */
export async function listStudents(): Promise<Person[]> {
  return check(await supabase.from('students').select('id, full_name').eq('active', true).order('full_name')) as Person[]
}

export async function listSkills(): Promise<Skill[]> {
  return check(await supabase.from('skills').select('id, level, position, name, description')
    .eq('active', true).order('level').order('position')) as Skill[]
}

export async function studentSkills(studentId: string): Promise<StudentSkill[]> {
  return check(await supabase.from('student_skills').select('student_id, skill_id, status, updated_at')
    .eq('student_id', studentId)) as StudentSkill[]
}

export async function setStudentSkill(studentId: string, skillId: string, status: SkillStatus | null) {
  check(await supabase.rpc('set_student_skill', { p_student: studentId, p_skill: skillId, p_status: status }))
}

export async function lessonNotes(studentId: string): Promise<LessonNote[]> {
  return check(await supabase.from('lesson_notes').select('id, student_id, instructor_id, body, created_at')
    .eq('student_id', studentId).order('created_at', { ascending: false }).limit(50)) as LessonNote[]
}

export async function addLessonNote(studentId: string, instructorId: string | null, body: string) {
  check(await supabase.from('lesson_notes').insert({ student_id: studentId, instructor_id: instructorId, body }))
}

// ------------------------------------------------------------------ announcements

export async function listAnnouncements(): Promise<Announcement[]> {
  return check(await supabase.from('announcements')
    .select('id, student_id, title, body, author_name, created_by, created_at')
    .order('created_at', { ascending: false }).limit(30)) as Announcement[]
}

export async function createAnnouncement(title: string, body: string, studentId: string | null) {
  check(await supabase.from('announcements').insert({ title, body: body || null, student_id: studentId }))
}

export async function deleteAnnouncement(id: string) {
  check(await supabase.from('announcements').delete().eq('id', id))
}
