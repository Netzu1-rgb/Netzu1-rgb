import { t } from '../i18n'
// Wind forecast for the spot, from Open-Meteo (free, no key). Kept on the device for
// an hour so the app does not ask again on every screen.

export const SPOT = {
  name: 'Ilha do Guajirú',
  // coast of Itarema, Ceará; forecasts are on a ~10 km grid, so this covers the spot
  lat: Number(import.meta.env.VITE_SPOT_LAT ?? -2.88),
  lon: Number(import.meta.env.VITE_SPOT_LON ?? -39.98),
}

export interface WindHour {
  time: string // YYYY-MM-DDTHH:MM, school local time
  speed: number // knots
  gust: number
  direction: number // degrees, where the wind comes from
}

export interface WindDay {
  date: string
  hours: WindHour[] // 06:00 to 18:00
  avg: number
  max: number
  gustMax: number
}

const CACHE_KEY = 'truevento-wind-v1'
const MAX_AGE = 60 * 60 * 1000

export async function fetchWind(): Promise<{ days: WindDay[]; fetchedAt: number }> {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { days: WindDay[]; fetchedAt: number } | null
    if (cached && Date.now() - cached.fetchedAt < MAX_AGE) return cached
  } catch { /* no cache */ }

  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(SPOT.lat))
  url.searchParams.set('longitude', String(SPOT.lon))
  url.searchParams.set('hourly', 'wind_speed_10m,wind_gusts_10m,wind_direction_10m')
  url.searchParams.set('wind_speed_unit', 'kn')
  url.searchParams.set('timezone', 'America/Fortaleza')
  url.searchParams.set('forecast_days', '7')
  let json: { hourly: { time: string[]; wind_speed_10m: number[]; wind_gusts_10m: number[]; wind_direction_10m: number[] } }
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('No se pudo cargar el pronóstico.')
    json = await res.json()
  } catch (err) {
    // the demo page may run where the forecast cannot be reached: it shows an example
    if (import.meta.env.VITE_DEMO === '1') return { days: groupDays(exampleForecast()), fetchedAt: Date.now() }
    throw err
  }
  const result = { days: groupDays(json.hourly), fetchedAt: Date.now() }
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* full storage */ }
  return result
}

export function groupDays(h: { time: string[]; wind_speed_10m: number[]; wind_gusts_10m: number[]; wind_direction_10m: number[] }): WindDay[] {
  const byDay = new Map<string, WindHour[]>()
  h.time.forEach((t, i) => {
    const hour = Number(t.slice(11, 13))
    if (hour < 6 || hour > 18) return
    const list = byDay.get(t.slice(0, 10)) ?? []
    list.push({ time: t, speed: Math.round(h.wind_speed_10m[i]), gust: Math.round(h.wind_gusts_10m[i]), direction: h.wind_direction_10m[i] })
    byDay.set(t.slice(0, 10), list)
  })
  return [...byDay.entries()].map(([date, hours]) => {
    // the kite hours of the day: late morning to afternoon
    const core = hours.filter((x) => { const hh = Number(x.time.slice(11, 13)); return hh >= 10 && hh <= 17 })
    const pool = core.length ? core : hours
    return {
      date,
      hours,
      avg: Math.round(pool.reduce((s, x) => s + x.speed, 0) / pool.length),
      max: Math.max(...pool.map((x) => x.speed)),
      gustMax: Math.max(...pool.map((x) => x.gust)),
    }
  })
}

export type WindLevel = 'low' | 'good' | 'strong'

/** Rough guide for lessons: under 12 kn is light, 12–25 kn is ideal, more is strong. */
export function windLevel(knots: number): WindLevel {
  if (knots < 12) return 'low'
  if (knots <= 25) return 'good'
  return 'strong'
}

export const windLabel = (l: WindLevel) => t(l === 'low' ? 'wind.low' : l === 'good' ? 'wind.good' : 'wind.strong')

export function compass(deg: number): string {
  return t('wind.dirs').split(',')[Math.round((((deg % 360) + 360) % 360) / 45) % 8]
}

/** Demo only: a plausible week of trade winds. */
function exampleForecast() {
  const time: string[] = [], speed: number[] = [], gust: number[] = [], dir: number[] = []
  const base = new Date()
  for (let d = 0; d < 7; d++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d)
    const iso = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
    for (let h = 0; h < 24; h++) {
      time.push(`${iso}T${String(h).padStart(2, '0')}:00`)
      const v = Math.max(4, 9 + (d % 3) * 3 + 11 * Math.sin(((h - 7) / 12) * Math.PI))
      speed.push(v)
      gust.push(v + 5)
      dir.push(95)
    }
  }
  return { time, wind_speed_10m: speed, wind_gusts_10m: gust, wind_direction_10m: dir }
}
