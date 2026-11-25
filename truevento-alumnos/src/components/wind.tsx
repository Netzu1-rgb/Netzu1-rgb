import { dayLabel } from '../lib/format'
import { useLoad } from '../lib/hooks'
import { compass, fetchWind, SPOT, windLabel, windLevel, type WindDay, type WindLevel } from '../lib/wind'
import { locale, t } from '../i18n'
import { ErrorBox, Icon, Loading } from './ui'

const LEVEL_CLS: Record<WindLevel, { bar: string; badge: string }> = {
  low: { bar: 'bg-line-strong', badge: 'bg-surface-2 text-ink-soft' },
  good: { bar: 'bg-brand', badge: 'bg-brand-soft text-brand-deep' },
  strong: { bar: 'bg-coral', badge: 'bg-coral-soft text-coral-ink' },
}

export function useWind() {
  return useLoad(fetchWind)
}

/** Arrow pointing where the wind goes (it comes from `deg`). */
function Arrow({ deg }: { deg: number }) {
  return (
    <span className="inline-block" style={{ transform: `rotate(${deg + 180}deg)` }} aria-hidden="true">
      <Icon name="arrow" className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  )
}

export function WindSummary({ day }: { day: WindDay }) {
  const level = windLevel(day.avg)
  const mid = day.hours.find((h) => h.time.endsWith('14:00')) ?? day.hours[Math.floor(day.hours.length / 2)]
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-night-900 text-white">
        <div className="text-center">
          <div className="tabular font-display text-2xl font-bold leading-none">{day.avg}</div>
          <div className="text-[10px] font-semibold text-brand-200">{t('wind.knots')}</div>
        </div>
      </div>
      <div className="min-w-0">
        <span className={`badge ${LEVEL_CLS[level].badge}`}>{windLabel(level)}</span>
        <div className="mt-1 text-sm text-ink-soft">
          {t('wind.detail', { max: day.max, gust: day.gustMax })} · {mid && <>{t('wind.from', { dir: compass(mid.direction) })} <Arrow deg={mid.direction} /></>}
        </div>
      </div>
    </div>
  )
}

export function WindDayCard({ day }: { day: WindDay }) {
  const top = Math.max(30, ...day.hours.map((h) => h.gust))
  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-heading">{dayLabel(day.date)}</h3>
      </div>
      <WindSummary day={day} />
      <div className="mt-4 flex h-28 items-end gap-1" role="img"
        aria-label={`${t('wind.byHour')}: ${day.hours.map((h) => t('wind.hourItem', { h: h.time.slice(11, 13), kn: h.speed })).join(', ')}`}>
        {day.hours.map((h) => (
          <div key={h.time} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="tabular text-[10px] font-semibold text-ink-soft">{h.speed}</span>
            <div className="grow-up relative w-full max-w-5 rounded-t-md bg-surface-2" style={{ height: `${(h.gust / top) * 100}%` }}>
              <div className={`absolute inset-x-0 bottom-0 rounded-t-md ${LEVEL_CLS[windLevel(h.speed)].bar}`} style={{ height: `${(h.speed / Math.max(h.gust, 1)) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {day.hours.map((h) => (
          <span key={h.time} className="tabular flex-1 text-center text-[10px] text-ink-mute">{Number(h.time.slice(11, 13)) % 3 === 0 ? h.time.slice(11, 13) : ''}</span>
        ))}
      </div>
    </section>
  )
}

export function WindForecast() {
  const { data, error, loading, reload } = useWind()
  if (loading && !data) return <Loading label={t('wind.loading')} />
  if (error && !data) return <ErrorBox message={t('wind.error')} onRetry={() => void reload()} />
  if (!data) return null
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-line-strong" />{t('wind.legendLow')}</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-brand" />{t('wind.legendGood')}</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-coral" />{t('wind.legendStrong')}</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-surface-2 ring-1 ring-line" />{t('wind.legendGust')}</span>
      </div>
      <div className="stagger space-y-3">{data.days.map((d) => <WindDayCard key={d.date} day={d} />)}</div>
      <p className="text-center text-xs text-ink-mute">
        {t('wind.footer', { spot: SPOT.name, time: new Date(data.fetchedAt).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) })}
      </p>
    </div>
  )
}
