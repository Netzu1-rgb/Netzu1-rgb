import { useState } from 'react'
import { notifyChange, useLoad } from '../lib/hooks'
import {
  applyCalibration, compass, fetchWind, forecastNow, schoolHour, schoolToday, windLabel, windLevel,
  type Agreement, type WindDay, type WindForecastData, type WindHour, type WindLevel,
} from '../lib/wind'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { locale, t } from '../i18n'
import type { Key } from '../i18n/messages'
import { ErrorBox, Field, Icon, Loading, useToast } from './ui'

const LEVEL_CLS: Record<WindLevel, { bar: string; badge: string }> = {
  low: { bar: 'bg-line-strong', badge: 'bg-surface-2 text-ink-soft' },
  good: { bar: 'bg-brand', badge: 'bg-brand-soft text-brand-deep' },
  strong: { bar: 'bg-coral', badge: 'bg-coral-soft text-coral-ink' },
}

/** The forecast, corrected with the school's own measurements when there are enough of them. */
export function useWind() {
  return useLoad(async () => {
    const [data, cal] = await Promise.all([fetchWind(), api.windCalibration().catch(() => null)])
    return applyCalibration(data, cal && cal.count >= 3 ? cal : null)
  })
}

const AGREEMENT: Record<Agreement, { key: Key; cls: string }> = {
  high: { key: 'wind.agreeHigh', cls: 'bg-brand-soft text-brand-deep' },
  medium: { key: 'wind.agreeMedium', cls: 'bg-sand text-ink-soft' },
  low: { key: 'wind.agreeLow', cls: 'bg-coral-soft text-coral-ink' },
}

/** Today's forecast (in Ceará), else the first day available. */
export function todayOf(data: WindForecastData | null): WindDay | undefined {
  return data?.days.find((d) => d.date === schoolToday()) ?? data?.days[0]
}

/** "Today", "Tomorrow" or a date, counted in Ceará. */
function windDayLabel(date: string): string {
  const today = schoolToday()
  const tomorrow = schoolToday(new Date(Date.now() + 86400_000))
  if (date === today) return t('date.today')
  if (date === tomorrow) return t('date.tomorrow')
  const s = new Date(`${date}T12:00`).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Arrow pointing where the wind goes (it comes from `deg`). */
export function WindArrow({ deg, className = 'h-3.5 w-3.5' }: { deg: number; className?: string }) {
  return (
    <span className="inline-block" style={{ transform: `rotate(${deg + 180}deg)` }} aria-hidden="true">
      <Icon name="arrow" className={className} strokeWidth={2.5} />
    </span>
  )
}

export function WindSummary({ day }: { day: WindDay }) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-tile text-white">
        <div className="text-center">
          <div className="tabular font-display text-2xl font-bold leading-none">{day.avg}</div>
          <div className="text-[10px] font-semibold text-brand-200">{t('wind.knots')}</div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5">
          <span className={`badge ${LEVEL_CLS[day.level].badge}`}>{windLabel(day.level)}</span>
          {day.gusty && <span className="badge bg-coral-soft text-coral-ink">{t('wind.gusty')}</span>}
          {day.agreement && <span className={`badge ${AGREEMENT[day.agreement].cls}`} title={t('wind.agreeHint')}>{t(AGREEMENT[day.agreement].key)}</span>}
        </div>
        <div className="mt-1 text-sm text-ink-soft">
          {day.gustMax !== null ? t('wind.detail', { max: day.max, gust: day.gustMax }) : t('wind.detailNoGust', { max: day.max })}
          {' · '}
          <span className="whitespace-nowrap">{t('wind.dirDeg', { dir: compass(day.direction), deg: day.direction })} <WindArrow deg={day.direction} /></span>
        </div>
      </div>
    </div>
  )
}

/** The hour shown big: now (today), else the windiest lesson hour. */
function defaultHour(day: WindDay): string {
  const now = schoolHour()
  if (day.hours.some((h) => h.time === now)) return now
  const lesson = day.hours.filter((h) => { const x = Number(h.time.slice(11, 13)); return x >= 9 && x <= 17 })
  const pool = lesson.length ? lesson : day.hours
  return pool.reduce((a, h) => (h.speed > a.speed ? h : a), pool[0]).time
}

