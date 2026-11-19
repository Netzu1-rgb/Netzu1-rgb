import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useInstructors, useStudents } from '../lib/hooks'
import { createClass, fetchClass, updateClass } from '../lib/api'
import { useData } from '../lib/useData'
import { classAmounts, formatHours, formatMoney, fromCents, hasAtMostTwoDecimals, parseDecimal } from '../lib/money'
import { formatDate, today } from '../lib/dates'
import { friendlyError } from '../lib/errors'
import type { ClassRow, Instructor, NewClassInput, NewStudentInput, Student } from '../lib/types'
import StudentPicker from '../components/StudentPicker'
import { ErrorBox, Field, Icon, Loading, OfflineNote, PageHeader, Spinner, useToast } from '../components/ui'

const HOUR_CHIPS = ['1', '1,5', '2', '2,5', '3']
const PRICE_REASONS = ['Oferta', 'Paquete', 'Descuento', 'Clase de prueba', 'Promoción']
type PriceMode = 'hour' | 'total'

const toInput = (n: number) => String(n).replace('.', ',')

interface Errors { [k: string]: string | undefined }

interface SavedInfo {
  queued: boolean
  student: string
  hours: number
  total: number
  note: string | null
}

export default function RegisterClass() {
  const { id: editId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin, profile, session, currency } = useAuth()
  const students = useStudents()
  const instructors = useInstructors()
  const editing = useData<ClassRow | null>(editId ? `class:${editId}` : null, () => fetchClass(editId!))

  const [student, setStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState<{ name: string; phone: string; rate: string } | null>(null)
  const [instructorId, setInstructorId] = useState<string>('')
  const [date, setDate] = useState(today())
  const [hours, setHours] = useState('1')
  const [rate, setRate] = useState('')
  const [pay, setPay] = useState('')
  const [priceMode, setPriceMode] = useState<PriceMode>('hour')
  const [fixedTotal, setFixedTotal] = useState('')
  const [priceNote, setPriceNote] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedInfo | null>(null)

  const activeInstructors = useMemo(
    () => (instructors.data ?? []).filter((i) => i.active || i.id === instructorId),
    [instructors.data, instructorId],
  )
  const instructor: Instructor | undefined = instructors.data?.find((i) => i.id === instructorId)
  const isExternal = instructor?.kind === 'external'
  const settled = Boolean(editing.data?.settlement_id)

  // default instructor: yourself (instructors can only log their own classes)
  useEffect(() => {
    if (!instructorId && profile?.instructor_id && !editId) setInstructorId(profile.instructor_id)
  }, [profile?.instructor_id, instructorId, editId])

  // preselect a student from ?alumno=<id>
  useEffect(() => {
    const sid = params.get('alumno')
    if (sid && !student && students.data && !editId) {
      const s = students.data.find((x) => x.id === sid)
      if (s) pickStudent(s)
    }
  }, [params, students.data])

  // load the class being edited
  useEffect(() => {
    const c = editing.data
    if (!c || !students.data) return
    setStudent(students.data.find((s) => s.id === c.student_id) ?? {
      id: c.student_id, full_name: c.student?.full_name ?? 'Alumno', phone: null, start_date: c.class_date,
      hourly_rate: c.student_rate, default_instructor_id: null, notes: null, active: true,
    })
    setInstructorId(c.instructor_id)
    setDate(c.class_date)
    setHours(toInput(c.hours))
    setRate(toInput(c.student_rate))
    setPay(toInput(c.instructor_rate))
    setPriceMode(c.fixed_total !== null ? 'total' : 'hour')
    setFixedTotal(c.fixed_total !== null ? toInput(c.fixed_total) : '')
    setPriceNote(c.price_note ?? '')
    setNotes(c.notes ?? '')
  }, [editing.data, students.data])

  function pickStudent(s: Student | null) {
    setStudent(s)
    setNewStudent(null)
    setErrors((e) => ({ ...e, student: undefined }))
    if (s) {
      setRate(toInput(s.hourly_rate))
      if (isAdmin && s.default_instructor_id && instructors.data?.some((i) => i.id === s.default_instructor_id && i.active)) {
        changeInstructor(s.default_instructor_id)
      }
    }
  }

  function changeInstructor(id: string) {
    setInstructorId(id)
    const ins = instructors.data?.find((i) => i.id === id)
    setPay(ins && ins.kind === 'external' ? toInput(ins.hourly_pay) : '')
  }

  // keep the instructor's pay in sync when their record loads
  useEffect(() => {
    if (!editId && instructor?.kind === 'external' && pay === '') setPay(toInput(instructor.hourly_pay))
  }, [instructor, editId, pay])

  const hoursN = parseDecimal(hours)
  const rateN = newStudent ? parseDecimal(newStudent.rate) : parseDecimal(rate)
  const fixedN = priceMode === 'total' ? parseDecimal(fixedTotal) : null
  const payN = isExternal ? (isAdmin ? parseDecimal(pay) : instructor?.hourly_pay ?? 0) : 0
  const amounts = hoursN === null ? null
    : priceMode === 'total' ? (fixedN === null ? null : classAmounts(hoursN, 0, payN ?? 0, fixedN))
    : rateN === null ? null : classAmounts(hoursN, rateN, payN ?? 0)
  // the usual price of the student, to tell when this class has a special one
  const usualRate = newStudent ? null : student?.hourly_rate ?? null
  const specialPrice = priceMode === 'total' || (usualRate !== null && rateN !== null && rateN !== usualRate)

  function validate(): Errors {
    const e: Errors = {}
    if (!student && !newStudent) e.student = 'Elegí un alumno o creá uno nuevo.'
    if (newStudent && !newStudent.name.trim()) e.newName = 'Escribí el nombre y apellido.'
    if (!instructorId) e.instructor = 'Elegí el instructor.'
    if (!date) e.date = 'Elegí la fecha.'
    if (hoursN === null || hoursN <= 0 || hoursN > 24) e.hours = 'Ingresá las horas (por ejemplo 1,5).'
    else if (!hasAtMostTwoDecimals(hoursN)) e.hours = 'Usá como máximo 2 decimales.'
    // per-hour price: needed in hourly mode, and always for a new student's record
    if (priceMode === 'hour' || newStudent) {
      if (rateN === null) e.rate = 'Ingresá el precio por hora.'
      else if (!hasAtMostTwoDecimals(rateN)) e.rate = 'Usá como máximo 2 decimales.'
    }
    if (priceMode === 'total') {
      if (fixedN === null) e.fixedTotal = 'Ingresá el precio total de la clase.'
      else if (!hasAtMostTwoDecimals(fixedN)) e.fixedTotal = 'Usá como máximo 2 decimales.'
    }
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
    if (Object.values(e).some(Boolean)) return
    if (!session) return
    setBusy(true)
    try {
      let studentId = student?.id ?? ''
      let studentInput: NewStudentInput | undefined
      if (newStudent) {
        studentInput = {
          id: crypto.randomUUID(), full_name: newStudent.name.trim(), phone: newStudent.phone.trim() || null,
          start_date: date, hourly_rate: rateN!, default_instructor_id: instructorId, notes: null,
        }
        studentId = studentInput.id
      }
      const payload: NewClassInput = {
        id: editId ?? crypto.randomUUID(), student_id: studentId, instructor_id: instructorId, class_date: date,
        hours: hoursN!,
        // with a total price the database stores the resulting price per hour
        student_rate: priceMode === 'total' ? rateN ?? usualRate ?? 0 : rateN!,
        fixed_total: priceMode === 'total' ? fixedN : null,
        price_note: specialPrice ? priceNote.trim() || null : null,
        notes: notes.trim() || null,
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
        queued: result === 'queued', student: studentInput?.full_name ?? student!.full_name,
        hours: hoursN!, total: fromCents(amounts!.totalCents), note: payload.price_note ?? null,
      })
      if (studentInput) students.reload()
      // ready for the next class: keep instructor and date
      setStudent(null)
      setNewStudent(null)
      setHours('1')
      setRate('')
      setPriceMode('hour')
      setFixedTotal('')
      setPriceNote('')
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
            <div className="text-lg font-semibold">{saved.student}</div>
            <div className="tabular text-ink-mute">{formatHours(saved.hours)} · {formatMoney(saved.total, currency)}{saved.note ? ` · ${saved.note}` : ''}</div>
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
        subtitle={editId ? (editing.data ? formatDate(editing.data.class_date) : '') : 'Completá los datos y guardá. Lleva unos segundos.'} />
      {(students.offline || instructors.offline) && <OfflineNote savedAt={students.savedAt} />}
      {settled && (
        <div className="mb-4"><ErrorBox message="Esta clase ya fue liquidada y pagada: no se puede modificar." /></div>
      )}
      {students.error && !students.data && <div className="mb-4"><ErrorBox message={students.error} onRetry={students.reload} /></div>}

      <form onSubmit={submit} noValidate className="space-y-5">
        <fieldset disabled={settled || busy} className="space-y-5">
          <section className="card space-y-5 p-4 sm:p-6">
            <div>
              <span className="field-label">Alumno</span>
              {newStudent ? (
                <div className="space-y-3 rounded-xl border border-dashed border-ocean-700/40 bg-sand/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ocean-900">Nuevo alumno</span>
                    <button type="button" className="text-sm font-semibold text-sky-deep" onClick={() => setNewStudent(null)}>Elegir existente</button>
                  </div>
                  <Field label="Nombre y apellido" error={errors.newName}>
                    {(id) => <input id={id} className={errors.newName ? 'input-error' : 'input'} autoFocus value={newStudent.name}
                      onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />}
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Teléfono (opcional)">
                      {(id) => <input id={id} className="input" type="tel" inputMode="tel" value={newStudent.phone}
                        onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} />}
                    </Field>
                    <Field label="Precio por hora" error={errors.rate}>
                      {(id) => <input id={id} className={errors.rate ? 'input-error' : 'input'} inputMode="decimal" placeholder="0,00"
                        value={newStudent.rate} onChange={(e) => setNewStudent({ ...newStudent, rate: e.target.value })} />}
                    </Field>
                  </div>
                  <p className="text-xs text-ink-mute">Se crea su ficha con este precio y fecha de inicio {formatDate(date)}.</p>
                </div>
              ) : students.data ? (
                <StudentPicker students={students.data} value={student} onChange={pickStudent} currency={currency}
                  invalid={Boolean(errors.student)}
                  onCreateNew={(name) => { setStudent(null); setNewStudent({ name, phone: '', rate: '' }) }} />
              ) : null}
              {errors.student && <p className="mt-1.5 text-sm font-medium text-coral">{errors.student}</p>}
            </div>

            {isAdmin ? (
              <Field label="Instructor" error={errors.instructor}>
                {(id) => (
                  <select id={id} className={errors.instructor ? 'input-error' : 'input'} value={instructorId}
                    onChange={(e) => changeInstructor(e.target.value)}>
                    <option value="">Elegí el instructor…</option>
                    {activeInstructors.map((i) => (
                      <option key={i.id} value={i.id}>{i.full_name}{i.kind === 'owner' ? ' (dueño)' : ''}</option>
                    ))}
                  </select>
                )}
              </Field>
            ) : (
              <div>
                <span className="field-label">Instructor</span>
                <div className="input flex items-center bg-slate-50">{instructor?.full_name ?? profile?.full_name ?? '—'}</div>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Fecha" error={errors.date}>
                {(id) => <input id={id} type="date" className={errors.date ? 'input-error' : 'input'} value={date}
                  max={editId ? undefined : today()} onChange={(e) => setDate(e.target.value)} />}
              </Field>
              <Field label="Horas" error={errors.hours}>
                {(id) => <input id={id} className={errors.hours ? 'input-error' : 'input'} inputMode="decimal" value={hours}
                  onChange={(e) => setHours(e.target.value)} />}
              </Field>
            </div>
            <div className="-mt-2 flex flex-wrap gap-2" aria-label="Horas rápidas">
              {HOUR_CHIPS.map((h) => (
                <button key={h} type="button" className={parseDecimal(h) === hoursN ? 'chip-on' : 'chip'} onClick={() => setHours(h)}>
                  {h} h
                </button>
              ))}
            </div>

            <div className="space-y-4 rounded-2xl border border-line bg-mist/60 p-4">
              <div>
                <span className="field-label">Precio de esta clase</span>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-white p-1 ring-1 ring-line" role="radiogroup" aria-label="Tipo de precio">
                  {([['hour', 'Por hora'], ['total', 'Precio total']] as const).map(([mode, label]) => (
                    <button key={mode} type="button" role="radio" aria-checked={priceMode === mode}
                      onClick={() => {
                        setPriceMode(mode)
                        if (mode === 'total' && !fixedTotal && amounts) setFixedTotal(toInput(fromCents(amounts.totalCents)))
                      }}
                      className={`min-h-11 rounded-lg text-sm font-semibold transition ${priceMode === mode ? 'bg-ocean-900 text-white' : 'text-ink-soft'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {priceMode === 'hour' ? (
                !newStudent && (
                  <Field label="Precio por hora cobrado al alumno" error={errors.rate}
                    hint={specialPrice && usualRate !== null
                      ? `Solo para esta clase. La ficha del alumno sigue en ${formatMoney(usualRate, currency)}.`
                      : 'Se carga desde la ficha del alumno. Podés cambiarlo solo para esta clase.'}>
                    {(id) => <input id={id} className={errors.rate ? 'input-error' : 'input'} inputMode="decimal" placeholder="0,00"
                      value={rate} onChange={(e) => setRate(e.target.value)} />}
                  </Field>
                )
              ) : (
                <Field label="Precio total cobrado por la clase" error={errors.fixedTotal}
                  hint={`Para ofertas, paquetes o descuentos: el alumno paga este monto en total${hoursN ? ` por las ${formatHours(hoursN)}` : ''}.${isExternal ? ' El instructor cobra igual por hora.' : ''}`}>
                  {(id) => <input id={id} className={errors.fixedTotal ? 'input-error' : 'input'} inputMode="decimal" placeholder="0,00"
                    value={fixedTotal} onChange={(e) => setFixedTotal(e.target.value)} />}
                </Field>
              )}

              {specialPrice && (
                <div>
                  <Field label="Motivo del precio especial (opcional)">
                    {(id) => <input id={id} className="input" maxLength={120} placeholder="Ej.: oferta de temporada, paquete de 5 clases"
                      value={priceNote} onChange={(e) => setPriceNote(e.target.value)} />}
                  </Field>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {PRICE_REASONS.map((r) => (
                      <button key={r} type="button" className={priceNote === r ? 'chip-on' : 'chip'} onClick={() => setPriceNote(r)}>{r}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isExternal && (isAdmin ? (
              <Field label="Pago por hora del instructor" error={errors.pay}
                hint={`Instructor externo. Valor de su ficha: ${formatMoney(instructor!.hourly_pay, currency)}.`}>
                {(id) => <input id={id} className={errors.pay ? 'input-error' : 'input'} inputMode="decimal" value={pay}
                  onChange={(e) => setPay(e.target.value)} />}
              </Field>
            ) : (
              <div>
                <span className="field-label">Tu pago por hora</span>
                <div className="input flex items-center bg-slate-50 tabular">{formatMoney(instructor?.hourly_pay ?? 0, currency)}</div>
              </div>
            ))}

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
