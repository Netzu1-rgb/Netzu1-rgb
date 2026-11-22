import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useInstructors, useStudents } from '../lib/hooks'
import { createClass, createInstructor, fetchClass, updateClass } from '../lib/api'
import { useData } from '../lib/useData'
import { classAmounts, formatHours, formatMoney, fromCents, hasAtMostTwoDecimals, hoursToInput, parseDecimal, parseHours } from '../lib/money'
import { formatDate, today } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import type { ClassRow, Instructor, NewClassInput, NewInstructorInput, NewStudentInput, Student } from '../lib/types'
import { ErrorBox, Icon, Loading, OfflineNote, PageHeader, Spinner, useToast } from '../components/ui'

const HOUR_CHIPS = ['1', '1:30', '2', '2:30', '3']

const toInput = (n: number) => String(n).replace('.', ',')
const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')

interface Errors { [k: string]: string | undefined }

interface SavedInfo {
  queued: boolean
  student: string
  newStudent: boolean
  instructor: string
  hours: number
  total: number
}

/**
 * Add a class. It asks, in this order: the student's name, the price per hour and
 * who gives the class; then hours and date (prefilled). Typing a name that does
 * not exist creates the student when saving.
 */
export default function RegisterClass() {
  const { id: editId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin, profile, session, currency } = useAuth()
  const students = useStudents()
  const instructors = useInstructors()
  const editing = useData<ClassRow | null>(editId ? `class:${editId}` : null, () => fetchClass(editId!))

  const [name, setName] = useState('')
  const [student, setStudent] = useState<Student | null>(null)
  const [nameFocused, setNameFocused] = useState(false)
  const [rate, setRate] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [date, setDate] = useState(today())
  const [hours, setHours] = useState('1')
  const [pay, setPay] = useState('')
  const [payTouched, setPayTouched] = useState(false)
  // a new instructor typed in the form (admins): their name, and whether it is only for this class
  const [newIns, setNewIns] = useState<{ name: string; oneOff: boolean } | null>(null)
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  // optional parts stay hidden until asked for, so the form shows only what is needed
  const [showPhone, setShowPhone] = useState(false)
  const [showOtherHours, setShowOtherHours] = useState(false)
  const [showDate, setShowDate] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedInfo | null>(null)

  const choosable = useMemo(
    () => (instructors.data ?? []).filter((i) => i.active || i.id === instructorId),
    [instructors.data, instructorId],
  )
  const instructor: Instructor | undefined = instructors.data?.find((i) => i.id === instructorId)
  const isExternal = newIns !== null || instructor?.kind === 'external'
  const isOwner = newIns === null && instructor?.kind === 'owner'
  const settled = Boolean(editing.data?.settlement_id)

  // students whose name matches what is typed
  const suggestions = useMemo(() => {
    const q = normalize(name)
    if (!q || student) return []
    return (students.data ?? []).filter((s) => s.active && normalize(s.full_name).includes(q)).slice(0, 6)
  }, [name, student, students.data])
  const exactMatch = useMemo(
    () => (students.data ?? []).find((s) => normalize(s.full_name) === normalize(name)) ?? null,
    [name, students.data],
  )
  const isNewStudent = !student && name.trim().length > 0 && !exactMatch

  // instructors can only log their own classes
  useEffect(() => {
    if (!isAdmin && profile?.instructor_id && !instructorId) setInstructorId(profile.instructor_id)
  }, [isAdmin, profile?.instructor_id, instructorId])

  // ?alumno=<id> (from the student record) preselects the student
  useEffect(() => {
    const sid = params.get('alumno')
    if (!sid || student || editId || !students.data) return
    const s = students.data.find((x) => x.id === sid)
    if (s) pickStudent(s)
  }, [params, students.data])

  // load the class being edited
  useEffect(() => {
    const c = editing.data
    if (!c || !students.data) return
    const s = students.data.find((x) => x.id === c.student_id) ?? null
    setStudent(s)
    setName(s?.full_name ?? c.student?.full_name ?? '')
    setInstructorId(c.instructor_id)
    setDate(c.class_date)
    setHours(hoursToInput(c.hours))
    setRate(toInput(c.student_rate))
    setPay(toInput(c.instructor_rate))
    setNotes(c.notes ?? '')
    setShowDate(true)
    setShowNotes(Boolean(c.notes))
  }, [editing.data, students.data])

  function pickStudent(s: Student) {
    setStudent(s)
    setName(s.full_name)
    setRate(toInput(s.hourly_rate))
    setErrors((e) => ({ ...e, name: undefined, rate: undefined }))
    if (isAdmin && !instructorId && s.default_instructor_id && instructors.data?.some((i) => i.id === s.default_instructor_id && i.active)) {
      chooseInstructor(s.default_instructor_id)
    }
  }

  function typeName(v: string) {
    setName(v)
    if (student && normalize(v) !== normalize(student.full_name)) setStudent(null)
  }

  function chooseInstructor(id: string) {
    setInstructorId(id)
    setNewIns(null)
    setErrors((e) => ({ ...e, instructor: undefined }))
    const ins = instructors.data?.find((i) => i.id === id)
    // keep a pay the admin already typed; otherwise use the instructor's usual pay
    if (ins?.kind === 'external' && !payTouched) setPay(toInput(ins.hourly_pay))
  }

  function addInstructor() {
    setInstructorId('')
    setNewIns({ name: '', oneOff: true })
    setErrors((e) => ({ ...e, instructor: undefined }))
  }

  // an exact name match counts as choosing that student
  const chosen = student ?? exactMatch
  useEffect(() => {
    if (!student && exactMatch && !rate) setRate(toInput(exactMatch.hourly_rate))
  }, [exactMatch, student, rate])

  const hoursN = parseHours(hours)
  const rateN = parseDecimal(rate)
  const payN = isExternal ? (isAdmin ? parseDecimal(pay) : instructor?.hourly_pay ?? 0) : 0
  const amounts = hoursN !== null && rateN !== null ? classAmounts(hoursN, rateN, payN ?? 0) : null

  function validate(): Errors {
    const e: Errors = {}
    if (!name.trim()) e.name = 'Escribí el nombre del alumno.'
    if (rateN === null) e.rate = 'Ingresá el precio por hora.'
    else if (!hasAtMostTwoDecimals(rateN)) e.rate = 'Usá como máximo 2 decimales.'
    if (newIns) {
      if (!newIns.name.trim()) e.newIns = 'Escribí el nombre del instructor.'
    } else if (!instructorId) e.instructor = 'Elegí quién da la clase.'
    if (hoursN === null || hoursN <= 0 || hoursN > 24) e.hours = 'Ingresá la duración, por ejemplo 1:30 (en cuartos de hora: 00, 15, 30 o 45 minutos).'
    if (!date) e.date = 'Elegí la fecha.'
    if (isExternal && isAdmin) {
      if (payN === null) e.pay = 'El pago por hora del instructor es obligatorio.'
      else if (!hasAtMostTwoDecimals(payN)) e.pay = 'Usá como máximo 2 decimales.'
    }
    return e
  }

  // once errors are shown, recheck as the user types so a fixed field stops showing its message
  useEffect(() => {
    setErrors((prev) => (Object.values(prev).some(Boolean) ? validate() : prev))
  }, [name, rate, pay, instructorId, newIns, hours, date])

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    setFormError(null)
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean) || !session) return
    setBusy(true)
    try {
      let instructorInput: NewInstructorInput | undefined
      let instructorQueued = false
      if (newIns) {
        instructorInput = { id: crypto.randomUUID(), full_name: newIns.name.trim().replace(/\s+/g, ' '), hourly_pay: payN!, active: !newIns.oneOff }
        instructorQueued = (await createInstructor(instructorInput, session.user.id)) === 'queued'
      }
      const instructorIdToUse = instructorInput?.id ?? instructorId
      let studentInput: NewStudentInput | undefined
      if (!chosen) {
        studentInput = {
          id: crypto.randomUUID(), full_name: name.trim().replace(/\s+/g, ' '), phone: phone.trim() || null,
          start_date: date, hourly_rate: rateN!, default_instructor_id: instructorIdToUse, notes: null,
        }
      }
      const payload: NewClassInput = {
        id: editId ?? crypto.randomUUID(), student_id: chosen?.id ?? studentInput!.id, instructor_id: instructorIdToUse,
        class_date: date, hours: hoursN!, student_rate: rateN!, notes: notes.trim() || null,
      }
      if (isExternal && isAdmin) payload.instructor_rate = payN!
      if (editId) {
        const { id: _omit, ...changes } = payload
        void _omit
        await updateClass(editId, changes)
        toast('Clase actualizada.')
        navigate(-1)
        return
      }
      const result = await createClass(payload, session.user.id, studentInput, instructorQueued)
      setSaved({
        queued: result === 'queued', student: chosen?.full_name ?? studentInput!.full_name, newStudent: Boolean(studentInput),
        instructor: instructorInput?.full_name ?? instructor?.full_name ?? '', hours: hoursN!, total: fromCents(amounts!.totalCents),
      })
      if (studentInput) students.reload()
      if (instructorInput) {
        instructors.reload()
        setNewIns(null)
        setInstructorId(instructorInput.active ? instructorInput.id : '')
      }
      setPayTouched(false)
      // ready for the next class: keep who gives it and the date
      setName('')
      setStudent(null)
      setRate('')
      setHours('1')
      setPhone('')
      setNotes('')
      setShowPhone(false)
      setShowOtherHours(false)
      setShowNotes(false)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (students.loading && !students.data) return <Loading />
  if (editId && editing.loading && !editing.data) return <Loading />
  if (editId && !editing.loading && !editing.data) return <ErrorBox message="No se encontró la clase." />

  if (saved) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card overflow-hidden text-center">
          <div className={`px-6 py-8 ${saved.queued ? 'bg-sand' : 'bg-violet-soft'}`}>
            <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white ${saved.queued ? 'bg-night-700' : 'bg-violet'}`}>
              <Icon name={saved.queued ? 'cloudOff' : 'check'} className="h-8 w-8" strokeWidth={2.6} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-heading">{saved.queued ? 'Guardada en el dispositivo' : 'Clase registrada'}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {saved.queued ? 'No hay conexión. Se va a enviar sola cuando vuelva internet.' : 'Ya quedó guardada en el sistema.'}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="text-lg font-semibold">{saved.student}{saved.newStudent && <span className="badge ml-2 bg-brand-soft text-brand-deep align-middle">Alumno nuevo</span>}</div>
            <div className="tabular text-ink-mute">{formatHours(saved.hours)} con {saved.instructor} · {formatMoney(saved.total, currency)}</div>
          </div>
          <div className="grid gap-3 px-6 pb-6">
            <button type="button" className="btn-primary text-lg" onClick={() => setSaved(null)}>
              <Icon name="plus" /> Registrar otra clase
            </button>
            <Link to="/historial" className="btn-ghost">Ver historial</Link>
          </div>
        </div>
      </div>
    )
  }

  const durationIsChip = HOUR_CHIPS.some((h) => parseHours(h) === hoursN)
  const step1Done = Boolean(name.trim())
  const step2Done = rateN !== null && (!isAdmin || !isExternal || payN !== null)
  const step3Done = Boolean(instructorId || newIns?.name.trim())
  const step4Done = hoursN !== null && hoursN > 0 && Boolean(date)
  const money = (c?: number) => (c === undefined ? '—' : formatMoney(fromCents(c), currency))
  const symbol = formatMoney(0, currency).replace(/[\d.,\s]/g, '')

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={editId ? 'Editar clase' : 'Registrar clase'}
        subtitle={editId ? (editing.data ? formatDate(editing.data.class_date) : '') : 'Completá los 4 pasos y tocá “Guardar clase”.'} />
      {(students.offline || instructors.offline) && <OfflineNote savedAt={students.savedAt} />}
      {settled && <div className="mb-4"><ErrorBox message="Esta clase ya fue liquidada y pagada: no se puede modificar." /></div>}
      {students.error && !students.data && <div className="mb-4"><ErrorBox message={students.error} onRetry={students.reload} /></div>}

      <form onSubmit={submit} noValidate>
        <fieldset disabled={settled || busy} className="space-y-4">
          {/* 1. student */}
          <Step n={1} done={step1Done} title="Alumno" hint="Escribí su nombre. Si ya vino antes, tocalo en la lista.">
            <div className="relative">
              <input id="f-name" aria-label="Nombre del alumno" aria-invalid={Boolean(errors.name)}
                className={`${errors.name ? 'input-error' : 'input'} text-lg`} autoComplete="off" autoCapitalize="words"
                placeholder="Nombre y apellido" value={name} onChange={(e) => typeName(e.target.value)}
                onFocus={() => setNameFocused(true)} onBlur={() => setTimeout(() => setNameFocused(false), 150)} />
              {nameFocused && suggestions.length > 0 && (
                <ul className="absolute inset-x-0 z-20 mt-1 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickStudent(s)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left active:bg-surface-2">
                        <span className="truncate font-medium">{s.full_name}</span>
                        <span className="shrink-0 text-sm text-ink-mute">{formatMoney(s.hourly_rate, currency)}/h</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <FieldError text={errors.name} />
            {chosen && !editId && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-violet-deep">
                <Icon name="check" className="h-4 w-4" /> Alumno ya registrado{chosen.pending ? ' (sin sincronizar)' : ''}
              </p>
            )}
            {isNewStudent && (
              <div className="mt-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm text-heading">
                <b>Alumno nuevo:</b> se crea su ficha al guardar.
                {showPhone ? (
                  <input className="input mt-2" type="tel" inputMode="tel" placeholder="Teléfono (opcional)"
                    aria-label="Teléfono del alumno (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                ) : (
                  <button type="button" className="ml-1 font-semibold text-brand-deep underline underline-offset-2" onClick={() => setShowPhone(true)}>
                    Agregar teléfono
                  </button>
                )}
              </div>
            )}
          </Step>

          {/* 2. price */}
          <Step n={2} done={step2Done} title="Precio por hora" hint={chosen && rateN !== null && rateN !== chosen.hourly_rate
            ? `Solo para esta clase. Su ficha sigue en ${formatMoney(chosen.hourly_rate, currency)}.`
            : 'Lo que paga el alumno por cada hora de clase.'}>
            <MoneyInput id="f-rate" label="Precio por hora que paga el alumno" symbol={symbol} value={rate} onChange={setRate}
              invalid={Boolean(errors.rate)} big />
            <FieldError text={errors.rate} />
            {isAdmin && (
              <div className="mt-4 border-t border-line pt-4">
                {isOwner ? (
                  <p className="text-sm text-ink-soft"><b className="text-heading">Pago al instructor:</b> la da un dueño, no se le paga por hora.</p>
                ) : (
                  <>
                    <label htmlFor="f-pay" className="mb-1.5 block font-semibold text-heading">Pago al instructor por hora</label>
                    <MoneyInput id="f-pay" label="Pago al instructor por hora" symbol={symbol} value={pay} invalid={Boolean(errors.pay)}
                      onChange={(v) => { setPay(v); setPayTouched(true) }} />
                    <FieldError text={errors.pay} />
                    <p className="mt-1.5 text-sm text-ink-mute">
                      {instructor && !newIns ? `Su valor habitual: ${formatMoney(instructor.hourly_pay, currency)}.` : 'Se completa al elegir un instructor externo.'}
                    </p>
                  </>
                )}
                {rateN !== null && (
                  <p className="tabular mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-soft">
                    Por cada hora: alumno <b className="text-heading">{formatMoney(rateN, currency)}</b> − instructor{' '}
                    <b className="text-heading">{formatMoney(isExternal ? payN ?? 0 : 0, currency)}</b> = escuela{' '}
                    <b className="text-violet-deep">{formatMoney(fromCents(Math.round(rateN * 100) - Math.round((isExternal ? payN ?? 0 : 0) * 100)), currency)}</b>
                  </p>
                )}
              </div>
            )}
          </Step>

          {/* 3. instructor */}
          <Step n={3} done={step3Done} title="Instructor" hint={isAdmin ? '¿Quién da la clase?' : 'La clase queda a tu nombre.'}>
            {isAdmin ? (
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Quién da la clase">
                {choosable.map((i) => {
                  const on = instructorId === i.id && !newIns
                  return (
                    <button key={i.id} type="button" role="radio" aria-checked={on} onClick={() => chooseInstructor(i.id)}
                      className={`flex min-h-14 items-center gap-3 rounded-xl border-2 px-3 text-left transition active:scale-[0.99] ${
                        on ? 'border-selected bg-selected text-white' : errors.instructor ? 'border-coral bg-surface' : 'border-line bg-surface'}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold ${on ? 'bg-white/20' : 'bg-brand-soft text-brand-deep'}`}>
                        {on ? <Icon name="check" className="h-5 w-5" /> : i.full_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{i.full_name}</span>
                        <span className={`block text-xs ${on ? 'text-white' : 'text-ink-mute'}`}>
                          {i.kind === 'owner' ? 'Dueño' : `Externo · ${formatMoney(i.hourly_pay, currency)}/h`}
                        </span>
                      </span>
                    </button>
                  )
                })}
                <button type="button" role="radio" aria-checked={newIns !== null} onClick={addInstructor}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border-2 border-dashed px-3 text-left font-semibold transition ${
                    newIns ? 'border-selected bg-selected text-white' : 'border-line-strong bg-surface text-heading'}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${newIns ? 'bg-white/20' : 'bg-surface-2'}`}>
                    <Icon name="plus" className="h-5 w-5" />
                  </span>
                  Otro instructor
                </button>
              </div>
            ) : (
              <div className="input flex items-center bg-surface-2 font-semibold">{instructor?.full_name ?? profile?.full_name ?? '—'}</div>
            )}
            <FieldError text={errors.instructor} />
            {newIns && (
              <div className="mt-3 space-y-3 rounded-xl bg-brand-soft p-3">
                <label htmlFor="f-newins" className="block font-semibold text-heading">Nombre del nuevo instructor</label>
                <input id="f-newins" className={errors.newIns ? 'input-error' : 'input'} autoFocus autoCapitalize="words"
                  placeholder="Nombre y apellido" value={newIns.name} onChange={(e) => setNewIns({ ...newIns, name: e.target.value })} />
                <FieldError text={errors.newIns} />
                <label className="flex items-start gap-3 text-sm text-heading">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brand" checked={newIns.oneOff}
                    onChange={(e) => setNewIns({ ...newIns, oneOff: e.target.checked })} />
                  <span><b>Solo para esta clase.</b> No aparece la próxima vez, pero queda en Liquidaciones para pagarle.</span>
                </label>
              </div>
            )}
          </Step>

          {/* 4. duration and date */}
          <Step n={4} done={step4Done} title="Duración y fecha" hint="Cuánto duró la clase.">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Duración de la clase">
              {HOUR_CHIPS.map((h) => {
                const on = !showOtherHours && parseHours(h) === hoursN
                return (
                  <button key={h} type="button" role="radio" aria-checked={on}
                    onClick={() => { setHours(h); setShowOtherHours(false) }}
                    className={`min-h-14 rounded-xl border-2 text-lg font-bold transition active:scale-95 ${on ? 'border-selected bg-selected text-white' : 'border-line bg-surface text-heading'}`}>
                    {h} <span className="text-sm font-semibold">hs</span>
                  </button>
                )
              })}
              <button type="button" role="radio" aria-checked={showOtherHours || !durationIsChip}
                onClick={() => setShowOtherHours(true)}
                className={`min-h-14 rounded-xl border-2 text-base font-semibold transition active:scale-95 ${showOtherHours || !durationIsChip ? 'border-selected bg-selected text-white' : 'border-line bg-surface text-heading'}`}>
                Otra
              </button>
            </div>
            {(showOtherHours || !durationIsChip) && (
              <div className="mt-3">
                <label htmlFor="f-hours" className="mb-1.5 block font-semibold text-heading">Duración (horas:minutos)</label>
                <input id="f-hours" className={`${errors.hours ? 'input-error' : 'input'} text-lg`} inputMode="decimal" placeholder="1:45"
                  autoFocus={showOtherHours} value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
            )}
            <FieldError text={errors.hours} />

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
              <span className="flex items-center gap-2 text-heading">
                <Icon name="calendar" className="h-5 w-5 text-brand-deep" />
                <span><span className="text-sm text-ink-mute">Fecha: </span><b>{date === today() ? `Hoy, ${formatDate(date)}` : formatDate(date)}</b></span>
              </span>
              {!showDate && (
                <button type="button" className="text-sm font-semibold text-brand-deep underline underline-offset-2" onClick={() => setShowDate(true)}>
                  Cambiar
                </button>
              )}
            </div>
            {showDate && (
              <input id="f-date" type="date" aria-label="Fecha de la clase" className={`${errors.date ? 'input-error' : 'input'} mt-2`}
                value={date} max={editId ? undefined : today()} onChange={(e) => setDate(e.target.value)} />
            )}
            <FieldError text={errors.date} />

            {showNotes ? (
              <div className="mt-4">
                <label htmlFor="f-notes" className="mb-1.5 block font-semibold text-heading">Nota (opcional)</label>
                <textarea id="f-notes" className="input min-h-20" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Viento, equipo, progreso…" />
              </div>
            ) : (
              <button type="button" className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-deep" onClick={() => setShowNotes(true)}>
                <Icon name="plus" className="h-4 w-4" /> Agregar una nota (opcional)
              </button>
            )}
          </Step>

          {/* summary and the only main action */}
          <section className="card sticky bottom-[88px] z-10 p-3 shadow-lg lg:bottom-4 lg:p-4" aria-label="Resumen de la clase">
            <dl className={`grid gap-1 text-center ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {[
                ['Cobrás', amounts?.totalCents, 'text-heading'],
                ['Instructor', amounts?.instructorPayCents, 'text-heading'],
                ...(isAdmin ? [['Queda escuela', amounts?.profitCents, 'text-violet-deep']] : []),
              ].map(([label, cents, color]) => (
                <div key={label as string}>
                  <dt className="text-[11px] font-semibold uppercase leading-tight text-ink-mute">{label}</dt>
                  <dd className={`tabular font-display text-base font-bold leading-tight sm:text-lg ${color}`}>{money(cents as number | undefined)}</dd>
                </div>
              ))}
            </dl>
            {formError && <div className="mt-2"><ErrorBox message={formError} /></div>}
            <button type="submit" className="btn-primary mt-2 w-full text-lg">
              {busy ? <Spinner /> : <Icon name="check" />} {editId ? 'Guardar cambios' : 'Guardar clase'}
            </button>
          </section>
        </fieldset>
      </form>
    </div>
  )
}

/** One numbered step: a clear title that says what to do, a short hint, and its fields. */
function Step({ n, title, hint, done, children }: { n: number; title: string; hint?: string; done: boolean; children: React.ReactNode }) {
  const id = `step-${n}`
  return (
    <section className="card p-4 sm:p-5" aria-labelledby={id}>
      <div className="mb-3 flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-base font-bold text-white ${done ? 'bg-violet' : 'brand-gradient'}`}
          aria-hidden="true">
          {done ? <Icon name="check" className="h-5 w-5" strokeWidth={3} /> : n}
        </span>
        <div className="min-w-0">
          <h2 id={id} className="text-lg font-bold leading-tight text-heading">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-ink-mute">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function MoneyInput({ id, label, symbol, value, onChange, invalid, big }: {
  id: string; label: string; symbol: string; value: string; onChange: (v: string) => void; invalid?: boolean; big?: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-mute" aria-hidden="true">{symbol}</span>
      <input id={id} aria-label={label} aria-invalid={invalid} className={`${invalid ? 'input-error' : 'input'} pl-12 font-semibold ${big ? 'text-xl' : ''}`}
        inputMode="decimal" placeholder="0,00" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function FieldError({ text }: { text?: string }) {
  return text ? <p className="mt-1.5 text-sm font-medium text-coral" role="alert">{text}</p> : null
}
