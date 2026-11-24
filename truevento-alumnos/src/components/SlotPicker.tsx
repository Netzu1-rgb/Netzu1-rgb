import { useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'
import { addDays, DURATIONS, endTime, formatHours, isoDate, START_TIMES, today } from '../lib/format'
import type { BusySlot } from '../lib/types'
import { Icon, Spinner } from './ui'

// Pick a class time by tapping: a month calendar, the duration, then the day's times.
// Times that overlap another requested or confirmed class show as "Reservado".

export interface Slot { date: string; time: string; hours: number }

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MAX_DAYS_AHEAD = 180

const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }

type TimeState = 'free' | 'taken' | 'noRoom' | 'past'

/** State of a start time on a day, given the taken classes and the chosen duration. */
export function timeState(date: string, time: string, hours: number, busy: BusySlot[], allowPast = false): TimeState {
  const start = toMin(time)
  if (!allowPast && date === today() && start <= new Date().getHours() * 60 + new Date().getMinutes()) return 'past'
  const day = busy.filter((b) => b.lesson_date === date)
  const end = start + Math.round(hours * 60)
  if (day.some((b) => { const s = toMin(b.start_time); return start >= s && start < s + Math.round(b.hours * 60) })) return 'taken'
  if (day.some((b) => { const s = toMin(b.start_time); return s < end && start < s + Math.round(b.hours * 60) })) return 'noRoom'
  return 'free'
}

function monthStart(iso: string) { return `${iso.slice(0, 7)}-01` }
function shiftMonth(first: string, n: number) {
  const [y, m] = first.split('-').map(Number)
  return isoDate(new Date(y, m - 1 + n, 1))
}