/** Compass rose: the arrow points where the wind goes; the label says where it comes from. */
function Compass({ deg, size = 132 }: { deg: number; size?: number }) {
  const dirs = t('wind.dirs').split(',') // N,NE,E,SE,S,SO,O,NO
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={t('wind.dirDeg', { dir: compass(deg), deg })}>
      <circle cx="60" cy="60" r="56" className="fill-surface-2 stroke-line" strokeWidth="1.5" />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i * 22.5 * Math.PI) / 180, long = i % 4 === 0
        return <line key={i} x1={60 + Math.sin(a) * (long ? 44 : 48)} y1={60 - Math.cos(a) * (long ? 44 : 48)} x2={60 + Math.sin(a) * 53} y2={60 - Math.cos(a) * 53}
          className="stroke-ink-mute" strokeWidth={long ? 2 : 1} strokeLinecap="round" />
      })}
      {[0, 2, 4, 6].map((k) => {
        const a = (k * 45 * Math.PI) / 180
        return <text key={k} x={60 + Math.sin(a) * 34} y={60 - Math.cos(a) * 34 + 4.5} textAnchor="middle" className="fill-ink-soft" style={{ font: '700 12px Inter, sans-serif' }}>{dirs[k]}</text>
      })}
      {/* the wind blows from deg towards deg+180 */}
      <g transform={`rotate(${deg + 180} 60 60)`}>
        <path d="M60 26 L68 45 L62.5 42.5 L62.5 80 L57.5 80 L57.5 42.5 L52 45 Z" className="fill-brand" />
        <circle cx="60" cy="84" r="4.5" className="fill-brand" opacity=".35" />
      </g>
    </svg>
  )
}

