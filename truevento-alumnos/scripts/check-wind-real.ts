// Validates the app's wind code against a real forecast for the school (MET Norway).
// Usage: npx vite-node scripts/check-wind-real.ts <metno.json>
import { readFileSync } from 'node:fs'
import { setLanguage } from '../src/i18n'
import { buildDays, compass, MS_TO_KN, parseMetNorway, utcToSchool } from '../src/lib/wind'

setLanguage('es')
const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const hours = parseMetNorway(raw)
let checked = 0
let worst = 0
for (const x of raw.properties.timeseries) {
  const local = utcToSchool(x.time)
  const h = hours.find((y) => y.time === local)
  if (!h) continue
  const kn = x.data.instant.details.wind_speed * MS_TO_KN
  const diff = Math.abs(h.speed - kn)
  worst = Math.max(worst, diff)
  if (diff > 0.051) throw new Error(`speed mismatch at ${local}: ${h.speed} vs ${kn}`)
  if (h.direction !== x.data.instant.details.wind_from_direction) throw new Error(`direction mismatch at ${local}`)
  checked++
}
const days = buildDays(hours)
console.log(`hours checked against the source: ${checked}, largest rounding difference ${worst.toFixed(3)} kn`)
for (const d of days) {
  const core = d.hours.filter((h) => +h.time.slice(11, 13) >= 9 && +h.time.slice(11, 13) <= 17)
  const exact = core.reduce((s, h) => s + h.speed, 0) / core.length
  console.log(`${d.date}: avg ${d.avg} kn (exact ${exact.toFixed(2)}), max ${d.max}, gust ${d.gustMax ?? '—'}, from ${compass(d.direction)} ${d.direction}°, ${d.level}, best ${d.best ? `${d.best.from}-${d.best.to}` : '—'}, hours ${d.hours[0].time.slice(11, 13)}–${d.hours.at(-1)!.time.slice(11, 13)}`)
  if (Math.round(exact) !== d.avg) throw new Error('average mismatch')
}
console.log('REAL DATA OK')
