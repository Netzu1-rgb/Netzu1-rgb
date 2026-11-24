// Demo build only (npm run build:demo): the same functions as src/lib/api.ts, kept in
// this browser's storage. Example data so both roles can be tried; never used in production.
import { normalizeUsername, USERNAME_PATTERN } from '../lib/username'
import { addDays, today } from '../lib/format'
import type {
  Announcement, BusySlot, InvitePreview, Lesson, LessonNote, Me, Person, Skill, SkillStatus, StudentSkill, StudentSummary,
} from '../lib/types'

interface User { id: string; username: string; password: string; role: Me['role']; student_id: string | null; instructor_id: string | null; full_name: string }
interface Row { id: string; student_id: string; instructor_id: string | null; lesson_date: string; start_time: string; hours: number; status: Lesson['status']; student_note: string | null; staff_note: string | null; created_at: string }
interface Db {
  users: User[]
  session: string | null
  students: (Person & { start_date: string })[]
  instructors: Person[]
  skills: Skill[]
  progress: StudentSkill[]
  lessons: Row[]
  notes: LessonNote[]
  news: Announcement[]
  invites: { code: string; kind: 'student' | 'instructor'; target: string; used: boolean }[]
  classes: { student_id: string; hours: number; date: string }[]
}

const KEY = 'truevento-alumnos-demo-v1'
const uid = () => crypto.randomUUID()
const now = () => new Date().toISOString()
const wait = () => new Promise((r) => setTimeout(r, 120))
class DemoError extends Error { code = 'P0001' }
const fail = (m: string): never => { throw new DemoError(m) }

const SKILLS: [number, string, string | null][] = [
  [1, 'Seguridad y viento', 'Ventana de viento, zonas de potencia y reglas de la playa'],
  [1, 'Armado del equipo', 'Inflar, conectar líneas y revisar el kite'],
  [1, 'Despegue y aterrizaje asistido', 'Con señas al compañero'],
  [1, 'Pilotaje del kite', 'Control en el borde de la ventana y en el cenit'],
  [1, 'Sistemas de seguridad', 'Quick release y safety leash'],
  [2, 'Body drag', 'Arrastre con el cuerpo, ida y vuelta'],
  [2, 'Body drag de rescate de tabla', 'Volver a la tabla contra el viento'],
  [2, 'Relanzar el kite desde el agua', null],
  [2, 'Autorrescate', 'Recuperar el equipo y volver a la orilla'],
  [3, 'Waterstart', 'Salir del agua parado en la tabla'],
  [3, 'Primeras navegadas', 'Mantener la dirección y frenar'],
  [3, 'Navegar hacia los dos lados', null],
  [3, 'Control de la velocidad', null],
  [4, 'Ceñida', 'Ganar barlovento'],
  [4, 'Cambio de dirección', 'Transición sin parar'],
  [4, 'Navegar en ola', null],
  [4, 'Primeros saltos', null],
]

function seed(): Db {
  const victoria = { id: uid(), full_name: 'Victoria Linde' }
  const sebastian = { id: uid(), full_name: 'Sebastián Comasco' }
  const ana = { id: uid(), full_name: 'Ana (alumna de ejemplo)', start_date: addDays(today(), -10) }
  const skills = SKILLS.map(([level, name, description], i) => ({ id: uid(), level, position: i, name, description }))
  const past = addDays(today(), -3)
  return {
    users: [
      { id: uid(), username: 'ana', password: 'demo1234', role: 'student', student_id: ana.id, instructor_id: null, full_name: ana.full_name },
      { id: uid(), username: 'victoria', password: 'demo1234', role: 'admin', student_id: null, instructor_id: victoria.id, full_name: victoria.full_name },
    ],
    session: null,
    students: [ana],
    instructors: [victoria, sebastian],
    skills,
    progress: [
      { student_id: ana.id, skill_id: skills[0].id, status: 'done', updated_at: now() },
      { student_id: ana.id, skill_id: skills[1].id, status: 'learning', updated_at: now() },
    ],
    lessons: [
      { id: uid(), student_id: ana.id, instructor_id: victoria.id, lesson_date: past, start_time: '10:00', hours: 1.5, status: 'done', student_note: null, staff_note: null, created_at: now() },
      { id: uid(), student_id: ana.id, instructor_id: null, lesson_date: addDays(today(), 1), start_time: '15:00', hours: 2, status: 'requested', student_note: 'Es mi segunda clase', staff_note: null, created_at: now() },
    ],
    notes: [{ id: uid(), student_id: ana.id, instructor_id: victoria.id, body: 'Muy buena primera clase: entendiste la ventana de viento. La próxima practicamos el armado.', created_at: new Date(Date.now() - 3 * 86400e3).toISOString() }],
    news: [],
    invites: [],
    classes: [{ student_id: ana.id, hours: 1.5, date: past }],
  }
}

