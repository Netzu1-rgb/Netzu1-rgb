import { useEffect, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, dayLabel, DURATIONS, endTime, formatHours, longDay, shortTime, today } from '../lib/format'
import SlotPicker, { type Slot } from './SlotPicker'
import { notifyChange } from '../lib/hooks'
import type { Lesson, LessonStatus, Person, Skill, SkillStatus } from '../lib/types'
import { levelName } from '../lib/types'
import { ErrorBox, Field, Icon, Modal, Spinner, useToast } from './ui'
import { getLang, LANGS, skillText, t, type Lang } from '../i18n'
import { useMe } from '../context/Session'
import { waNumber } from '../lib/whatsapp'
import { AgreePriceButton } from './contact'
import type { StudentSummary } from '../lib/types'
import type { Key } from '../i18n/messages'

// ------------------------------------------------------------------ status

const STATUS: Record<LessonStatus, { label: Key; cls: string }> = {
  requested: { label: 'status.requested', cls: 'bg-coral-soft text-coral-ink' },
  confirmed: { label: 'status.confirmed', cls: 'bg-brand-soft text-brand-deep' },
  done: { label: 'status.done', cls: 'bg-violet-soft text-violet-deep' },
  cancelled: { label: 'status.cancelled', cls: 'bg-surface-2 text-ink-mute' },
}

export function StatusBadge({ status }: { status: LessonStatus }) {
  return <span className={`badge ${STATUS[status].cls}`}>{t(STATUS[status].label)}</span>
}

const classLangIn = (l?: string) => t(`classLang.in.${l === 'pt' || l === 'en' ? l : 'es'}` as Key)

/** Español / Português / English, for the class (not the app). */
function ClassLangPicker({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <fieldset>
      <legend className="field-label">{t('classLang.title')}</legend>
      <div className="flex flex-wrap gap-2">
        {LANGS.map((l) => (
          <button key={l.value} type="button" lang={l.value} aria-pressed={value === l.value} onClick={() => onChange(l.value)}
            className={value === l.value ? 'chip-on' : 'chip'}>{l.label}</button>
        ))}
      </div>
    </fieldset>
  )
}

/** " a las 10:00", or nothing while the time is still to be agreed. */
export const atTime = (start: string | null) => (start ? t('lesson.at', { time: shortTime(start) }) : '')

// ------------------------------------------------------------------ lesson card

