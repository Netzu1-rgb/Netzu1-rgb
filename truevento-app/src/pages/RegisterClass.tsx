import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useInstructors, useStudents } from '../lib/hooks'
import { createClass, fetchClass, updateClass } from '../lib/api'
import { useData } from '../lib/useData'
import { classAmounts, formatHours, formatMoney, fromCents, hasAtMostTwoDecimals, hoursToInput, parseDecimal, parseHours } from '../lib/money'
import { formatDate, today } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import type { ClassRow, Instructor, NewClassInput, NewStudentInput, Student } from '../lib/types'
import { ErrorBox, Field, Icon, Loading, OfflineNote, PageHeader, Spinner, useToast } from '../components/ui'

const HOUR_CHIPS = ['1', '1:30', '2', '2:30', '3']

const toInput = (n: number) => String(n).replace('.', ',')
const normalize = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')

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
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedInfo | null>(null)

  const choosable = useMemo(
    () => (instructors.data ?? []).filter((i) => i.active || i.id === instructorId),
    [instructors.data, instructorId],
  )
  const instructor: Instructor | undefined = instructors.data?.find((i) => i.id === instructorId)
  const isExternal = instructor?.kind === 'external'
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
    setErrors((e) => ({ ...e, instructor: undefined }))
    const ins = instructors.data?.find((i) => i.id === id)
    setPay(ins && ins.kind === 'external' ? toInput(ins.hourly_pay) : '')
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
    if (!instructorId) e.instructor = 'Elegí quién da la clase.'
    if (hoursN === null || hoursN <= 0 || hoursN > 24) e.hours = 'Ingresá la duración, por ejemplo 1:30 (en cuartos de hora: 00, 15, 30 o 45 minutos).'
    if (!date) e.date = 'Elegí la fecha.'
    if (isExternal && isAdmin) {
      if (payN === null) e.pay = 'El pago por hora del instructor es obligatorio.'
      else if (!hasAtMostTwoDecimals(payN)) e.pay = 'Usá como máximo 2 decimales.'
    }
    return e
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    setFormError(null)
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean) || !session) return
    setBusy(true)
    try {
      let studentInput: NewStudentInput | undefined
      if (!chosen) {
        studentInput = {
          id: crypto.randomUUID(), full_name: name.trim().replace(/\s+/g, ' '), phone: phone.trim() || null,
          start_date: date, hourly_rate: rateN!, default_instructor_id: instructorId, notes: null,
        }
      }
      const payload: NewClassInput = {
        id: editId ?? crypto.randomUUID(), student_id: chosen?.id ?? studentInput!.id, instructor_id: instructorId,
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
      const result = await createClass(payload, session.user.id, studentInput)
      setSaved({
        queued: result === 'queued', student: chosen?.full_name ?? studentInput!.full_name, newStudent: Boolean(studentInput),
        instructor: instructor?.full_name ?? '', hours: hoursN!, total: fromCents(amounts!.totalCents),
      })
      if (studentInput) students.reload()
      // ready for the next class: keep who gives it and the date
      setName('')
      setStudent(null)
      setRate('')
      setHours('1')
      setPhone('')
      setNotes('')
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
          <div className={`px-6 py-8 ${saved.queued ? 'bg-sand' : 'bg-lagoon-soft'}`}>
            <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-white ${saved.queued ? 'bg-ocean-700' : 'bg-lagoon'}`}>
              <Icon name={saved.queued ? 'cloudOff' : 'check'} className="h-8 w-8" strokeWidth={2.6} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-ocean-900">{saved.queued ? 'Guardada en el dispositivo' : 'Clase registrada'}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {saved.queued ? 'No hay conexión. Se va a enviar sola cuando vuelva internet.' : 'Ya quedó guardada en el sistema.'}
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="text-lg font-semibold">{saved.student}{saved.newStudent && <span className="badge ml-2 bg-sky-soft text-sky-deep align-middle">Alumno nuevo</span>}</div>
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={editId ? 'Editar clase' : 'Registrar clase'}
        subtitle={editId ? (editing.data ? formatDate(editing.data.class_date) : '') : 'Alumno, precio por hora y quién da la clase.'} />
      {(students.offline || instructors.offline) && <OfflineNote savedAt={students.savedAt} />}
      {settled && <div className="mb-4"><ErrorBox message="Esta clase ya fue liquidada y pagada: no se puede modificar." /></div>}
      {students.error && !students.data && <div className="mb-4"><ErrorBox message={students.error} onRetry={students.reload} /></div>}

      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset disabled={settled || busy} className="space-y-5">
          <section className="card space-y-6 p-4 sm:p-6">
            {/* 1. student */}
            <div className="relative">
              <Field label="1. Nombre del alumno" error={errors.name}>
                {(id) => (
                  <input id={id} className={errors.name ? 'input-error' : 'input'} autoComplete="off" autoCapitalize="words"
                    placeholder="Nombre y apellido" value={name} onChange={(e) => typeName(e.target.value)}
                    onFocus={() => setNameFocused(true)} onBlur={() => setTimeout(() => setNameFocused(false), 150)} />
                )}
              </Field>
              {nameFocused && suggestions.length > 0 && (
                <ul className="absolute inset-x-0 z-20 mt-1 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickStudent(s)}
                        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left active:bg-slate-50">
                        <span className="truncate font-medium">{s.full_name}</span>
                        <span className="shrink-0 text-sm text-ink-mute">{formatMoney(s.hourly_rate, currency)}/h</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {chosen && !editId && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-teal-700">
                  <Icon name="check" className="h-4 w-4" /> Alumno existente{chosen.pending ? ' (sin sincronizar)' : ''}
                </p>
              )}
              {isNewStudent && (
                <div className="mt-2 rounded-xl bg-sky-soft px-3 py-2.5 text-sm text-ocean-800">
                  <b>Alumno nuevo:</b> se crea su ficha al guardar.
                  <input className="input mt-2 bg-white" type="tel" inputMode="tel" placeholder="Teléfono (opcional)"
                    aria-label="Teléfono del alumno (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              )}
            </div>

            {/* 2. price per hour */}
            <Field label="2. Precio por hora" error={errors.rate}
              hint={chosen && rateN !== null && rateN !== chosen.hourly_rate
                ? `Solo para esta clase. La ficha de ${chosen.full_name.split(' ')[0]} sigue en ${formatMoney(chosen.hourly_rate, currency)}.`
                : chosen ? 'Completado desde la ficha del alumno. Podés cambiarlo para esta clase.' : 'Lo que paga este alumno por cada hora.'}>
              {(id) => (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink-mute">
                    {formatMoney(0, currency).replace(/[\d.,\s]/g, '')}
                  </span>
                  <input id={id} className={`${errors.rate ? 'input-error' : 'input'} pl-12 text-lg font-semibold`} inputMode="decimal"
                    placeholder="0,00" value={rate} onChange={(e) => setRate(e.target.value)} />
                </div>
              )}
            </Field>

            {/* 3. who gives the class */}
            <div>
              <span className="field-label">3. ¿Quién da la clase?</span>
              {isAdmin ? (
                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Quién da la clase">
                  {choosable.map((i) => (
                    <button key={i.id} type="button" role="radio" aria-checked={instructorId === i.id} onClick={() => chooseInstructor(i.id)}
                      className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 text-left transition active:scale-[0.99] ${
                        instructorId === i.id ? 'border-ocean-900 bg-ocean-900 text-white' : errors.instructor ? 'border-coral bg-white' : 'border-line bg-white'}`}>
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold ${
                        instructorId === i.id ? 'bg-white/15 text-white' : 'bg-sky-soft text-sky-deep'}`}>{i.full_name.charAt(0).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{i.full_name}</span>
                        <span className={`block text-xs ${instructorId === i.id ? 'text-sky-200' : 'text-ink-mute'}`}>
                          {i.kind === 'owner' ? 'Dueño' : `Externo · ${formatMoney(i.hourly_pay, currency)}/h`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="input flex items-center bg-slate-50 font-semibold">{instructor?.full_name ?? profile?.full_name ?? '—'}</div>
              )}
              {errors.instructor && <p className="mt-1.5 text-sm font-medium text-coral">{errors.instructor}</p>}
            </div>

            {isExternal && isAdmin && (
              <Field label="Pago por hora del instructor" error={errors.pay}
                hint={`Valor de su ficha: ${formatMoney(instructor!.hourly_pay, currency)}. Podés cambiarlo para esta clase.`}>
                {(id) => <input id={id} className={errors.pay ? 'input-error' : 'input'} inputMode="decimal" value={pay}
                  onChange={(e) => setPay(e.target.value)} />}
              </Field>
            )}

            {/* hours and date: prefilled, quick to adjust */}
            <div className="space-y-5 border-t border-line pt-5">
              <div>
                <span className="field-label">Horas</span>
                <div className="flex flex-wrap gap-2" aria-label="Horas rápidas">
                  {HOUR_CHIPS.map((h) => (
                    <button key={h} type="button" className={`${parseHours(h) === hoursN ? 'chip-on' : 'chip'} min-h-12 min-w-14`}
                      onClick={() => setHours(h)}>
                      {h} hs
                    </button>
                  ))}
                  <input className={`${errors.hours ? 'input-error' : 'input'} w-24 flex-none text-center`} inputMode="decimal"
                    aria-label="Otra duración (horas:minutos)" placeholder="1:45" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
                {errors.hours && <p className="mt-1.5 text-sm font-medium text-coral">{errors.hours}</p>}
              </div>
              <Field label="Fecha" error={errors.date}>
                {(id) => <input id={id} type="date" className={errors.date ? 'input-error' : 'input'} value={date}
                  max={editId ? undefined : today()} onChange={(e) => setDate(e.target.value)} />}
              </Field>
            </div>

            <Field label="Observaciones (opcional)">
              {(id) => <textarea id={id} className="input min-h-20" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Viento, equipo, progreso…" />}
            </Field>
          </section>

          <section className="card sticky bottom-24 z-10 p-4 shadow-lg lg:bottom-4">
            <div className={`grid gap-2 text-center ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-mute">Total clase</div>
                <div className="tabular font-display text-lg font-bold text-ocean-900">{amounts ? formatMoney(fromCents(amounts.totalCents), currency) : '—'}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-ink-mute">Pago instructor</div>
                <div className="tabular font-display text-lg font-bold text-ocean-900">{amounts ? formatMoney(fromCents(amounts.instructorPayCents), currency) : '—'}</div>
              </div>
              {isAdmin && (
                <div>
                  <div className="text-xs font-semibold uppercase text-ink-mute">Ganancia</div>
                  <div className="tabular font-display text-lg font-bold text-lagoon">{amounts ? formatMoney(fromCents(amounts.profitCents), currency) : '—'}</div>
                </div>
              )}
            </div>
            {formError && <div className="mt-3"><ErrorBox message={formError} /></div>}
            <button type="submit" className="btn-primary mt-3 w-full text-lg">
              {busy ? <Spinner /> : <Icon name="check" />} {editId ? 'Guardar cambios' : 'Guardar clase'}
            </button>
          </section>
        </fieldset>
      </form>
    </div>
  )
}