let db: Db = (() => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch { /* fresh */ }
  return seed()
})()
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* memory only */ } }

export function resetDemo() {
  db = seed()
  save()
  location.reload()
}

const listeners = new Set<(id: string | null) => void>()
const me = () => db.users.find((u) => u.id === db.session) ?? null
const staff = () => { const u = me(); return u?.role === 'admin' || u?.role === 'instructor' }
const nameOf = (id: string | null, list: Person[]) => list.find((p) => p.id === id)?.full_name ?? null
const view = (l: Row): Lesson => ({ ...l, student_name: nameOf(l.student_id, db.students) ?? '', instructor_name: nameOf(l.instructor_id, db.instructors) })
const quarter = (h: number) => { if (!(h > 0 && h <= 8 && Number.isInteger(h * 4))) fail('Duración inválida: usá cuartos de hora.') }

export async function currentUserId() { return db.session }
export function onAuthChange(fn: (id: string | null) => void) { listeners.add(fn); return () => { listeners.delete(fn) } }
function setSession(id: string | null) { db.session = id; save(); listeners.forEach((f) => f(id)) }

export async function signIn(login: string, password: string) {
  await wait()
  const u = db.users.find((x) => x.username === normalizeUsername(login) && x.password === password)
  if (!u) throw new Error('Invalid login credentials')
  setSession(u.id)
}
export async function signOut() { setSession(null) }
export function validUsername(u: string) { return USERNAME_PATTERN.test(normalizeUsername(u)) }

export async function signUpWithCode(code: string, username: string, password: string) {
  await wait()
  const user = normalizeUsername(username)
  if (db.users.some((u) => u.username === user)) throw new Error('User already registered')
  const u: User = { id: uid(), username: user, password, role: null, student_id: null, instructor_id: null, full_name: user }
  db.users.push(u)
  setSession(u.id)
  await claimInvite(code)
}

export async function claimInvite(code: string) {
  await wait()
  const inv = db.invites.find((i) => i.code === code && !i.used)
  if (!inv) fail('El código no es válido o ya se usó. Pedile uno nuevo a la escuela.')
  const u = me()!
  if (inv!.kind === 'student') Object.assign(u, { role: 'student', student_id: inv!.target, full_name: nameOf(inv!.target, db.students) })
  else Object.assign(u, { role: 'instructor', instructor_id: inv!.target, full_name: nameOf(inv!.target, db.instructors) })
  inv!.used = true
  save()
}

export async function invitePreview(code: string): Promise<InvitePreview | null> {
  const inv = db.invites.find((i) => i.code === code && !i.used)
  if (!inv) return null
  const name = nameOf(inv.target, inv.kind === 'student' ? db.students : db.instructors) ?? ''
  return { kind: inv.kind, first_name: name.split(' ')[0] }
}

export async function getMe(): Promise<Me | null> {
  const u = me()
  return u && { role: u.role, full_name: u.full_name, student_id: u.student_id, instructor_id: u.instructor_id, school_name: 'TRUEVENTO' }
}

export async function agenda(from: string, to: string): Promise<Lesson[]> {
  await wait()
  const u = me()
  return db.lessons
    .filter((l) => l.lesson_date >= from && l.lesson_date <= to && (staff() || l.student_id === u?.student_id))
    .sort((a, b) => (a.lesson_date + a.start_time).localeCompare(b.lesson_date + b.start_time))
    .map(view)
}

export async function busySlots(from: string, to: string, excludeId: string | null): Promise<BusySlot[]> {
  await wait()
  return db.lessons
    .filter((l) => l.lesson_date >= from && l.lesson_date <= to && (l.status === 'requested' || l.status === 'confirmed') && l.id !== excludeId)
    .map((l) => ({ lesson_date: l.lesson_date, start_time: l.start_time.slice(0, 5), hours: l.hours }))
}

function assertFree(date: string, time: string, hours: number, exclude?: string) {
  const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const s = m(time), e = s + hours * 60
  if (db.lessons.some((l) => l.id !== exclude && l.lesson_date === date && (l.status === 'requested' || l.status === 'confirmed')
    && m(l.start_time) < e && s < m(l.start_time) + l.hours * 60)) fail('Ese horario ya está reservado. Elegí otro.')
}

export async function instructorDirectory(): Promise<Person[]> { return db.instructors }

