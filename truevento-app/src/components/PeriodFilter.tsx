import { describePeriod, periodFor, shiftPeriod, today, type Period, type PeriodKind } from '../lib/dates'
import { Icon } from './ui'

const KINDS: { kind: PeriodKind; label: string }[] = [
  { kind: 'day', label: 'Día' },
  { kind: 'week', label: 'Semana' },
  { kind: 'month', label: 'Mes' },
  { kind: 'year', label: 'Año' },
  { kind: 'custom', label: 'Rango' },
]

export default function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  function pick(kind: PeriodKind) {
    if (kind === 'custom') onChange({ kind, from: value.from, to: value.to })
    else onChange(periodFor(kind, value.kind === 'custom' ? today() : value.from))
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:gap-2">
        {KINDS.map((k) => (
          <button key={k.kind} type="button" onClick={() => pick(k.kind)}
            className={`${value.kind === k.kind ? 'chip-on' : 'chip'} px-2 sm:px-4`}>
            {k.label}
          </button>
        ))}
      </div>
      {value.kind === 'custom' ? (
        <div className="grid grid-cols-2 gap-2">
          <input type="date" className="input" aria-label="Desde" value={value.from} max={value.to}
            onChange={(e) => e.target.value && onChange({ ...value, from: e.target.value })} />
          <input type="date" className="input" aria-label="Hasta" value={value.to} min={value.from}
            onChange={(e) => e.target.value && onChange({ ...value, to: e.target.value })} />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface">
          <button type="button" className="grid h-12 w-12 place-items-center text-ink-soft" aria-label="Período anterior"
            onClick={() => onChange(shiftPeriod(value, -1))}><Icon name="chevronLeft" /></button>
          <span className="font-semibold text-heading">{describePeriod(value)}</span>
          <button type="button" className="grid h-12 w-12 place-items-center text-ink-soft" aria-label="Período siguiente"
            onClick={() => onChange(shiftPeriod(value, 1))}><Icon name="chevronRight" /></button>
        </div>
      )}
    </div>
  )
}
