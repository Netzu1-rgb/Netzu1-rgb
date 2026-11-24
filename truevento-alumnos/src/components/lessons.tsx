import { useEffect, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, dayLabel, DURATIONS, endTime, formatHours, longDay, shortTime, START_TIMES, today } from '../lib/format'
import { notifyChange } from '../lib/hooks'
import type { Lesson, LessonStatus, Person, Skill, SkillStatus } from '../lib/types'
import { levelName } from '../lib/types'
import { ErrorBox, Field, Icon, Modal, Spinner, useToast } from './ui'

// ------------------------------------------------------------------ status

const STATUS: Record<LessonStatus, { label: string; cls: string }> = {
  requested: { label: 'Pendiente', cls: 'bg-coral-soft text-coral-ink' },
  confirmed: { label: 'Confirmada', cls: 'bg-brand-soft text-brand-deep' },
  done: { label: 'Realizada', cls: 'bg-violet-soft text-violet-deep' },
  cancelled: { label: 'Cancelada', cls: 'bg-surface-2 text-ink-mute' },
}

export function StatusBadge({ status }: { status: LessonStatus }) {
  return <span className={`badge ${STATUS[status].cls}`}>{STATUS[status].label}</span>
}

// ------------------------------------------------------------------ lesson card

export function LessonCard({ lesson, show, actions }: {
  lesson: Lesson
  show: 'student' | 'instructor' | 'both'
  actions?: ReactNode
}) {
  const muted = lesson.status === 'cancelled'
  return (
    <div className={`card p-4 ${muted ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-surface-2 py-2 text-center">
          <div className="tabular font-display text-lg font-bold leading-none text-heading">{shortTime(lesson.start_time)}</div>
          <div className="mt-1 text-[11px] font-semibold text-ink-mute">{formatHours(lesson.hours)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-heading">{dayLabel(lesson.lesson_date)}</span>
            <StatusBadge status={lesson.status} />
          </div>
          <div className="mt-0.5 text-sm text-ink-soft">
            {shortTime(lesson.start_time)} a {endTime(lesson.start_time, lesson.hours)}
            {show !== 'instructor' && <> · <b className="font-semibold text-ink">{lesson.student_name}</b></>}
            {show !== 'student' && (
              <> · {lesson.instructor_name ? <>con <b className="font-semibold text-ink">{lesson.instructor_name}</b></> : <span className="text-coral-ink">sin instructor</span>}</>
            )}
          </div>
          {lesson.student_note && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft">“{lesson.student_note}”</p>}
          {lesson.staff_note && <p className="mt-2 flex gap-2 text-sm text-ink-soft"><Icon name="note" className="mt-0.5 h-4 w-4 shrink-0" />{lesson.staff_note}</p>}
        </div>
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

// ------------------------------------------------------------------ pickers

function Chips<T extends string | number>({ label, options, value, onChange, format }: {
  label: string; options: T[]; value: T | null; onChange: (v: T) => void; format?: (v: T) => string
}) {
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o)} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
            className={value === o ? 'chip-on' : 'chip'}>
            {format ? format(o) : String(o)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function DatePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i))
  return (
    <div>
      <Chips label="Día" options={days} value={days.includes(value) ? value : null} onChange={onChange} format={dayLabel} />
      <Field label="u otra fecha" className="mt-3">
        {(id) => <input id={id} type="date" className="input" min={today()} value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />}
      </Field>
    </div>
  )
}

export function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Chips label="Hora de inicio" options={START_TIMES} value={START_TIMES.includes(value) ? value : null} onChange={onChange} />
      <Field label="u otra hora" className="mt-3">
        {(id) => <input id={id} type="time" step={900} className="input" value={value} onChange={(e) => e.target.value && onChange(e.target.value)} />}
      </Field>
    </div>
  )
}

export function DurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <Chips label="Duración" options={DURATIONS} value={value} onChange={onChange} format={(h) => formatHours(h)} />
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  async function run(fn: () => Promise<void>, ok: string, done: () => void) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      notifyChange()
      toast(ok)
      done()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

// ------------------------------------------------------------------ student asks for a class

export function RequestLessonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [date, setDate] = useState(addDays(today(), 1))
  const [time, setTime] = useState('10:00')
  const [hours, setHours] = useState(1.5)
  const [instructor, setInstructor] = useState('')
  const [note, setNote] = useState('')
  const [people, setPeople] = useState<Person[]>([])
  const { busy, error, setError, run } = useSubmit()

  useEffect(() => {
    if (!open) return
    setError(null)
    void api.instructorDirectory().then(setPeople).catch(() => setPeople([]))
  }, [open, setError])

  return (
    <Modal open={open} title="Pedir una clase" onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy}
          onClick={() => void run(() => api.requestLesson(date, time, hours, instructor || null, note.trim()),
            'Listo: la escuela va a confirmar tu clase', onClose)}>
          {busy && <Spinner />} Enviar pedido
        </button>
      </>}>
      <div className="space-y-5">
        <DatePicker value={date} onChange={setDate} />
        <TimePicker value={time} onChange={setTime} />
        <DurationPicker value={hours} onChange={setHours} />
        <Field label="Instructor (opcional)">
          {(id) => (
            <select id={id} className="input" value={instructor} onChange={(e) => setInstructor(e.target.value)}>
              <option value="">El que esté disponible</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Mensaje para la escuela (opcional)">
          {(id) => <textarea id={id} className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: es mi primera clase, vengo con un amigo…" />}
        </Field>
        <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand-deep">
          <b>{longDay(date, true)}</b>, de {time} a {endTime(time, hours)}. La clase queda <b>pendiente</b> hasta que la escuela la confirme.
        </p>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------ staff: new or confirm

export function ScheduleModal({ open, onClose, lesson, myInstructorId, isAdmin }: {
  open: boolean
  onClose: () => void
  lesson: Lesson | null // null = new class
  myInstructorId: string | null
  isAdmin: boolean
}) {
  const [student, setStudent] = useState('')
  const [instructor, setInstructor] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('10:00')
  const [hours, setHours] = useState(1.5)
  const [note, setNote] = useState('')
  const [students, setStudents] = useState<Person[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const { busy, error, setError, run } = useSubmit()

  useEffect(() => {
    if (!open) return
    setError(null)
    setStudent(lesson?.student_id ?? '')
    setInstructor(lesson?.instructor_id ?? (isAdmin ? '' : myInstructorId ?? ''))
    setDate(lesson?.lesson_date ?? today())
    setTime(lesson ? shortTime(lesson.start_time) : '10:00')
    setHours(lesson?.hours ?? 1.5)
    setNote('')
    void api.instructorDirectory().then(setPeople).catch(() => setPeople([]))
    if (!lesson) void api.listStudents().then(setStudents).catch(() => setStudents([]))
  }, [open, lesson, isAdmin, myInstructorId, setError])

  function submit() {
    if (!lesson && !student) return setError('Elegí el alumno.')
    if (!instructor) return setError('Elegí quién da la clase.')
    void run(
      () => lesson
        ? api.confirmLesson(lesson.id, instructor, date, time, hours, note.trim())
        : api.scheduleLesson(student, instructor, date, time, hours, note.trim()),
      lesson ? 'Clase confirmada' : 'Clase agendada',
      onClose,
    )
  }

  return (
    <Modal open={open} title={lesson ? `Confirmar clase de ${lesson.student_name}` : 'Agendar una clase'} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy} onClick={submit}>
          {busy && <Spinner />} {lesson ? 'Confirmar' : 'Agendar'}
        </button>
      </>}>
      <div className="space-y-5">
        {!lesson && (
          <Field label="Alumno">
            {(id) => (
              <select id={id} className="input" value={student} onChange={(e) => setStudent(e.target.value)}>
                <option value="">Elegí el alumno…</option>
                {students.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            )}
          </Field>
        )}
        {lesson?.student_note && <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-soft">“{lesson.student_note}”</p>}
        <Field label="Quién da la clase">
          {(id) => (
            <select id={id} className="input" value={instructor} disabled={!isAdmin} onChange={(e) => setInstructor(e.target.value)}>
              <option value="">Elegí el instructor…</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          )}
        </Field>
        <DatePicker value={date} onChange={setDate} />
        <TimePicker value={time} onChange={setTime} />
        <DurationPicker value={hours} onChange={setHours} />
        <Field label="Mensaje para el alumno (opcional)">
          {(id) => <textarea id={id} className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: nos vemos en la escuela, traé protector solar" />}
        </Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}

// ------------------------------------------------------------------ staff: the class was given

export function CompleteModal({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const [hours, setHours] = useState(1.5)
  const [note, setNote] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [current, setCurrent] = useState<Record<string, SkillStatus>>({})
  const [marks, setMarks] = useState<Record<string, SkillStatus>>({})
  const { busy, error, setError, run } = useSubmit()

  useEffect(() => {
    if (!lesson) return
    setError(null)
    setHours(lesson.hours)
    setNote('')
    setMarks({})
    void Promise.all([api.listSkills(), api.studentSkills(lesson.student_id)]).then(([sk, st]) => {
      setSkills(sk)
      setCurrent(Object.fromEntries(st.map((s) => [s.skill_id, s.status])))
    }).catch(() => setSkills([]))
  }, [lesson, setError])

  const statusOf = (id: string): SkillStatus | null => marks[id] ?? current[id] ?? null
  function cycle(id: string) {
    const now = statusOf(id)
    if (current[id] === 'done') return // already learned
    const next: SkillStatus | null = now === null ? 'learning' : now === 'learning' ? 'done' : null
    setMarks((m) => {
      const copy = { ...m }
      if (next === null || next === current[id]) delete copy[id]
      else copy[id] = next
      return copy
    })
  }
  // only show the levels the student is working on, plus the next one
  const reached = Math.max(1, ...skills.filter((s) => statusOf(s.id)).map((s) => s.level))
  const levels = [...new Set(skills.map((s) => s.level))].filter((l) => l <= reached + 1)

  if (!lesson) return null
  return (
    <Modal open title={`Clase de ${lesson.student_name}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy}
          onClick={() => void run(() => api.completeLesson(lesson.id, hours, note.trim(),
            Object.keys(marks).filter((k) => marks[k] === 'learning'),
            Object.keys(marks).filter((k) => marks[k] === 'done')), 'Clase guardada', onClose)}>
          {busy && <Spinner />} Guardar clase
        </button>
      </>}>
      <div className="space-y-5">
        <p className="text-sm text-ink-soft">
          {longDay(lesson.lesson_date)} · {shortTime(lesson.start_time)}. Al guardarla queda registrada para la escuela (horas y pago) y el alumno ve su progreso.
        </p>
        <DurationPicker value={hours} onChange={setHours} />
        <Field label="¿Cómo le fue? (lo ve el alumno)">
          {(id) => <textarea id={id} className="input min-h-24" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: muy bien el control del kite. Próxima clase: body drag." />}
        </Field>
        <div>
          <div className="field-label">¿Qué trabajó hoy? <span className="font-normal text-ink-mute">Tocá una vez: practicando · dos veces: logrado</span></div>
          <div className="space-y-4">
            {levels.map((l) => (
              <div key={l}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-mute">{levelName(l)}</div>
                <div className="flex flex-wrap gap-2">
                  {skills.filter((s) => s.level === l).map((s) => {
                    const st = statusOf(s.id)
                    const locked = current[s.id] === 'done'
                    return (
                      <button key={s.id} type="button" onClick={() => cycle(s.id)} disabled={locked}
                        aria-label={`${s.name}: ${st === 'done' ? 'logrado' : st === 'learning' ? 'practicando' : 'sin marcar'}`}
                        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${
                          st === 'done' ? 'border-violet bg-violet text-white' + (locked ? ' opacity-70' : '')
                            : st === 'learning' ? 'border-brand bg-brand-soft text-brand-deep'
                              : 'border-line bg-surface text-ink-soft'}`}>
                        {st === 'done' && <Icon name="check" className="h-4 w-4" />}
                        {st === 'learning' && <span className="h-2 w-2 rounded-full bg-brand" />}
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}
