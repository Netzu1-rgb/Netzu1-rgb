// Extensive checks of the wind forecast: units, time zones, directions, missing
// values, day summaries, lesson guidance, sources, fallbacks and the cache.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '../i18n'
import {
  agreementOf, applyCalibration, bestWindow, buildDays, compass, fetchWind, forecastNow, isGusty, meanDirection, metNorwayUrl, MODELS, MS_TO_KN,
  openMeteoModelsUrl, openMeteoUrl, parseMetNorway, parseOpenMeteo, parseOpenMeteoModels, schoolHour, schoolToday, SPOT, utcToSchool, windLevel, type WindHour,
} from './wind'

setLanguage('es')

/** A day of hours 00..23 at a constant wind, with optional changes per hour. */
function day(date: string, speed: number, opts: { gust?: number | null; dir?: number; per?: Record<number, Partial<WindHour>> } = {}): WindHour[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, '0')}:00`,
    speed,
    gust: opts.gust === undefined ? speed + 5 : opts.gust,
    direction: opts.dir ?? 90,
    ...(opts.per?.[h] ?? {}),
  }))
}

describe('the spot', () => {
  it('is the school on the map of truevento.com (Guajirú, Ceará)', () => {
    expect(SPOT.lat).toBeCloseTo(-2.8813, 3)
    expect(SPOT.lon).toBeCloseTo(-39.9119, 3)
  })

  it('asks Open-Meteo for knots, Ceará time, 7 days and the sea grid cell', () => {
    const u = new URL(openMeteoUrl())
    expect(u.hostname).toBe('api.open-meteo.com')
    expect(u.searchParams.get('latitude')).toBe('-2.8813')
    expect(u.searchParams.get('longitude')).toBe('-39.9119')
    expect(u.searchParams.get('wind_speed_unit')).toBe('kn')
    expect(u.searchParams.get('timezone')).toBe('America/Fortaleza')
    expect(u.searchParams.get('forecast_days')).toBe('7')
    expect(u.searchParams.get('cell_selection')).toBe('sea')
    expect(u.searchParams.get('hourly')!.split(',').sort()).toEqual(['wind_direction_10m', 'wind_gusts_10m', 'wind_speed_10m'])
  })

  it('asks MET Norway for the same point', () => {
    expect(metNorwayUrl()).toBe('https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=-2.8813&lon=-39.9119')
  })
})

describe('time in Ceará (UTC−3, no daylight saving)', () => {
  it('knows the school date whatever the phone time zone is', () => {
    // 01:30 UTC on the 26th is still the 25th in Ceará
    expect(schoolToday(new Date('2026-11-26T01:30:00Z'))).toBe('2026-11-25')
    expect(schoolToday(new Date('2026-11-26T03:00:00Z'))).toBe('2026-11-26')
    expect(schoolHour(new Date('2026-11-25T17:59:00Z'))).toBe('2026-11-25T14:00')
    // year change
    expect(schoolToday(new Date('2027-01-01T02:00:00Z'))).toBe('2026-12-31')
  })

  it('converts UTC times to Ceará time', () => {
    expect(utcToSchool('2026-11-25T13:00:00Z')).toBe('2026-11-25T10:00')
    expect(utcToSchool('2026-11-26T02:00:00Z')).toBe('2026-11-25T23:00')
    // no daylight saving in July either
    expect(utcToSchool('2026-07-01T12:00:00Z')).toBe('2026-07-01T09:00')
  })
})

describe('directions', () => {
  it('uses 16 compass points with correct boundaries', () => {
    const cases: [number, string][] = [
      [0, 'N'], [11.24, 'N'], [11.26, 'NNE'], [45, 'NE'], [67.5, 'ENE'], [78.74, 'ENE'], [78.76, 'E'],
      [90, 'E'], [101.24, 'E'], [101.26, 'ESE'], [112.5, 'ESE'], [135, 'SE'], [180, 'S'], [270, 'O'],
      [348.74, 'NNO'], [348.76, 'N'], [360, 'N'], [-90, 'O'], [450, 'E'],
    ]
    for (const [deg, name] of cases) expect(compass(deg), `${deg}°`).toBe(name)
  })

  it('names the points in each language', () => {
    setLanguage('pt'); expect(compass(90)).toBe('L'); expect(compass(247.5)).toBe('OSO')
    setLanguage('en'); expect(compass(247.5)).toBe('WSW'); expect(compass(292.5)).toBe('WNW')
    setLanguage('es')
  })

  it('averages directions as vectors, across north', () => {
    expect(meanDirection([350, 10])).toBe(0)
    expect(meanDirection([80, 100])).toBe(90)
    expect(meanDirection([90, 90, 90])).toBe(90)
    expect(meanDirection([270, 280])).toBe(275)
    // stronger hours weigh more
    expect(meanDirection([90, 180], [30, 10])).toBeLessThan(115)
  })
})

describe('guidance for lessons', () => {
  it('rates the wind by speed and gusts', () => {
    expect(windLevel(8)).toBe('low')
    expect(windLevel(11.9)).toBe('low')
    expect(windLevel(12)).toBe('good')
    expect(windLevel(25)).toBe('good')
    expect(windLevel(25.1)).toBe('strong')
    // good mean wind, dangerous gusts
    expect(windLevel(20, 31)).toBe('good')
    expect(windLevel(20, 32)).toBe('strong')
    // a light day with a strong gust is strong, not low
    expect(windLevel(10, 34)).toBe('strong')
  })

  it('flags gusty wind (10 kn or more above the mean)', () => {
    expect(isGusty(18, 27)).toBe(false)
    expect(isGusty(18, 28)).toBe(true)
    expect(isGusty(18, null)).toBe(false)
  })
})

describe('day summaries', () => {
  it('averages the lesson hours (9 to 17 h) and keeps 6 to 18 h for the chart', () => {
    const [d] = buildDays(day('2026-11-25', 20, { per: { 3: { speed: 40 }, 21: { speed: 40 } } }))
    expect(d.hours.map((h) => h.time.slice(11, 13))).toEqual(['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18'])
    expect(d.avg).toBe(20) // night hours do not count
    expect(d.max).toBe(20)
    expect(d.gustMax).toBe(25)
    expect(d.direction).toBe(90)
    expect(d.level).toBe('good')
  })

  it('rounds the mean from the exact values, not from rounded hours', () => {
    // nine lesson hours: 4 at 12.4 and 5 at 13.4 -> 12.96 -> 13 (rounding first would give 12.56 -> 13 too, so use .5 edges)
    const per: Record<number, Partial<WindHour>> = {}
    for (let h = 9; h <= 17; h++) per[h] = { speed: h <= 12 ? 12.4 : 12.6 }
    const [d] = buildDays(day('2026-11-25', 0, { per, gust: null }))
    // exact mean 12.51 -> 13; rounding each hour first would give (4*12 + 5*13)/9 = 12.56 -> 13; both 13, check the value is exact
    expect(d.avg).toBe(13)
    expect(d.gustMax).toBeNull()
  })

  it('never turns a missing value into 0 knots', () => {
    const hours = parseOpenMeteo({
      time: ['2026-11-25T09:00', '2026-11-25T10:00', '2026-11-25T11:00', '2026-11-25T12:00', '2026-11-25T13:00'],
      wind_speed_10m: [18, null, 20, 22, null],
      wind_gusts_10m: [24, 26, null, 28, 30],
      wind_direction_10m: [90, 95, 100, null, 110],
    })
    // 10:00 has no speed, 12:00 no direction, 13:00 no speed: skipped
    expect(hours.map((h) => h.time)).toEqual(['2026-11-25T09:00', '2026-11-25T11:00'])
    expect(hours[1].gust).toBeNull()
    expect(hours.every((h) => h.speed > 0)).toBe(true)
  })

  it('skips days with too few lesson hours (the end of the forecast)', () => {
    const partial = day('2026-12-01', 20).filter((h) => h.time.slice(11, 13) < '11')
    expect(buildDays(partial)).toEqual([])
  })

  it('marks a gusty day and a strong day', () => {
    const [gusty] = buildDays(day('2026-11-25', 18, { gust: 29 }))
    expect(gusty.gusty).toBe(true)
    expect(gusty.level).toBe('good')
    const [strong] = buildDays(day('2026-11-25', 20, { gust: 34 }))
    expect(strong.level).toBe('strong')
  })

  it('keeps days in order and separate', () => {
    const days = buildDays([...day('2026-11-26', 15), ...day('2026-11-25', 22)])
    expect(days.map((d) => [d.date, d.avg])).toEqual([['2026-11-26', 15], ['2026-11-25', 22]])
  })
})

describe('best time for lessons', () => {
  it('finds the longest run of good hours', () => {
    const per: Record<number, Partial<WindHour>> = {}
    for (let h = 0; h < 24; h++) per[h] = { speed: h >= 11 && h <= 15 ? 18 : h === 8 || h === 9 ? 16 : 6 }
    const [d] = buildDays(day('2026-11-25', 0, { per, gust: null }))
    expect(d.best).toEqual({ from: '11:00', to: '15:00' })
  })

  it('never ends after the last hour shown (18 h)', () => {
    const [d] = buildDays(day('2026-11-25', 20, { gust: null }))
    expect(d.best).toEqual({ from: '06:00', to: '18:00' })
  })

  it('needs at least two hours in a row', () => {
    const per: Record<number, Partial<WindHour>> = {}
    for (let h = 0; h < 24; h++) per[h] = { speed: h === 13 ? 18 : 5 }
    const hours = buildDays(day('2026-11-25', 0, { per, gust: null }))[0].hours
    expect(bestWindow(hours)).toBeNull()
  })

  it('breaks the run where an hour is missing', () => {
    // 10–11 h, a missing hour at 12 h, then 13–16 h: the longer run wins
    const hours = day('2026-11-25', 18, { gust: null }).filter((h) => h.time.slice(11, 13) !== '12').filter((h) => {
      const hh = Number(h.time.slice(11, 13)); return hh >= 10 && hh <= 16
    })
    expect(bestWindow(hours)).toEqual({ from: '13:00', to: '16:00' })
    // equal runs: the earlier one
    const tie = day('2026-11-25', 18, { gust: null }).filter((h) => h.time.slice(11, 13) !== '13').filter((h) => {
      const hh = Number(h.time.slice(11, 13)); return hh >= 10 && hh <= 16
    })
    expect(bestWindow(tie)).toEqual({ from: '10:00', to: '12:00' })
  })

  it('leaves out hours with dangerous gusts', () => {
    const hours = day('2026-11-25', 18, { gust: null, per: { 12: { gust: 33 } } }).filter((h) => {
      const hh = Number(h.time.slice(11, 13)); return hh >= 10 && hh <= 16
    })
    expect(bestWindow(hours)).toEqual({ from: '13:00', to: '16:00' })
  })
})

describe('MET Norway (backup source)', () => {
  const sample = {
    properties: {
      timeseries: [
        { time: '2026-11-25T12:00:00Z', data: { instant: { details: { wind_speed: 10, wind_from_direction: 95, wind_speed_of_gust: 14 } } } },
        { time: '2026-11-25T13:00:00Z', data: { instant: { details: { wind_speed: 10.3, wind_from_direction: 92 } } } },
        { time: '2026-11-25T14:00:00Z', data: { instant: { details: { wind_from_direction: 92 } } } },
        { time: '2026-11-25T15:00:00Z', data: { instant: { details: { wind_speed: 9.8, wind_from_direction: 91 } } } },
        // the series switches to 6-hour steps: not used
        { time: '2026-11-25T21:00:00Z', data: { instant: { details: { wind_speed: 4, wind_from_direction: 50 } } } },
      ],
    },
  }

  it('converts m/s to knots and UTC to Ceará time', () => {
    const hours = parseMetNorway(sample)
    expect(MS_TO_KN).toBeCloseTo(1.943844, 6)
    expect(hours[0]).toEqual({ time: '2026-11-25T09:00', speed: 19.4, gust: 27.2, direction: 95 })
    expect(hours[1]).toEqual({ time: '2026-11-25T10:00', speed: 20, gust: null, direction: 92 })
  })

  it('skips hours without wind and stops at the 6-hour steps', () => {
    expect(parseMetNorway(sample).map((h) => h.time)).toEqual(['2026-11-25T09:00', '2026-11-25T10:00', '2026-11-25T12:00'])
  })

  it('rejects an answer without a forecast', () => {
    expect(() => parseMetNorway({} as never)).toThrow()
    expect(() => parseOpenMeteo(undefined as never)).toThrow()
  })
})

describe('getting the forecast', () => {
  const store = new Map<string, string>()
  beforeEach(() => {
    store.clear()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v) },
      removeItem: (k: string) => { store.delete(k) },
    })
  })

  const openMeteoJson = () => {
    const h = day('2026-11-25', 19.6, { dir: 92 })
    return {
      hourly: {
        time: h.map((x) => x.time), wind_speed_10m: h.map((x) => x.speed),
        wind_gusts_10m: h.map((x) => x.gust), wind_direction_10m: h.map((x) => x.direction),
      },
    }
  }
  const ok = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  const fail = (status = 429) => Promise.resolve(new Response('{"error":true}', { status }))

  it('uses the consensus of the models and keeps the answer for an hour', async () => {
    const fetcher = vi.fn(() => ok(modelsJson()))
    const now = Date.parse('2026-11-25T15:00:00Z')
    const a = await fetchWind(fetcher as never, now)
    expect(a.source).toBe('consensus')
    expect(a.models).toBe(3)
    expect(a.days[0].agreement).toBe('high')
    const b = await fetchWind(fetcher as never, now + 30 * 60_000)
    expect(fetcher).toHaveBeenCalledTimes(1) // from the device
    expect(b.fetchedAt).toBe(now)
    await fetchWind(fetcher as never, now + 61 * 60_000)
    expect(fetcher).toHaveBeenCalledTimes(2) // asked again after an hour
  })

  it("falls back to Open-Meteo's single forecast when the models request fails", async () => {
    const fetcher = vi.fn((url: string) => (url.includes('models=') ? fail(400) : ok(openMeteoJson())))
    const a = await fetchWind(fetcher as never, Date.parse('2026-11-25T15:00:00Z'))
    expect(a.source).toBe('open-meteo')
    expect(a.days[0].avg).toBe(20)
    expect(compass(a.days[0].direction)).toBe('E')
    expect(a.days[0].agreement).toBeNull()
  })

  it('falls back to MET Norway when Open-Meteo fails', async () => {
    const met = { properties: { timeseries: Array.from({ length: 24 }, (_, i) => ({
      time: new Date(Date.parse('2026-11-25T09:00:00Z') + i * 3600_000).toISOString(),
      data: { instant: { details: { wind_speed: 10, wind_from_direction: 100 } } },
    })) } }
    const fetcher = vi.fn((url: string) => (url.includes('open-meteo') ? fail(429) : ok(met)))
    const r = await fetchWind(fetcher as never, Date.parse('2026-11-25T15:00:00Z'))
    expect(r.source).toBe('met-norway')
    expect(r.days[0].avg).toBe(19) // 10 m/s = 19.4 kn
    expect(compass(r.days[0].direction)).toBe('E')
  })

  it('shows the last saved forecast, marked, when nothing answers', async () => {
    const now = Date.parse('2026-11-25T15:00:00Z')
    await fetchWind(vi.fn(() => ok(openMeteoJson())) as never, now)
    const down = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    const r = await fetchWind(down as never, now + 3 * 3600_000)
    expect(r.stale).toBe(true)
    expect(r.fetchedAt).toBe(now)
    // older than a day: no longer shown
    await expect(fetchWind(down as never, now + 25 * 3600_000)).rejects.toThrow()
  })

  it('reports an error when there is nothing to show', async () => {
    await expect(fetchWind(vi.fn(() => fail(500)) as never)).rejects.toThrow()
  })

  it('treats an empty or broken answer as a failure, not as calm wind', async () => {
    const fetcher = vi.fn((url: string) => (url.includes('open-meteo')
      ? ok({ hourly: { time: [], wind_speed_10m: [], wind_gusts_10m: [], wind_direction_10m: [] } })
      : ok({ nonsense: true })))
    await expect(fetchWind(fetcher as never)).rejects.toThrow()
  })
})

// ------------------------------------------------------------------ models and calibration

/** Hourly answer of the models request: each model at its own constant wind. */
function modelsJson(per: Record<string, { s: number; g?: number | null; d?: number }> = {
  ecmwf_ifs025: { s: 20, g: 26 }, icon_seamless: { s: 19, g: 25 }, gfs_seamless: { s: 21, g: 27 },
}) {
  const time = Array.from({ length: 24 }, (_, h) => `${schoolToday(new Date('2026-11-25T15:00:00Z'))}T${String(h).padStart(2, '0')}:00`)
  const hourly: Record<string, unknown[]> = { time }
  for (const [m, v] of Object.entries(per)) {
    hourly[`wind_speed_10m_${m}`] = time.map(() => v.s)
    hourly[`wind_gusts_10m_${m}`] = time.map(() => (v.g === undefined ? v.s + 5 : v.g))
    hourly[`wind_direction_10m_${m}`] = time.map(() => v.d ?? 90)
  }
  return { hourly }
}

describe('consensus of the weather models', () => {
  it('asks Open-Meteo for every model, at the sea cell, in knots', () => {
    const url = new URL(openMeteoModelsUrl())
    expect(url.searchParams.get('models')!.split(',')).toEqual(MODELS.map(([m]) => m))
    expect(url.searchParams.get('cell_selection')).toBe('sea')
    expect(url.searchParams.get('wind_speed_unit')).toBe('kn')
  })

  it('weights the models: ECMWF counts double', () => {
    const h = parseOpenMeteoModels(modelsJson({ ecmwf_ifs025: { s: 22 }, gfs_seamless: { s: 19 } }).hourly as never)
    expect(h[12].speed).toBe(21) // (22·2 + 19·1) / 3
    expect(h[12].models).toBe(2)
  })

  it('leaves out a model far from the rest, and reports the spread', () => {
    const h = parseOpenMeteoModels(modelsJson({
      ecmwf_ifs025: { s: 20 }, icon_seamless: { s: 21 }, gfs_seamless: { s: 19 }, jma_seamless: { s: 8 },
    }).hourly as never)
    expect(h[12].models).toBe(3)
    expect(h[12].speed).toBe(20)
    expect(h[12].spread).toBeLessThan(1)
  })

  it('skips hours with fewer than two models, never treats a gap as calm', () => {
    const j = modelsJson({ ecmwf_ifs025: { s: 20 }, gfs_seamless: { s: 20 } })
    ;(j.hourly['wind_speed_10m_gfs_seamless'] as unknown[])[10] = null
    const h = parseOpenMeteoModels(j.hourly as never)
    expect(h.find((x) => x.time.endsWith('10:00'))).toBeUndefined()
    expect(h).toHaveLength(23)
  })

  it('a model without gusts does not pull the gust down; gust never below the wind', () => {
    const h = parseOpenMeteoModels(modelsJson({ ecmwf_ifs025: { s: 20, g: 28 }, ukmo_seamless: { s: 20, g: null } }).hourly as never)
    expect(h[12].gust).toBe(28)
  })

  it('says how much the models agree over the day', () => {
    const hrs = (spread: number) => Array.from({ length: 6 }, (_, i) => ({ time: `x${i}`, speed: 18, gust: 22, direction: 90, spread }))
    expect(agreementOf(hrs(1.5))).toBe('high')
    expect(agreementOf(hrs(3.5))).toBe('medium')
    expect(agreementOf(hrs(6))).toBe('low')
    expect(agreementOf(hrs(1).map(({ spread: _s, ...x }) => x))).toBeNull()
  })
})

describe("calibration with the school's measurements", () => {
  const base = () => ({ days: buildDays(day('2026-11-25', 15, { gust: 20 })), fetchedAt: 0, source: 'consensus' as const })

  it('multiplies every speed and gust, and works out the days again', () => {
    const r = applyCalibration(base(), { factor: 1.25, count: 4 })
    expect(r.days[0].avg).toBe(19) // 15 × 1.25 = 18.75
    expect(r.days[0].hours[0].gust).toBe(25)
    expect(r.days[0].level).toBe('good')
    expect(r.calibration).toEqual({ factor: 1.25, count: 4 })
  })

  it('changes nothing without a correction', () => {
    const d = base()
    expect(applyCalibration(d, null)).toBe(d)
    expect(applyCalibration(d, { factor: 1, count: 5 })).toBe(d)
  })

  it('the forecast for this hour is given without the correction, to compare with a measurement', () => {
    const r = applyCalibration(base(), { factor: 1.2, count: 3 })
    const h = forecastNow(r, new Date('2026-11-25T15:00:00Z')) // 12 h in Ceará
    expect(h?.speed).toBe(15)
  })
})
