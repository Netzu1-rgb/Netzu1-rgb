import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { busyTimes, confirmRequest, fetchPriceless, fetchRequests, rejectRequest, updateStudent } from '../lib/api'
import { useInstructors } from '../lib/hooks'
import { useData } from '../lib/useData'
import { classAmounts, formatHours, formatMoney, fromCents, hasAtMostTwoDecimals, parseDecimal } from '../lib/money'
import { friendlyError } from '../lib/errors'
import { EXPERIENCE_LABEL, type ClassRequest, type Instructor, type PricelessStudent } from '../lib/types'
import { NotificationsCard } from '../components/NotificationsCard'
import { UpcomingSection } from '../components/Upcoming'
import { EmptyState, ErrorBox, Field, Icon, Loading, OfflineNote, PageHeader, Spinner, useConfirm, useToast } from '../components/ui'
import { STUDENTS_APP_URL } from '../components/InviteButton'
import { requestsChanged } from '../lib/requestCount'
import { openWhatsApp, waLink } from '../lib/whatsapp'
import { requestMessage } from '../lib/requestMessage'

const toInput = (n: number | null) => (n == null ? '' : String(n).replace('.', ','))

function longDay(iso: string) {
  const s = new Date(`${iso}T12:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function endTime(start: string, hours: number) {
  const [h, m] = start.split(':').map(Number)
  const t = h * 60 + m + Math.round(hours * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** Classes that students asked for in their app: the school sets the price and confirms. */
export default function Requests() {
  const { session } = useAuth()
  const uid = session!.user.id
  const requests = useData(`${uid}:requests`, fetchRequests)
  const instructors = useInstructors()
  const active = (instructors.data ?? []).filter((i) => i.active)
  const list = requests.data ?? []
  const priceless = useData(`${uid}:priceless`, fetchPriceless)
  const noPrice = priceless.data ?? []
  const reloadAll = () => { requests.reload(); priceless.reload() }

  return (
    <div>
      <PageHeader title="Solicitudes" subtitle="Clases que los alumnos pidieron desde su app" />
      <NotificationsCard compact />
      {requests.offline && <OfflineNote savedAt={requests.savedAt} />}
      {requests.error && <ErrorBox message={requests.error} onRetry={requests.reload} />}
      {noPrice.length > 0 && (
        <section id="sin-precio" className="mb-6" aria-labelledby="sin-precio-title">
          <h2 id="sin-precio-title" className="mb-1 flex items-center gap-2 text-lg font-semibold text-heading">
            <Icon name="alert" className="h-5 w-5 text-coral" /> Clases sin precio
          </h2>
          <p className="mb-3 text-sm text-ink-mute">Ya están confirmadas pero el alumno no tiene precio por hora. Quedan pendientes hasta que lo completes.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {noPrice.map((g) => <PricelessCard key={g.student.id} group={g} onDone={reloadAll} />)}
          </div>
        </section>
      )}
      {noPrice.length > 0 && list.length > 0 && <h2 className="mb-3 text-lg font-semibold text-heading">Pedidos nuevos</h2>}
      {requests.loading && !requests.data ? <Loading /> : list.length === 0 ? (noPrice.length > 0 ? null :
        <EmptyState title="No hay solicitudes nuevas"
          text={`Cuando un alumno pida una clase en ${STUDENTS_APP_URL.replace(/^https?:\/\//, '')}, aparece acá con sus datos, el día y el horario. Vos solo ponés el precio por hora.`} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => <RequestCard key={r.id} request={r} instructors={active} onDone={reloadAll} />)}
        </div>
      )}
      <UpcomingSection />
    </div>
  )
}

// times the school can propose: every half hour, 07:00 to 18:00
const TIMES = Array.from({ length: 23 }, (_, k) => `${String(7 + Math.floor(k / 2)).padStart(2, '0')}:${k % 2 ? '30' : '00'}`)
const HOURS = [1, 1.5, 2, 2.5, 3, 3.5, 4]
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