export default function SlotPicker({ value, onChange, excludeId, refreshKey = 0, allowPast = false }: {
  value: Slot
  onChange: (v: Slot) => void
  excludeId?: string | null
  refreshKey?: number
  /** staff may log a class that already happened earlier today */
  allowPast?: boolean
}) {
  const [month, setMonth] = useState(() => monthStart(value.date || today()))
  const [busy, setBusy] = useState<BusySlot[] | null>(null)
  const [failed, setFailed] = useState(false)
  // show the month of the chosen day (e.g. a request being confirmed)
  useEffect(() => { if (value.date) setMonth(monthStart(value.date)) }, [value.date])
  const last = addDays(today(), MAX_DAYS_AHEAD)
  const monthEnd = addDays(shiftMonth(month, 1), -1)

  useEffect(() => {
    let alive = true
    setBusy(null)
    setFailed(false)
    const from = month < today() ? today() : month
    api.busySlots(from, monthEnd, excludeId ?? null)
      .then((b) => { if (alive) setBusy(b) })
      .catch(() => { if (alive) { setBusy([]); setFailed(true) } })
    return () => { alive = false }
  }, [month, monthEnd, excludeId, refreshKey])

  // the calendar grid, weeks starting on Monday
  const cells = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
    const days = new Date(y, m, 0).getDate()
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => isoDate(new Date(y, m - 1, i + 1)))] as (string | null)[]
  }, [month])

  const states = (date: string) => START_TIMES.map((t) => timeState(date, t, value.hours, busy ?? [], allowPast))
  const dayInfo = (date: string) => {
    if (date < today() || date > last) return 'off'
    if (!busy) return 'open'
    const st = states(date)
    if (st.every((s) => s === 'past')) return 'off' // today, too late
    if (st.every((s) => s !== 'free')) return 'full'
    return busy.some((b) => b.lesson_date === date) ? 'some' : 'open'
  }

  // a time that stops fitting (other day or longer class) is cleared
  useEffect(() => {
    if (!busy || !value.time) return
    if (timeState(value.date, value.time, value.hours, busy, allowPast) !== 'free') onChange({ ...value, time: '' })
  }, [busy, value, onChange, allowPast])

  const label = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const canPrev = month > monthStart(today())
  const canNext = shiftMonth(month, 1) <= last

  return (
    <div className="space-y-5">
      {/* 1. day */}
      <fieldset>
        <legend className="field-label">Día</legend>
        <div className="rounded-2xl border border-line bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30"
              disabled={!canPrev} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
              <Icon name="chevronLeft" />
            </button>
            <span className="font-semibold text-heading first-letter:uppercase" aria-live="polite">{label}</span>
            <button type="button" className="grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2 disabled:opacity-30"
              disabled={!canNext} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">
              <Icon name="chevronRight" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-ink-mute" aria-hidden="true">
            {WEEKDAYS.map((d, i) => <span key={i} className="py-1">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />
              const info = dayInfo(d)
              const selected = d === value.date
              const disabled = info === 'off' || info === 'full'
              const n = Number(d.slice(8))
              const name = new Date(d + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
              return (
                <button key={d} type="button" disabled={disabled} aria-pressed={selected}
                  aria-label={`${name}${info === 'full' ? ', completo' : ''}${d === today() ? ', hoy' : ''}`}
                  onClick={() => onChange({ ...value, date: d, time: '' })}
                  className={`relative grid aspect-square min-h-10 place-items-center rounded-xl text-sm font-semibold transition ${
                    selected ? 'bg-selected text-white'
                      : info === 'off' ? 'text-ink-mute/45'
                        : info === 'full' ? 'text-ink-mute line-through decoration-2'
                          : 'text-ink hover:bg-surface-2'} ${d === today() && !selected ? 'ring-1 ring-inset ring-brand' : ''}`}>
                  {n}
                  {info === 'some' && <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-coral'}`} aria-hidden="true" />}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mute">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-coral" />Con horarios reservados</span>
            <span className="line-through decoration-2">Completo</span>
          </div>
        </div>
      </fieldset>

      {/* 2. duration */}
      <fieldset>
        <legend className="field-label">Duración</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((h) => (
            <button key={h} type="button" aria-pressed={value.hours === h} onClick={() => onChange({ ...value, hours: h })}
              className={value.hours === h ? 'chip-on' : 'chip'}>{formatHours(h)}</button>
          ))}
        </div>
      </fieldset>

      {/* 3. time */}
      <fieldset>
        <legend className="field-label">Horario</legend>
        {!value.date ? <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-mute">Primero elegí el día en el calendario.</p>
          : !busy ? <div className="flex items-center gap-2 py-4 text-sm text-ink-mute"><Spinner className="h-4 w-4" /> Buscando horarios libres…</div> : (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {START_TIMES.map((t) => {
                  const st = timeState(value.date, t, value.hours, busy, allowPast)
                  const selected = value.time === t
                  const note = st === 'taken' ? 'Reservado' : st === 'noRoom' ? `No entran ${formatHours(value.hours)}` : st === 'past' ? 'Ya pasó' : `hasta ${endTime(t, value.hours)}`
                  return (
                    <button key={t} type="button" disabled={st !== 'free'} aria-pressed={selected}
                      aria-label={`${t}, ${note}`} onClick={() => onChange({ ...value, time: t })}
                      className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-1 py-1.5 transition active:scale-95 ${
                        selected ? 'border-selected bg-selected text-white'
                          : st === 'taken' ? 'border-coral/30 bg-coral-soft text-coral-ink'
                            : st !== 'free' ? 'border-line bg-surface-2 text-ink-mute'
                              : 'border-line bg-surface text-ink hover:border-brand'}`}>
                      <span className={`tabular font-display text-base font-bold ${st === 'taken' ? 'line-through' : ''}`}>{t}</span>
                      <span className={`text-[11px] font-semibold leading-tight ${selected ? 'text-white' : ''}`}>{note}</span>
                    </button>
                  )
                })}
              </div>
              {failed && <p className="mt-2 text-sm text-coral-ink">No se pudieron ver los horarios ocupados. Si elegís uno reservado, la escuela te avisa.</p>}
            </>
          )}
      </fieldset>
    </div>
  )
}
