import { t } from '../i18n'

// Wind forecast for the school's spot.
//
// Main source: Open-Meteo (free, no key), the sea grid cell nearest to the school,
// in knots and in Ceará local time. If it does not answer, MET Norway (the Norwegian
// Meteorological Institute) is used instead. The last good forecast is kept on the
// device and shown, with its time, when neither can be reached.

export const SPOT = {
  name: 'Ilha do Guajirú',
  // TRUEVENTO kiteschool, from the map on truevento.com
  lat: Number(import.meta.env.VITE_SPOT_LAT ?? -2.881324),
  lon: Number(import.meta.env.VITE_SPOT_LON ?? -39.911855),
}

/** Ceará is UTC−3 all year (no daylight saving since 2019). */
export const SCHOOL_TZ = 'America/Fortaleza'
const SCHOOL_OFFSET_H = -3

/** Hours shown for each day: the hours with daylight on the beach. */
export const FIRST_HOUR = 6
export const LAST_HOUR = 18
/** Hours that count for the day summary: when lessons happen. */
const CORE_FROM = 9
const CORE_TO = 17

export type WindSource = 'open-meteo' | 'met-norway' | 'example'

export interface WindHour {
  time: string // YYYY-MM-DDTHH:MM, school local time
  speed: number // knots, 1 decimal
  gust: number | null // knots, null when the source has no gust
  direction: number // degrees the wind comes from
}

export interface WindDay {
  date: string
  hours: WindHour[]
  avg: number // knots, whole number, average over lesson hours
  max: number
  gustMax: number | null
  direction: number // average direction over lesson hours (vector mean)
  level: WindLevel
  gusty: boolean
  /** longest run of hours good for lessons, e.g. { from: '10:00', to: '16:00' } */
  best: { from: string; to: string } | null
}

export interface WindForecastData {
  days: WindDay[]
  fetchedAt: number
  source: WindSource
  /** true when the data comes from the device because no source answered */
  stale?: boolean
}

// ------------------------------------------------------------------ helpers

const pad = (n: number) => String(n).padStart(2, '0')
const round1 = (n: number) => Math.round(n * 10) / 10
export const MS_TO_KN = 3600 / 1852