export function WindDayCard({ day, top }: { day: WindDay; top: number }) {
  const now = schoolHour()
  const [picked, setPicked] = useState<string | null>(null)
  const sel = day.hours.find((h) => h.time === (picked ?? defaultHour(day))) ?? day.hours[0]
  const level = windLevel(sel.speed, sel.gust)
  return (
    <section className="card p-4" aria-label={windDayLabel(day.date)}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-semibold text-heading">{windDayLabel(day.date)}</h3>
        <span className={`text-xs font-semibold ${day.best ? 'text-brand-deep' : 'text-ink-mute'}`}>
          {day.best ? t('wind.best', day.best) : t('wind.noBest')}
        </span>
      </div>

      {/* the chosen hour, big: wind, gusts and where it comes from */}
      <div className="rounded-2xl bg-tile p-4 text-white" aria-live="polite">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-brand-100">{sel.time === now ? t('wind.now') : t('wind.atHour', { h: sel.time.slice(11, 16) })}</span>
          <span className={`badge ${LEVEL_CLS[level].badge}`}>{windLabel(level)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-200">{t('wind.windLabel')}</div>
              <div className="tabular font-display text-6xl font-bold leading-none">{Math.round(sel.speed)}</div>
              <div className="mt-1 text-sm text-brand-100">{t('wind.knots')}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-200">{t('wind.legendGust')}</div>
              <div className="tabular font-display text-6xl font-bold leading-none text-[#ffb4c8]">{sel.gust !== null ? Math.round(sel.gust) : '—'}</div>
              <div className="mt-1 text-sm text-brand-100">{t('wind.knots')}</div>
            </div>
          </div>
          <div className="shrink-0 rounded-full bg-white p-1"><Compass deg={sel.direction} size={112} /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm text-brand-100">
          <span>{t('wind.fromLong', { dir: compass(sel.direction), deg: Math.round(sel.direction) })}</span>
          <span>{t('wind.dayRange', { avg: day.avg, max: day.max })}{day.gustMax !== null ? ` · ${t('wind.dayGust', { gust: day.gustMax })}` : ''}</span>
        </div>
        {(day.agreement || day.gusty) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {day.gusty && <span className="badge bg-coral-soft text-coral-ink">{t('wind.gusty')}</span>}
            {day.agreement && <span className={`badge ${AGREEMENT[day.agreement].cls}`} title={t('wind.agreeHint')}>{t(AGREEMENT[day.agreement].key)}</span>}
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs text-ink-mute">{t('wind.tapHour')}</p>
        <ol className="flex h-32 items-end gap-0.5 sm:gap-1" aria-label={t('wind.byHour')}>
          {day.hours.map((h) => <HourBar key={h.time} h={h} top={top} now={h.time === now} selected={h.time === sel.time} onPick={() => setPicked(h.time)} />)}
        </ol>
        <div className="mt-1.5 flex gap-0.5 sm:gap-1" aria-hidden="true">
          {day.hours.map((h) => (
            <span key={h.time} className={`tabular flex-1 text-center text-[10px] ${h.time === sel.time ? 'font-bold text-brand-deep' : 'text-ink-mute'}`}>
              {Number(h.time.slice(11, 13)) % 3 === 0 || h.time === sel.time ? h.time.slice(11, 13) : ''}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function HourBar({ h, top, now, selected, onPick }: { h: WindHour; top: number; now: boolean; selected: boolean; onPick: () => void }) {
  const gust = h.gust ?? h.speed
  const speed = Math.round(h.speed)
  return (
    <li className="flex h-full min-w-0 flex-1">
      <button type="button" onClick={onPick} aria-pressed={selected}
        className={`flex h-full w-full flex-col items-center justify-end gap-1 rounded-md ${selected ? 'bg-brand-soft' : ''}`}
        aria-label={t('wind.hourA11y', { h: h.time.slice(11, 13), kn: speed, gust: h.gust !== null ? Math.round(h.gust) : '—', dir: compass(h.direction) }) + (now ? ` (${t('wind.now')})` : '')}>
        <span className={`tabular text-[10px] font-semibold ${selected ? 'text-brand-deep' : 'text-ink-soft'}`}>{speed}</span>
        <div className={`grow-up relative w-full max-w-5 rounded-t-md bg-gust ${now ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface' : ''}`}
          style={{ height: `${Math.min(100, (gust / top) * 100)}%` }}>
          <div className={`absolute inset-x-0 bottom-0 rounded-t-md ${LEVEL_CLS[windLevel(h.speed, h.gust)].bar}`}
            style={{ height: `${(h.speed / Math.max(gust, 0.1)) * 100}%` }} />
        </div>
      </button>
    </li>
  )
}

export function WindForecast() {
  const { data, error, loading, reload } = useWind()
  const [picked, setPicked] = useState<string | null>(null)
  if (loading && !data) return <Loading label={t('wind.loading')} />
  if (error && !data) return <ErrorBox message={t('wind.error')} onRetry={() => void reload()} />
  if (!data || !data.days.length) return null
  // one scale for every day, so the bars can be compared between days
  const top = Math.max(30, ...data.days.flatMap((d) => d.hours.map((h) => h.gust ?? h.speed)))
  const updated = new Date(data.fetchedAt).toLocaleString(locale(), { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  const source = data.source === 'consensus' ? t('wind.sourceModels', { n: data.models ?? 0 })
    : t(data.source === 'open-meteo' ? 'wind.sourceOM' : 'wind.sourceMET')
  const pct = data.calibration ? Math.round((data.calibration.factor - 1) * 100) : 0
  const day = data.days.find((d) => d.date === picked) ?? todayOf(data) ?? data.days[0]
  return (
    <div className="space-y-3">
      {data.stale && (
        <div className="flex items-center gap-2 rounded-xl bg-sand px-4 py-2.5 text-sm text-ink-soft" role="status">
          <Icon name="cloudOff" className="h-4 w-4 shrink-0" /> {t('wind.stale', { time: updated })}
        </div>
      )}
      {/* one day at a time: pick it here */}
      <div className="-mx-4 overflow-x-auto px-4 pb-1" role="tablist" aria-label={t('wind.title')}>
        <div className="flex gap-2">
          {data.days.map((d) => {
            const on = d.date === day.date
            return (
              <button key={d.date} type="button" role="tab" aria-selected={on} onClick={() => setPicked(d.date)}
                className={`flex min-w-[4.75rem] shrink-0 flex-col items-center rounded-2xl border px-3 py-2 transition active:scale-95 ${on ? 'border-selected bg-selected text-white' : 'border-line bg-surface text-ink'}`}>
                <span className={`text-xs font-semibold ${on ? 'text-white' : 'text-ink-mute'}`}>{shortDayLabel(d.date)}</span>
                <span className="font-display text-xl font-bold tabular">{d.avg}</span>
                <span className={`h-1.5 w-8 rounded-full ${LEVEL_CLS[d.level].bar}`} aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>
      <div key={day.date} className="page-enter"><WindDayCard day={day} top={top} /></div>
      <p className="flex gap-2 rounded-xl bg-sand px-3 py-2.5 text-sm text-ink-soft" role="note"><Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {t('wind.disclaimer')}</p>
      <p className="text-center text-xs text-ink-mute">{t('wind.colors')}</p>
      <p className="text-center text-xs text-ink-mute">{t('wind.footerShort', { source, time: updated })}</p>
      {data.calibration && (
        <p className="text-center text-xs text-ink-mute">{t('wind.calibrated', { n: data.calibration.count, pct: (pct > 0 ? '+' : '') + pct })}</p>
      )}
    </div>
  )
}

/** Short tab label: "Hoy", "Mañana" or "Jue 27". */
function shortDayLabel(date: string): string {
  const today = schoolToday()
  if (date === today) return t('date.today')
  if (date === schoolToday(new Date(Date.now() + 86400_000))) return t('date.tomorrow')
  const s = new Date(`${date}T12:00`).toLocaleDateString(locale(), { weekday: 'short', day: 'numeric' }).replace(/[.,]/g, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Staff: compare the forecast with the wind measured on the beach. With 3 measurements or
 * more, every forecast in the app is corrected by how the two usually compare.
 */
export function WindCalibrationCard() {
  const wind = useWind()
  const list = useLoad(api.listWindObservations)
  const toast = useToast()
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const now = wind.data ? forecastNow(wind.data) : null
  const cal = wind.data?.calibration
  async function save() {
    const measured = Number(value.replace(',', '.'))
    if (!Number.isFinite(measured) || measured < 0 || measured > 60) return setError(t('calib.invalid'))
    if (!now) return setError(t('calib.noForecast'))
    setBusy(true); setError(null)
    try {
      await api.addWindObservation(measured, now.speed)
      setValue('')
      toast(t('calib.saved'))
      notifyChange()
    } catch (err) { setError(friendlyError(err)) } finally { setBusy(false) }
  }
  return (
    <section className="card mt-4 p-4" aria-labelledby="calib-title">
      <h2 id="calib-title" className="flex items-center gap-2 font-semibold text-heading"><Icon name="wind" /> {t('calib.title')}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t('calib.text')}</p>
      <p className="mt-2 text-sm font-semibold text-ink">
        {cal ? t('calib.active', { n: cal.count, pct: (cal.factor >= 1 ? '+' : '') + Math.round((cal.factor - 1) * 100) }) : t('calib.inactive')}
      </p>
      <div className="mt-3 flex items-end gap-2">
        <Field label={now ? t('calib.measured', { kn: Math.round(now.speed) }) : t('calib.measuredNoForecast')} className="flex-1">
          {(id) => <input id={id} className="input tabular" inputMode="decimal" placeholder="Ej: 18" value={value} onChange={(e) => setValue(e.target.value)} />}
        </Field>
        <button type="button" className="btn-dark" disabled={busy || !value} onClick={() => void save()}>{t('calib.save')}</button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
      {!!list.data?.length && (
        <ul className="mt-3 divide-y divide-line text-sm">
          {list.data.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-2 py-2">
              <span className="text-ink-soft">{new Date(o.observed_at).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="tabular text-ink">{t('calib.row', { m: o.measured_kn, f: o.forecast_kn })}</span>
              <button type="button" className="text-xs font-semibold text-coral underline" onClick={async () => {
                try { await api.deleteWindObservation(o.id); notifyChange() } catch (err) { setError(friendlyError(err)) }
              }}>{t('calib.delete')}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
