import { useState } from 'react'
import { useLoad } from '../lib/hooks'
import {
  compass, fetchWind, schoolHour, schoolToday, windLabel, windLevel,
  type WindDay, type WindForecastData, type WindHour, type WindLevel,
} from '../lib/wind'
import { locale, t } from '../i18n'
import { ErrorBox, Icon, Loading } from './ui'

const LEVEL_CLS: Record<WindLevel, { bar: string; badge: string }> = {
  low: { bar: 'bg-line-strong', badge: 'bg-surface-2 text-ink-soft' },
  good: { bar: 'bg-brand', badge: 'bg-brand-soft text-brand-deep' },
  strong: { bar: 'bg-coral', badge: 'bg-coral-soft text-coral-ink' },
}

export function useWind() {
  return useLoad(() => fetchWind())
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

export function WindDayCard({ day, top }: { day: WindDay; top: number }) {
  const now = schoolHour()
  return (
    <section className="card p-4" aria-label={windDayLabel(day.date)}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-semibold text-heading">{windDayLabel(day.date)}</h3>
        <span className={`text-xs font-semibold ${day.best ? 'text-brand-deep' : 'text-ink-mute'}`}>
          {day.best ? t('wind.best', day.best) : t('wind.noBest')}
        </span>
      </div>
      <WindSummary day={day} />
      <div className="mt-4">
        <div>
          <ol className="flex h-32 items-end gap-0.5 sm:gap-1" aria-label={t('wind.byHour')}>
            {day.hours.map((h) => <HourBar key={h.time} h={h} top={top} now={h.time === now} />)}
          </ol>
          <div className="mt-1.5 flex gap-0.5 sm:gap-1" aria-hidden="true">
            {day.hours.map((h) => (
              <span key={h.time} className={`tabular flex-1 text-center text-[10px] ${h.time === now ? 'font-bold text-brand-deep' : 'text-ink-mute'}`}>
                {Number(h.time.slice(11, 13)) % 3 === 0 || h.time === now ? h.time.slice(11, 13) : ''}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function HourBar({ h, top, now }: { h: WindHour; top: number; now: boolean }) {
  const gust = h.gust ?? h.speed
  const speed = Math.round(h.speed)
  return (
    <li className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
      aria-label={t('wind.hourA11y', { h: h.time.slice(11, 13), kn: speed, gust: h.gust !== null ? Math.round(h.gust) : '—', dir: compass(h.direction) }) + (now ? ` (${t('wind.now')})` : '')}>
      <span className={`tabular text-[10px] font-semibold ${now ? 'text-brand-deep' : 'text-ink-soft'}`}>{speed}</span>
      <div className={`grow-up relative w-full max-w-5 rounded-t-md bg-gust ${now ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface' : ''}`}
        style={{ height: `${Math.min(100, (gust / top) * 100)}%` }}>
        <div className={`absolute inset-x-0 bottom-0 rounded-t-md ${LEVEL_CLS[windLevel(h.speed, h.gust)].bar}`}
          style={{ height: `${(h.speed / Math.max(gust, 0.1)) * 100}%` }} />
      </div>
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
  const source = t(data.source === 'open-meteo' ? 'wind.sourceOM' : data.source === 'met-norway' ? 'wind.sourceMET' : 'wind.sourceEx')
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
      <p className="text-center text-xs text-ink-mute">{t('wind.colors')}</p>
      <p className="text-center text-xs text-ink-mute">{t('wind.footerShort', { source, time: updated })}</p>
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