/** Today's date in Ceará, whatever the phone's time zone is. */
export function schoolToday(now: Date = new Date()): string {
  const d = new Date(now.getTime() + SCHOOL_OFFSET_H * 3600_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** The current hour in Ceará as YYYY-MM-DDTHH:00. */
export function schoolHour(now: Date = new Date()): string {
  const d = new Date(now.getTime() + SCHOOL_OFFSET_H * 3600_000)
  return `${schoolToday(now)}T${pad(d.getUTCHours())}:00`
}

/** A UTC timestamp (e.g. 2026-11-25T13:00:00Z) as Ceará local time YYYY-MM-DDTHH:MM. */
export function utcToSchool(iso: string): string {
  const d = new Date(new Date(iso).getTime() + SCHOOL_OFFSET_H * 3600_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** Mean of directions as vectors: 350° and 10° average to 0°, not 180°. */
export function meanDirection(degrees: number[], weights?: number[]): number {
  let x = 0
  let y = 0
  degrees.forEach((d, i) => {
    const w = weights?.[i] ?? 1
    x += w * Math.sin((d * Math.PI) / 180)
    y += w * Math.cos((d * Math.PI) / 180)
  })
  if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9) return degrees[0] ?? 0
  return Math.round(((Math.atan2(x, y) * 180) / Math.PI + 360) % 360)
}

// ------------------------------------------------------------------ levels

export type WindLevel = 'low' | 'good' | 'strong'

/**
 * Guide for lessons. Under 12 kn there is too little wind; 12 to 25 kn is good;
 * more than 25 kn, or gusts of 32 kn or more, is strong for lessons.
 */
export function windLevel(knots: number, gust: number | null = null): WindLevel {
  if (knots > 25 || (gust !== null && gust >= 32)) return 'strong'
  if (knots < 12) return 'low'
  return 'good'
}

/** Gusty: gusts 10 kn or more above the mean wind. */
export const isGusty = (speed: number, gust: number | null) => gust !== null && gust - speed >= 10

export const windLabel = (l: WindLevel) => t(l === 'low' ? 'wind.low' : l === 'good' ? 'wind.good' : 'wind.strong')

/** 16-point compass in the user's language (E, ESE, ENE...). */
export function compass(deg: number): string {
  return t('wind.dirs16').split(',')[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16]
}

// ------------------------------------------------------------------ grouping

/** Builds the days from hourly values (school local time). Missing values are skipped, never taken as 0. */
export function buildDays(hours: WindHour[]): WindDay[] {
  const byDay = new Map<string, WindHour[]>()
  for (const h of hours) {
    const hour = Number(h.time.slice(11, 13))
    if (hour < FIRST_HOUR || hour > LAST_HOUR) continue
    const list = byDay.get(h.time.slice(0, 10)) ?? []
    list.push(h)
    byDay.set(h.time.slice(0, 10), list)
  }
  const days: WindDay[] = []
  for (const [date, list] of byDay) {
    list.sort((a, b) => a.time.localeCompare(b.time))
    const core = list.filter((x) => { const hh = Number(x.time.slice(11, 13)); return hh >= CORE_FROM && hh <= CORE_TO })
    // a day needs most of its lesson hours to give a fair summary
    if (core.length < 3) continue
    const avgRaw = core.reduce((s, x) => s + x.speed, 0) / core.length
    const gusts = core.map((x) => x.gust).filter(isNum)
    const gustMax = gusts.length ? Math.round(Math.max(...gusts)) : null
    const avg = Math.round(avgRaw)
    const max = Math.round(Math.max(...core.map((x) => x.speed)))
    days.push({
      date,
      hours: list,
      avg,
      max,
      gustMax,
      direction: meanDirection(core.map((x) => x.direction), core.map((x) => x.speed)),
      level: windLevel(avgRaw, gustMax),
      gusty: core.some((x) => isGusty(x.speed, x.gust)),
      best: bestWindow(list),
    })
  }
  return days
}

/** The longest run of consecutive hourly values good for lessons (at least two in a row). */
export function bestWindow(hours: WindHour[]): { from: string; to: string } | null {
  let best: [number, number] | null = null
  let start = -1
  hours.forEach((h, i) => {
    const ok = windLevel(h.speed, h.gust) === 'good'
    const prevHour = i > 0 ? Number(hours[i - 1].time.slice(11, 13)) : -99
    const continues = ok && start >= 0 && Number(h.time.slice(11, 13)) === prevHour + 1
    if (ok && !continues) start = i
    if (!ok) start = -1
    if (ok && (!best || i - start > best[1] - best[0])) best = [start, i]
  })
  if (!best) return null
  const [a, b] = best as [number, number]
  if (b - a < 1) return null
  // forecasts give the wind at each full hour: the window runs from the first to the last good hour
  return { from: hours[a].time.slice(11, 16), to: hours[b].time.slice(11, 16) }
}

// ------------------------------------------------------------------ sources

export interface OpenMeteoHourly {
  time: string[]
  wind_speed_10m: (number | null)[]
  wind_gusts_10m: (number | null)[]
  wind_direction_10m: (number | null)[]
}

export function openMeteoUrl(): string {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', SPOT.lat.toFixed(4))
  url.searchParams.set('longitude', SPOT.lon.toFixed(4))
  url.searchParams.set('hourly', 'wind_speed_10m,wind_gusts_10m,wind_direction_10m')
  url.searchParams.set('wind_speed_unit', 'kn')
  url.searchParams.set('timezone', SCHOOL_TZ)
  url.searchParams.set('forecast_days', '7')
  // the wind on the water, not over land: the nearest sea grid cell
  url.searchParams.set('cell_selection', 'sea')
  return url.toString()
}

/** Open-Meteo hours (already in knots and local time) to WindHour, skipping missing values. */
export function parseOpenMeteo(h: OpenMeteoHourly): WindHour[] {
  if (!h || !Array.isArray(h.time)) throw new Error('bad forecast')
  const out: WindHour[] = []
  h.time.forEach((time, i) => {
    const s = h.wind_speed_10m?.[i]
    const d = h.wind_direction_10m?.[i]
    const g = h.wind_gusts_10m?.[i]
    if (!isNum(s) || !isNum(d) || s < 0) return
    out.push({ time: time.slice(0, 16), speed: round1(s), gust: isNum(g) && g >= s ? round1(g) : isNum(g) ? round1(s) : null, direction: d })
  })
  return out
}

export const metNorwayUrl = () =>
  `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${SPOT.lat.toFixed(4)}&lon=${SPOT.lon.toFixed(4)}`

interface MetNorwayResponse {
  properties: { timeseries: { time: string; data: { instant: { details: Record<string, number | undefined> } } }[] }
}

/** MET Norway (m/s, UTC) to WindHour in knots and Ceará time. Only its hourly part is used. */
export function parseMetNorway(json: MetNorwayResponse): WindHour[] {
  const series = json?.properties?.timeseries
  if (!Array.isArray(series)) throw new Error('bad forecast')
  const out: WindHour[] = []
  let prev: number | null = null
  for (const x of series) {
    const ms = new Date(x.time).getTime()
    // after the first days the series steps to 6 hours: stop there, hours would be missing
    if (prev !== null && ms - prev > 3600_000) break
    prev = ms
    const det = x.data?.instant?.details ?? {}
    const s = det.wind_speed
    const d = det.wind_from_direction
    const g = det.wind_speed_of_gust
    if (!isNum(s) || !isNum(d)) continue
    out.push({ time: utcToSchool(x.time), speed: round1(s * MS_TO_KN), gust: isNum(g) ? round1(g * MS_TO_KN) : null, direction: d })
  }
  return out
}

// ------------------------------------------------------------------ fetching

const CACHE_KEY = 'truevento-wind-v2' // v2: new spot and format
const MAX_AGE = 60 * 60 * 1000 // ask again after an hour
const STALE_LIMIT = 24 * 60 * 60 * 1000 // show an old forecast for up to a day

type Fetcher = typeof fetch

async function getJson(fetcher: Fetcher, url: string) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12_000)
  try {
    const res = await fetcher(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

function readCache(): WindForecastData | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as WindForecastData | null
  } catch {
    return null
  }
}

export async function fetchWind(fetcher: Fetcher = fetch, now: number = Date.now()): Promise<WindForecastData> {
  const cached = readCache()
  if (cached && now - cached.fetchedAt < MAX_AGE) return cached

  const attempts: [WindSource, () => Promise<WindHour[]>][] = [
    ['open-meteo', async () => parseOpenMeteo((await getJson(fetcher, openMeteoUrl())).hourly)],
    ['met-norway', async () => parseMetNorway(await getJson(fetcher, metNorwayUrl()))],
  ]
  for (const [source, load] of attempts) {
    try {
      const days = buildDays(await load())
      if (!days.length) throw new Error('empty forecast')
      const result: WindForecastData = { days, fetchedAt: now, source }
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* full storage */ }
      return result
    } catch { /* try the next source */ }
  }
  // no source answered: the last forecast on this device, if it is recent enough
  if (cached && now - cached.fetchedAt < STALE_LIMIT) return { ...cached, stale: true }
  if (import.meta.env.VITE_DEMO === '1') return { days: buildDays(exampleForecast()), fetchedAt: now, source: 'example' }
  throw new Error('No forecast')
}

/** Demo only: a plausible week of trade winds. */
function exampleForecast(): WindHour[] {
  const out: WindHour[] = []
  const base = new Date()
  for (let d = 0; d < 7; d++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d)
    const iso = `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`
    for (let h = 0; h < 24; h++) {
      const v = Math.max(4, 9 + (d % 3) * 3 + 11 * Math.sin(((h - 7) / 12) * Math.PI))
      out.push({ time: `${iso}T${pad(h)}:00`, speed: round1(v), gust: round1(v + 5), direction: 95 + (h % 5) })
    }
  }
  return out
}