export function LessonCard({ lesson, show, actions, simple = false }: {
  lesson: Lesson
  show: 'student' | 'instructor' | 'both'
  actions?: ReactNode
  /** the student's own view: without their own message, only what the school says */
  simple?: boolean
}) {
  const muted = lesson.status === 'cancelled'
  return (
    <div className={`card p-4 transition ${muted ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="grid w-14 shrink-0 place-items-center rounded-xl bg-surface-2 py-2 text-center">
          {lesson.start_time
            ? <div className="tabular font-display text-lg font-bold leading-none text-heading">{shortTime(lesson.start_time)}</div>
            : <Icon name="whatsapp" className="mx-auto h-5 w-5 text-ink-mute" />}
          <div className="mt-1 text-[11px] font-semibold text-ink-mute">{formatHours(lesson.hours)}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-heading">{dayLabel(lesson.lesson_date)}</span>
            <StatusBadge status={lesson.status} />
            {lesson.class_lang && <span className="badge bg-surface-2 uppercase text-ink-soft" title={t('classLang.summary', { lang: classLangIn(lesson.class_lang) })}>{lesson.class_lang}</span>}
            {lesson.price_pending && lesson.status !== 'done' && lesson.status !== 'cancelled' && <span className="badge bg-sand text-ink-soft">{t('lesson.pricePending')}</span>}
          </div>
          <div className="mt-0.5 text-sm text-ink-soft">
            {lesson.start_time ? t('lesson.range', { from: shortTime(lesson.start_time), to: endTime(lesson.start_time, lesson.hours) }) : t('lesson.tbdLong')}
            {show !== 'instructor' && <> · <b className="font-semibold text-ink">{lesson.student_name}</b></>}
            {show !== 'student' && (
              <> · {lesson.instructor_name ? <>{t('lesson.with')} <b className="font-semibold text-ink">{lesson.instructor_name}</b></> : <span className="text-coral-ink">{t('lesson.noInstructor')}</span>}</>
            )}
          </div>
          {lesson.student_note && !simple && <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft">“{lesson.student_note}”</p>}
          {lesson.staff_note && <p className="mt-2 flex gap-2 text-sm text-ink-soft"><Icon name="note" className="mt-0.5 h-4 w-4 shrink-0" />{lesson.staff_note}</p>}
        </div>
      </div>
      {simple && lesson.status === 'requested' && (
        <AgreePriceButton me={lesson.student_name ?? ''} date={lesson.lesson_date} hours={lesson.hours} lang={lesson.class_lang} className="mt-3 w-full" />
      )}
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

export function DurationPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return <Chips label={t('lesson.duration')} options={DURATIONS} value={value} onChange={onChange} format={(h) => formatHours(h)} />
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()
  const [conflicts, setConflicts] = useState(0)
  async function run(fn: () => Promise<void>, ok: string, done: () => void) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      notifyChange()
      toast(ok)
      done()
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg)
      // someone took the time meanwhile: refresh the calendar
      if (/reservad|booked/i.test(msg)) setConflicts((n) => n + 1)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run, conflicts }
}

// ------------------------------------------------------------------ student asks for a class

/** Three short steps: the day, the time, then a summary to send. */
export function RequestLessonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [slot, setSlot] = useState<Slot>({ date: addDays(today(), 1), time: '', hours: 1.5 })
  const [instructor, setInstructor] = useState('')
  const [note, setNote] = useState('')
  const [extras, setExtras] = useState(false)
  const [people, setPeople] = useState<Person[]>([])
  const { busy, error, setError, run, conflicts } = useSubmit()
  const me = useMe()
  // the school agrees the price on WhatsApp: a student without one types it here
  const [summary, setSummary] = useState<StudentSummary | null>(null)
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)
  const [classLang, setClassLang] = useState<Lang>(getLang())
  const needPhone = summary !== null && !waNumber(summary.phone)

  useEffect(() => {
    if (!open) return
    setError(null)
    setSent(false)
    setPhone('')
    setClassLang(getLang())
    void api.myStudentSummary().then(setSummary).catch(() => setSummary(null))
    setStep(1)
    setExtras(false)
    setInstructor('')
    setNote('')
    setSlot({ date: addDays(today(), 1), time: '', hours: 1.5 })
    void api.instructorDirectory().then(setPeople).catch(() => setPeople([]))
  }, [open, setError])


  const titles = [t('ask.step1'), t('ask.step2'), t('ask.step3')]
  const canNext = step === 1 ? Boolean(slot.date) : step === 2 ? slot.hours > 0 : true

  function next() {
    setError(null)
    if (step < 3) return setStep(step + 1)
    if (needPhone && !waNumber(phone)) return setError(t('err.phone'))
    void run(async () => {
      if (needPhone) await api.updateMyDetails({ phone: phone.trim(), weight_kg: summary?.weight_kg ?? null, experience: summary?.experience ?? null })
      // only the day and the hours: the time is agreed on WhatsApp
      await api.requestLesson(slot.date, null, slot.hours, instructor || null, note.trim(), classLang)
    }, t('ask.sent'), () => setSent(true))
  }

  if (sent) {
    return (
      <Modal open={open} title={t('ask.title')} onClose={onClose}
        footer={<button type="button" className="btn-ghost w-full" onClick={onClose}>{t('ask.done')}</button>}>
        <div className="page-enter space-y-4 text-center">
          <span className="pop mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#11803f] text-white"><Icon name="check" className="h-8 w-8" /></span>
          <h3 className="text-xl font-bold text-heading">{t('ask.sentTitle')}</h3>
          <p className="text-sm text-ink-mute">{longDay(slot.date, true)} · {formatHours(slot.hours)}</p>
          <p className="text-ink-soft">{t('ask.sentText')}</p>
          <AgreePriceButton me={summary?.full_name ?? me.full_name ?? ''} date={slot.date} hours={slot.hours} lang={classLang} label="wa.write" className="w-full" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} title={t('ask.title')} onClose={onClose}
      footer={<>
        {step > 1
          ? <button type="button" className="btn-ghost flex-1" onClick={() => { setError(null); setStep(step - 1) }}><Icon name="chevronLeft" /> {t('ask.back')}</button>
          : <button type="button" className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>}
        <button type="button" className="btn-primary flex-[2]" disabled={busy || !canNext} onClick={next}>
          {busy && <Spinner />} {step < 3 ? <>{t('ask.next')} <Icon name="chevronRight" /></> : t('ask.send')}
        </button>
      </>}>
      <div className="space-y-5">
        {/* where you are: 1 · 2 · 3 */}
        <div>
          <div className="mb-2 flex gap-1.5" aria-hidden="true">
            {[1, 2, 3].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= step ? 'brand-gradient' : 'bg-surface-2'}`} />)}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">{t('ask.stepOf', { n: step })}</p>
          <h3 className="mt-0.5 text-xl font-bold text-heading">{titles[step - 1]}</h3>
        </div>

        <div key={step} className="page-enter space-y-5">
          {open && step === 1 && <SlotPicker part="day" value={slot} onChange={setSlot} refreshKey={conflicts} />}
          {open && step === 2 && (
            <>
              <p className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold text-heading">{longDay(slot.date, true)}</p>
              <DurationPicker value={slot.hours} onChange={(h) => setSlot({ ...slot, hours: h })} />
              <ClassLangPicker value={classLang} onChange={setClassLang} />
              <p className="flex gap-2 text-sm text-ink-soft"><Icon name="whatsapp" className="mt-0.5 h-4 w-4 shrink-0" /> {t('ask.timeNote')}</p>
            </>
          )}
          {step === 3 && (
            <>
              <div className="rounded-2xl bg-tile p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-wide text-brand-200">{t('ask.when')}</div>
                <div className="mt-1 font-display text-2xl font-bold">{longDay(slot.date, true)}</div>
                <div className="mt-1 text-brand-100">{formatHours(slot.hours)} · {t('classLang.summary', { lang: classLangIn(classLang) })}</div>
                <div className="mt-0.5 text-sm text-brand-200">{t('lesson.tbdLong')}</div>
              </div>
              <p className="flex items-center gap-2 text-sm text-ink-soft"><Icon name="whatsapp" className="h-4 w-4 shrink-0" /> {t('ask.pendingNote')}</p>
              {needPhone && (
                <Field label={t('data.phone')} hint={<>{t('data.phoneHint')}<br />{t('ask.phoneWhy')}</>}>
                  {(id) => <input id={id} type="tel" inputMode="tel" autoComplete="tel" className="input" placeholder="+55 88 99999-1234"
                    value={phone} onChange={(e) => setPhone(e.target.value)} />}
                </Field>
              )}
              {!extras ? (
                <button type="button" className="text-sm font-semibold text-brand-deep underline underline-offset-2" onClick={() => setExtras(true)}>
                  {t('ask.extras')}
                </button>
              ) : (
                <div className="page-enter space-y-4">
                  <Field label={t('ask.instructor')}>
                    {(id) => (
                      <select id={id} className="input" value={instructor} onChange={(e) => setInstructor(e.target.value)}>
                        <option value="">{t('ask.anyInstructor')}</option>
                        {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field label={t('ask.message')}>
                    {(id) => <textarea id={id} className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
                      placeholder={t('ask.messagePh')} />}
                  </Field>
                </div>
              )}
            </>
          )}
        </div>
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
  const [slot, setSlot] = useState<Slot>({ date: today(), time: '', hours: 1.5 })
  const [note, setNote] = useState('')
  const [classLang, setClassLang] = useState<Lang>('es')
  const [students, setStudents] = useState<Person[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const { busy, error, setError, run, conflicts } = useSubmit()

  useEffect(() => {
    if (!open) return
    setError(null)
    setStudent(lesson?.student_id ?? '')
    setInstructor(lesson?.instructor_id ?? (isAdmin ? '' : myInstructorId ?? ''))
    setSlot(lesson
      ? { date: lesson.lesson_date < today() && isAdmin ? today() : lesson.lesson_date, time: shortTime(lesson.start_time), hours: lesson.hours }
      : { date: today(), time: '', hours: 1.5 })
    setNote('')
    setClassLang(lesson?.class_lang ?? 'es')
    void api.instructorDirectory().then(setPeople).catch(() => setPeople([]))
    if (!lesson) void api.listStudents().then(setStudents).catch(() => setStudents([]))
  }, [open, lesson, isAdmin, myInstructorId, setError])

  function submit() {
    if (!lesson && !student) return setError(t('err.pickStudent'))
    if (!instructor) return setError(t('err.pickInstructor'))
    if (!slot.time) return setError(t('err.pickTime'))
    void run(
      async () => {
        if (lesson) {
          await api.confirmLesson(lesson.id, instructor, slot.date, slot.time, slot.hours, note.trim())
          if (classLang !== (lesson.class_lang ?? 'es')) await api.setClassLang(lesson.id, classLang)
        } else {
          const id = await api.scheduleLesson(student, instructor, slot.date, slot.time, slot.hours, note.trim())
          if (classLang !== 'es') await api.setClassLang(id, classLang)
        }
      },
      t(lesson ? 'schedule.confirmed' : 'schedule.scheduled'),
      onClose,
    )
  }

  return (
    <Modal open={open} title={lesson ? t('schedule.titleConfirm', { name: lesson.student_name }) : t('schedule.titleNew')} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy} onClick={submit}>
          {busy && <Spinner />} {lesson ? t('common.confirm') : t('schedule.do')}
        </button>
      </>}>
      <div className="space-y-5">
        {!lesson && (
          <Field label={t('schedule.student')}>
            {(id) => (
              <select id={id} className="input" value={student} onChange={(e) => setStudent(e.target.value)}>
                <option value="">{t('schedule.pickStudent')}</option>
                {students.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
              </select>
            )}
          </Field>
        )}
        {lesson?.student_note && <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-soft">“{lesson.student_note}”</p>}
        <ClassLangPicker value={classLang} onChange={setClassLang} />
        <Field label={t('schedule.who')}>
          {(id) => (
            <select id={id} className="input" value={instructor} disabled={!isAdmin} onChange={(e) => setInstructor(e.target.value)}>
              <option value="">{t('schedule.pickInstructor')}</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          )}
        </Field>
        {open && (lesson && !isAdmin
          // instructors confirm on the day the student asked for: only the time is chosen
          ? <>
              <p className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm font-semibold text-heading">{longDay(slot.date, true)}</p>
              <SlotPicker part="time" value={slot} onChange={setSlot} excludeId={lesson.id} refreshKey={conflicts} allowPast />
            </>
          : <SlotPicker value={slot} onChange={setSlot} excludeId={lesson?.id ?? null} refreshKey={conflicts} allowPast />)}
        <Field label={t('schedule.message')}>
          {(id) => <textarea id={id} className="input min-h-20" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('schedule.messagePh')} />}
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
    <Modal open title={t('complete.title', { name: lesson.student_name })} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>{t('common.cancel')}</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy}
          onClick={() => void run(() => api.completeLesson(lesson.id, hours, note.trim(),
            Object.keys(marks).filter((k) => marks[k] === 'learning'),
            Object.keys(marks).filter((k) => marks[k] === 'done')), t('complete.saved'), onClose)}>
          {busy && <Spinner />} {t('complete.save')}
        </button>
      </>}>
      <div className="space-y-5">
        <p className="text-sm text-ink-soft">
          {t('complete.intro', { day: longDay(lesson.lesson_date, true), time: shortTime(lesson.start_time) })}
        </p>
        <DurationPicker value={hours} onChange={setHours} />
        <Field label={t('complete.how')}>
          {(id) => <textarea id={id} className="input min-h-24" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('complete.howPh')} />}
        </Field>
        <div>
          <div className="field-label">{t('complete.what')} <span className="font-normal text-ink-mute">{t('complete.whatHint')}</span></div>
          <div className="space-y-4">
            {levels.map((l) => (
              <div key={l}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-mute">{levelName(l)}</div>
                <div className="flex flex-wrap gap-2">
                  {skills.filter((s) => s.level === l).map((s) => {
                    const st = statusOf(s.id)
                    const locked = current[s.id] === 'done'
                    const [name] = skillText(s.name, s.description)
                    return (
                      <button key={s.id} type="button" onClick={() => cycle(s.id)} disabled={locked}
                        aria-label={`${name}: ${st === 'done' ? t('progress.done') : st === 'learning' ? t('progress.learning') : t('progress.unmarked')}`}
                        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition active:scale-95 ${
                          st === 'done' ? 'border-violet bg-violet text-white' + (locked ? ' opacity-70' : '')
                            : st === 'learning' ? 'border-brand bg-brand-soft text-brand-deep'
                              : 'border-line bg-surface text-ink-soft'}`}>
                        {st === 'done' && <Icon name="check" className="h-4 w-4" />}
                        {st === 'learning' && <span className="h-2 w-2 rounded-full bg-brand" />}
                        {name}
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
