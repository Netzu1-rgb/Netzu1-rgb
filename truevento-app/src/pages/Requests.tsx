import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { confirmRequest, fetchRequests, rejectRequest } from '../lib/api'
import { useInstructors } from '../lib/hooks'
import { useData } from '../lib/useData'
import { classAmounts, formatHours, formatMoney, fromCents, hasAtMostTwoDecimals, parseDecimal } from '../lib/money'
import { friendlyError } from '../lib/errors'
import { EXPERIENCE_LABEL, type ClassRequest, type Instructor } from '../lib/types'
import { EmptyState, ErrorBox, Field, Icon, Loading, OfflineNote, PageHeader, Spinner, useConfirm, useToast } from '../components/ui'
import { STUDENTS_APP_URL } from '../components/InviteButton'

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

  return (
    <div>
      <PageHeader title="Solicitudes" subtitle="Clases que los alumnos pidieron desde su app" />
      {requests.offline && <OfflineNote savedAt={requests.savedAt} />}
      {requests.error && <ErrorBox message={requests.error} onRetry={requests.reload} />}
      {requests.loading && !requests.data ? <Loading /> : list.length === 0 ? (
        <EmptyState title="No hay solicitudes nuevas"
          text={`Cuando un alumno pida una clase en ${STUDENTS_APP_URL.replace(/^https?:\/\//, '')}, aparece acá con sus datos, el día y el horario. Vos solo ponés el precio por hora.`} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((r) => <RequestCard key={r.id} request={r} instructors={active} onDone={requests.reload} />)}
        </div>
      )}
    </div>
  )
}

function RequestCard({ request: r, instructors, onDone }: { request: ClassRequest; instructors: Instructor[]; onDone: () => void }) {
  const { currency } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const s = r.student
  const isNew = s.hourly_rate == null
  const [rate, setRate] = useState(toInput(s.hourly_rate))
  const [instructorId, setInstructorId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // who gives it: the student's choice, else their usual instructor, else the first owner
  useEffect(() => {
    if (instructorId || !instructors.length) return
    const pick = [r.instructor_id, s.default_instructor_id].find((id) => id && instructors.some((i) => i.id === id))
      ?? instructors.find((i) => i.owner_slot === 1)?.id ?? instructors[0].id
    setInstructorId(pick)
  }, [instructors, instructorId, r.instructor_id, s.default_instructor_id])

  const rateN = parseDecimal(rate)
  const ins = instructors.find((i) => i.id === instructorId)
  const amounts = rateN !== null && ins ? classAmounts(r.hours, rateN, ins.kind === 'owner' ? 0 : ins.hourly_pay) : null
  const wa = s.phone ? `https://wa.me/${s.phone.replace(/\D/g, '')}` : null
  const asked = r.instructor_id ? instructors.find((i) => i.id === r.instructor_id)?.full_name : null

  async function accept() {
    setError(null)
    if (rateN === null || !hasAtMostTwoDecimals(rateN)) return setError('Escribí el precio por hora (por ejemplo 250 o 250,50).')
    if (!instructorId) return setError('Elegí quién da la clase.')
    setBusy(true)
    try {
      await confirmRequest(r.id, rateN, instructorId)
      toast(`Clase de ${s.full_name} confirmada. Ya la ve en su app.`)
      onDone()
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
            <a href={wa} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-deep">
              <Icon name="phone" className="h-4 w-4" /> {s.phone}
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-brand-deep">
        <div className="flex items-center gap-2 font-semibold"><Icon name="calendar" className="h-4 w-4" /> {longDay(r.lesson_date)}</div>
        <div className="mt-0.5 text-sm">
          De {r.start_time} a {endTime(r.start_time, r.hours)} · {formatHours(r.hours)}{asked ? ` · pidió con ${asked}` : ''}
        </div>
      </div>
      {r.student_note && <p className="mt-3 rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-ink-soft">“{r.student_note}”</p>}

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
