import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { busyTimes, fetchUpcoming, rescheduleLesson } from '../lib/api'
import { useData } from '../lib/useData'
import { friendlyError } from '../lib/errors'
import { formatHours } from '../lib/money'
import { openWhatsApp, waLink } from '../lib/whatsapp'
import { RESCHEDULE_REASONS, rescheduleMessage, studentLang, type RescheduleReason } from '../lib/requestMessage'
import type { UpcomingLesson } from '../lib/types'
import { ErrorBox, Field, Icon, Modal, Spinner, useToast } from './ui'

// half hours, 07:00 to 18:00
const TIMES = Array.from({ length: 23 }, (_, k) => `${String(7 + Math.floor(k / 2)).padStart(2, '0')}:${k % 2 ? '30' : '00'}`)
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
const pad = (n: number) => String(n).padStart(2, '0')
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
function endTime(start: string, hours: number) {
  const t = toMin(start) + Math.round(hours * 60)
  return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`
}
function dayLabel(iso: string) {
  const s = new Date(`${iso}T12:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Confirmed classes coming up; admins move them to another day (rain, no wind...). */
export function UpcomingSection() {
  const { session, isAdmin } = useAuth()
  const upcoming = useData(`${session!.user.id}:upcoming`, fetchUpcoming)
  const [moving, setMoving] = useState<UpcomingLesson | null>(null)
  const list = upcoming.data ?? []
  // a request confirmed on this page shows up here at once
  const { reload } = upcoming
  useEffect(() => {
    window.addEventListener('tv-requests-changed', reload)
    return () => window.removeEventListener('tv-requests-changed', reload)
  }, [reload])
  if (!isAdmin || !list.length) return null
  return (
    <section className="mt-8" aria-labelledby="proximas-title">
      <h2 id="proximas-title" className="mb-1 flex items-center gap-2 text-lg font-semibold text-heading">
        <Icon name="calendar" className="h-5 w-5 text-brand-deep" /> Próximas clases
      </h2>
      <p className="mb-3 text-sm text-ink-mute">¿Llueve o el viento no acompaña? Cambiá la fecha y el alumno recibe el aviso.</p>
      <ul className="grid gap-3 lg:grid-cols-2">
        {list.map((l) => (
          <li key={l.id} className="card flex min-w-0 flex-wrap items-center gap-3 p-4">
            <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-surface-2 py-2 text-center">
              <div className="tabular font-display text-lg font-bold leading-none text-heading">{l.start_time}</div>
              <div className="mt-1 text-[11px] font-semibold text-ink-mute">{formatHours(l.hours)}</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-heading">{l.student.full_name}</div>
              <div className="text-sm text-ink-soft">{dayLabel(l.lesson_date)}{l.instructor_name ? ` · ${l.instructor_name}` : ''}</div>
            </div>
            <button type="button" className="btn-ghost min-h-10 w-full px-3 py-2 text-sm sm:w-auto sm:shrink-0" onClick={() => setMoving(l)}>
              <Icon name="calendar" className="h-4 w-4" /> Cambiar fecha
            </button>
          </li>
        ))}
      </ul>
      {moving && <RescheduleModal lesson={moving} onClose={() => setMoving(null)} onDone={upcoming.reload} />}
    </section>
  )
}

function RescheduleModal({ lesson: l, onClose, onDone }: { lesson: UpcomingLesson; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [date, setDate] = useState(l.lesson_date)
  const [time, setTime] = useState(l.start_time)
  const [reason, setReason] = useState<RescheduleReason>('rain')
  const [taken, setTaken] = useState<{ start: string; hours: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let alive = true
    void busyTimes(date, l.id).then((b) => { if (alive) setTaken(b) }).catch(() => setTaken([]))
    return () => { alive = false }
  }, [date, l.id])
  const clashes = (t: string) => taken.some((b) => toMin(b.start) < toMin(t) + l.hours * 60 && toMin(t) < toMin(b.start) + b.hours * 60)
  const unchanged = date === l.lesson_date && time === l.start_time

  async function save() {
    setError(null)
    if (!date || date < todayIso()) return setError('Elegí una fecha de hoy en adelante.')
    if (unchanged) return setError('Elegí un día u horario distinto.')
    if (clashes(time)) return setError('Ese horario se superpone con otra clase de ese día. Elegí otro.')
    setBusy(true)
    try {
      const lang = studentLang(l.student.lang, l.student.phone)
      await rescheduleLesson(l.id, date, time, RESCHEDULE_REASONS[reason][lang] || null)
      toast(`Clase de ${l.student.full_name} pasada al ${dayLabel(date).toLowerCase()} a las ${time}.`)
      setDone(true)
      onDone()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const wa = waLink(l.student.phone, rescheduleMessage({ studentName: l.student.full_name, lang: l.student.lang, phone: l.student.phone, date, time, reason }))

  if (done) {
    return (
      <Modal open title="Clase cambiada" onClose={onClose}
        footer={<button type="button" className="btn-ghost w-full" onClick={onClose}>Listo</button>}>
        <div className="space-y-4 text-center">
          <span className="pop mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#11803f] text-white"><Icon name="check" className="h-7 w-7" /></span>
          <p className="font-semibold text-heading">{l.student.full_name}: {dayLabel(date)} · {time} a {endTime(time, l.hours)}</p>
          <p className="text-sm text-ink-soft">Le llegó el aviso a su app. Si querés, avisale también por WhatsApp:</p>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, wa)}
              className="btn w-full bg-[#11803f] text-white shadow-[0_8px_20px_-8px_rgba(17,128,63,0.55)] hover:brightness-110">
              <Icon name="whatsapp" /> Avisar por WhatsApp
            </a>
          )}
        </div>
      </Modal>
    )
  }

  return (
    <Modal open title={`Cambiar la clase de ${l.student.full_name}`} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-[2]" disabled={busy || unchanged} onClick={() => void save()}>
          {busy ? <Spinner /> : <Icon name="check" />} Guardar nueva fecha
        </button>
      </>}>
      <div className="space-y-4">
        <p className="rounded-xl bg-surface-2 px-4 py-2.5 text-sm text-ink-soft">
          Ahora: <b className="text-heading">{dayLabel(l.lesson_date)} · {l.start_time} a {endTime(l.start_time, l.hours)}</b>
        </p>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-heading">Motivo</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RESCHEDULE_REASONS) as RescheduleReason[]).map((k) => (
              <button key={k} type="button" aria-pressed={reason === k} onClick={() => setReason(k)} className={reason === k ? 'chip-on' : 'chip'}>
                {RESCHEDULE_REASONS[k].label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nuevo día">
            {(id) => <input id={id} type="date" className="input" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Horario">
            {(id) => (
              <select id={id} className="input tabular" value={time} onChange={(e) => setTime(e.target.value)}>
                {[...new Set([...TIMES, l.start_time])].sort().map((t) => (
                  <option key={t} value={t} disabled={clashes(t)}>{t}{clashes(t) ? ' · ocupado' : ''}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <p className="text-sm text-ink-soft">{formatHours(l.hours)} · de {time} a {endTime(time, l.hours)}{l.instructor_name ? ` · con ${l.instructor_name}` : ''}</p>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}