function RequestCard({ request: r, instructors, onDone }: { request: ClassRequest; instructors: Instructor[]; onDone: () => void }) {
  const { currency } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const s = r.student
  const isNew = s.hourly_rate == null
  const [rate, setRate] = useState(toInput(s.hourly_rate))
  const [instructorId, setInstructorId] = useState('')
  // agreed with the student on WhatsApp
  const [time, setTime] = useState(r.start_time ?? '')
  const [hours, setHours] = useState(r.hours)
  const [taken, setTaken] = useState<{ start: string; hours: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // who gives it: the student's choice, else their usual instructor, else the first owner
  useEffect(() => {
    if (instructorId || !instructors.length) return
    const pick = [r.instructor_id, s.default_instructor_id].find((id) => id && instructors.some((i) => i.id === id))
      ?? instructors.find((i) => i.owner_slot === 1)?.id ?? instructors[0].id
    setInstructorId(pick)
  }, [instructors, instructorId, r.instructor_id, s.default_instructor_id])

  useEffect(() => {
    let alive = true
    void busyTimes(r.lesson_date, r.id).then((b) => { if (alive) setTaken(b) }).catch(() => {})
    return () => { alive = false }
  }, [r.lesson_date, r.id])
  /** a start time that overlaps a class already on that day */
  const clashes = (t: string) => taken.some((b) => toMin(b.start) < toMin(t) + hours * 60 && toMin(t) < toMin(b.start) + b.hours * 60)

  const rateN = parseDecimal(rate)
  const ins = instructors.find((i) => i.id === instructorId)
  const amounts = rateN !== null && ins ? classAmounts(hours, rateN, ins.kind === 'owner' ? 0 : ins.hourly_pay) : null
  const agreeLink = waLink(s.phone, requestMessage({
    studentName: s.full_name, lang: s.lang, phone: s.phone,
    date: r.lesson_date, time: time || null, hours,
    price: rateN !== null && rateN > 0 ? formatMoney(rateN, currency) : null,
  }))
  const wa = waLink(s.phone)
  const asked = r.instructor_id ? instructors.find((i) => i.id === r.instructor_id)?.full_name : null

  async function accept() {
    setError(null)
    if (rateN === null || !hasAtMostTwoDecimals(rateN)) return setError('Escribí el precio por hora (por ejemplo 250 o 250,50).')
    if (!time) return setError('Elegí el horario que acordaron por WhatsApp.')
    if (clashes(time)) return setError('Ese horario se superpone con otra clase de ese día. Elegí otro.')
    if (!instructorId) return setError('Elegí quién da la clase.')
    setBusy(true)
    try {
      await confirmRequest(r.id, rateN, instructorId, time, hours)
      toast(`Clase de ${s.full_name} confirmada. Ya la ve en su app.`)
      onDone()
      requestsChanged()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  async function reject() {
    if (!(await confirm({ title: 'Rechazar solicitud', message: `¿Rechazás la clase que pidió ${s.full_name}? Lo va a ver en su app; si querés, avisale por WhatsApp.`, confirmLabel: 'Rechazar', danger: true }))) return
    try {
      await rejectRequest(r.id)
      toast('Solicitud rechazada.')
      onDone()
      requestsChanged()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-tile font-display text-lg font-bold text-white">
          {s.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-heading">{s.full_name}</h2>
            {isNew && <span className="badge bg-coral-soft text-coral-ink">Alumno nuevo</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-mute">
            {s.experience && <span>{EXPERIENCE_LABEL[s.experience]}</span>}
            {s.weight_kg ? <span>{s.weight_kg} kg</span> : null}
            {!isNew && <span>Paga {formatMoney(s.hourly_rate, currency)}/h</span>}
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, wa)} className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
              <Icon name="phone" className="h-4 w-4" /> {s.phone}
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-brand-deep">
        <div className="flex items-center gap-2 font-semibold"><Icon name="calendar" className="h-4 w-4" /> {longDay(r.lesson_date)}</div>
        <div className="mt-0.5 text-sm">
          {formatHours(r.hours)} · {r.start_time ? `pidió de ${r.start_time} a ${endTime(r.start_time, r.hours)}` : 'horario a coordinar por WhatsApp'}{asked ? ` · pidió con ${asked}` : ''}
        </div>
      </div>
      {r.student_note && <p className="mt-3 rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-ink-soft">“{r.student_note}”</p>}

      {/* 1. agree on the price with the student; 2. write it below and confirm */}
      {agreeLink ? (
        <a href={agreeLink} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, agreeLink)}
          className="btn mt-4 w-full bg-[#11803f] text-white shadow-[0_8px_20px_-8px_rgba(17,128,63,0.55)] hover:brightness-110">
          <Icon name="whatsapp" /> Coordinar horario y precio por WhatsApp
        </a>
      ) : (
        <p className="mt-4 rounded-xl bg-coral-soft px-4 py-2.5 text-sm text-coral-ink">Este alumno no tiene WhatsApp cargado: pedíselo antes de confirmar.</p>
      )}
      <p className="mt-2 text-center text-xs text-ink-mute">
        {time || (rateN !== null && rateN > 0) ? 'El mensaje incluye el horario y el precio que elijas abajo.' : 'Si elegís horario y precio abajo, el mensaje los propone.'} Cuando lo acuerden, confirmá la clase.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Field label="Horario acordado">
          {(id) => (
            <select id={id} className={`input tabular ${time ? '' : 'text-ink-mute'}`} value={time} onChange={(e) => setTime(e.target.value)}>
              <option value="">Elegí…</option>
              {TIMES.map((t) => <option key={t} value={t} disabled={clashes(t)}>{t}{clashes(t) ? ' · ocupado' : ''}</option>)}
            </select>
          )}
        </Field>
        <Field label="Duración">
          {(id) => (
            <select id={id} className="input" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {[...new Set([...HOURS, r.hours])].sort((a, b) => a - b).map((h) => <option key={h} value={h}>{formatHours(h)}</option>)}
            </select>
          )}
        </Field>
      </div>
      {time && <p className="mt-2 text-sm text-ink-soft">De {time} a {endTime(time, hours)}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Precio por hora" hint={isNew ? 'Queda en su ficha para las próximas clases.' : 'Si lo cambiás, queda en su ficha.'}>
          {(id) => <input id={id} className="input tabular text-lg font-semibold" inputMode="decimal" placeholder="Ej: 250"
            value={rate} onChange={(e) => setRate(e.target.value)} autoFocus={isNew} />}
        </Field>
        <Field label="Quién da la clase">
          {(id) => (
            <select id={id} className="input" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
            </select>
          )}
        </Field>
      </div>
      {amounts && (
        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm text-ink-soft">
          <span>Cobrás <b className="tabular text-heading">{formatMoney(fromCents(amounts.totalCents), currency)}</b></span>
          {amounts.instructorPayCents > 0 && <span>Instructor {formatMoney(fromCents(amounts.instructorPayCents), currency)}</span>}
          <span>Queda escuela <b className="tabular text-heading">{formatMoney(fromCents(amounts.profitCents), currency)}</b></span>
        </div>
      )}
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
      <div className="mt-4 flex gap-3">
        <button type="button" className="btn-ghost flex-1" onClick={() => void reject()}>Rechazar</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy} onClick={() => void accept()}>
          {busy ? <Spinner /> : <Icon name="check" />} Confirmar clase
        </button>
      </div>
    </article>
  )
}

/** A student with confirmed classes and no price: one box for the price, then they are done. */
function PricelessCard({ group: g, onDone }: { group: PricelessStudent; onDone: () => void }) {
  const toast = useToast()
  const s = g.student
  const [rate, setRate] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wa = waLink(s.phone)

  async function save() {
    setError(null)
    const n = parseDecimal(rate)
    if (n === null || n <= 0 || !hasAtMostTwoDecimals(n)) return setError('Escribí el precio por hora (por ejemplo 250 o 250,50).')
    setBusy(true)
    try {
      await updateStudent(s.id, { hourly_rate: n })
      toast(`Precio de ${s.full_name} guardado.`)
      onDone()
      requestsChanged()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="card flex flex-col border-coral/40 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-heading">{s.full_name}</h3>
        <span className="badge bg-coral-soft text-coral-ink">Pendiente: falta el precio</span>
      </div>
      {wa && (
        <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, wa)} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
          <Icon name="whatsapp" className="h-4 w-4" /> {s.phone}
        </a>
      )}
      <ul className="mt-3 space-y-1.5">
        {g.lessons.map((l) => (
          <li key={l.id} className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-soft">
            <Icon name="calendar" className="h-4 w-4 shrink-0" />
            <span><b className="text-heading">{longDay(l.lesson_date)}</b> · {l.start_time} a {endTime(l.start_time, l.hours)}{l.instructor_name ? ` · ${l.instructor_name}` : ''}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-end gap-2">
        <Field label="Precio por hora" className="flex-1" hint="Queda en su ficha para todas sus clases.">
          {(id) => <input id={id} className="input tabular text-lg font-semibold" inputMode="decimal" placeholder="Ej: 250"
            value={rate} onChange={(e) => setRate(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void save() }} />}
        </Field>
      </div>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
      <button type="button" className="btn-primary mt-3 w-full" disabled={busy} onClick={() => void save()}>
        {busy ? <Spinner /> : <Icon name="check" />} Guardar precio
      </button>
    </article>
  )
}