export async function requestLesson(date: string, time: string, hours: number, instructorId: string | null, note: string) {
  await wait()
  quarter(hours)
  if (date < today()) fail('Elegí una fecha de hoy en adelante.')
  assertFree(date, time, hours)
  db.lessons.push({ id: uid(), student_id: me()!.student_id!, instructor_id: instructorId, lesson_date: date, start_time: time, hours, status: 'requested', student_note: note || null, staff_note: null, created_at: now() })
  save()
}

export async function scheduleLesson(studentId: string, instructorId: string, date: string, time: string, hours: number, note: string) {
  await wait()
  quarter(hours)
  assertFree(date, time, hours)
  db.lessons.push({ id: uid(), student_id: studentId, instructor_id: instructorId, lesson_date: date, start_time: time, hours, status: 'confirmed', student_note: null, staff_note: note || null, created_at: now() })
  save()
}

export async function confirmLesson(id: string, instructorId: string, date: string, time: string, hours: number, note: string) {
  await wait()
  quarter(hours)
  assertFree(date, time, hours, id)
  Object.assign(db.lessons.find((l) => l.id === id)!, { status: 'confirmed', instructor_id: instructorId, lesson_date: date, start_time: time, hours, ...(note ? { staff_note: note } : {}) })
  save()
}

export async function cancelLesson(id: string, note: string) {
  await wait()
  const l = db.lessons.find((x) => x.id === id)!
  if (l.status !== 'requested' && l.status !== 'confirmed') fail('Esta clase ya no se puede cancelar.')
  l.status = 'cancelled'
  if (note) l.staff_note = note
  save()
}

export async function completeLesson(id: string, hours: number, note: string, learning: string[], done: string[]) {
  await wait()
  quarter(hours)
  const l = db.lessons.find((x) => x.id === id)!
  Object.assign(l, { status: 'done', hours })
  db.classes.push({ student_id: l.student_id, hours, date: l.lesson_date })
  if (note) db.notes.unshift({ id: uid(), student_id: l.student_id, instructor_id: l.instructor_id, body: note, created_at: now() })
  for (const s of learning) if (!db.progress.some((p) => p.student_id === l.student_id && p.skill_id === s)) db.progress.push({ student_id: l.student_id, skill_id: s, status: 'learning', updated_at: now() })
  for (const s of done) await setStudentSkill(l.student_id, s, 'done')
  save()
}

export async function myStudentSummary(): Promise<StudentSummary | null> {
  const st = db.students.find((s) => s.id === me()?.student_id)
  if (!st) return null
  const mine = db.classes.filter((c) => c.student_id === st.id)
  return { full_name: st.full_name, start_date: st.start_date, hours: mine.reduce((s, c) => s + c.hours, 0), classes: mine.length, last_class: mine.at(-1)?.date ?? null }
}

export async function listStudents(): Promise<Person[]> { await wait(); return db.students }
export async function listSkills(): Promise<Skill[]> { return db.skills }
export async function studentSkills(studentId: string): Promise<StudentSkill[]> { return db.progress.filter((p) => p.student_id === studentId) }

export async function setStudentSkill(studentId: string, skillId: string, status: SkillStatus | null) {
  db.progress = db.progress.filter((p) => !(p.student_id === studentId && p.skill_id === skillId))
  if (status) db.progress.push({ student_id: studentId, skill_id: skillId, status, updated_at: now() })
  save()
}

export async function lessonNotes(studentId: string): Promise<LessonNote[]> { return db.notes.filter((n) => n.student_id === studentId) }
export async function addLessonNote(studentId: string, instructorId: string | null, body: string) {
  db.notes.unshift({ id: uid(), student_id: studentId, instructor_id: instructorId, body, created_at: now() })
  save()
}

export async function listAnnouncements(): Promise<Announcement[]> {
  const u = me()
  return db.news.filter((a) => staff() || !a.student_id || a.student_id === u?.student_id)
}
export async function createAnnouncement(title: string, body: string, studentId: string | null) {
  await wait()
  const u = me()!
  db.news.unshift({ id: uid(), student_id: studentId, title, body: body || null, author_name: u.full_name, created_by: u.id, created_at: now() })
  save()
}
export async function deleteAnnouncement(id: string) { db.news = db.news.filter((a) => a.id !== id); save() }

/** Demo only: an invite code, so the join screen can be tried. */
export function demoInvite(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const part = () => Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('')
  const st = { id: uid(), full_name: 'Bruno (alumno de ejemplo)', start_date: today() }
  db.students.push(st)
  const code = `${part()}-${part()}`
  db.invites.push({ code, kind: 'student', target: st.id, used: false })
  save()
  return code
}
