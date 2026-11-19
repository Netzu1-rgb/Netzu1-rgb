import { useMemo, useState } from 'react'
import type { Student } from '../lib/types'
import { formatMoney } from '../lib/money'
import { Icon } from './ui'

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

interface Props {
  students: Student[]
  value: Student | null
  onChange: (s: Student | null) => void
  onCreateNew: (name: string) => void
  currency: string
  invalid?: boolean
}

/** Searchable student selector, big touch targets, with a shortcut to create a new student. */
export default function StudentPicker({ students, value, onChange, onCreateNew, currency, invalid }: Props) {
  const [query, setQuery] = useState('')
  const matches = useMemo(() => {
    const q = normalize(query.trim())
    const active = students.filter((s) => s.active)
    return (q ? active.filter((s) => normalize(s.full_name).includes(q)) : active).slice(0, 8)
  }, [students, query])

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-sky-brand/40 bg-sky-soft px-4 py-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white font-display font-bold text-sky-deep">
          {value.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ocean-900">{value.full_name}</div>
          <div className="text-sm text-ink-mute">{formatMoney(value.hourly_rate, currency)} / hora{value.pending ? ' · sin sincronizar' : ''}</div>
        </div>
        <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-sky-deep hover:bg-white"
          onClick={() => { onChange(null); setQuery('') }}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
        <input className={`${invalid ? 'input-error' : 'input'} pl-12`} placeholder="Buscar alumno…" value={query}
          onChange={(e) => setQuery(e.target.value)} autoComplete="off" aria-label="Buscar alumno" />
      </div>
      <div className="mt-2 overflow-hidden rounded-xl border border-line bg-white">
        {matches.map((s) => (
          <button key={s.id} type="button" onClick={() => onChange(s)}
            className="flex min-h-14 w-full items-center justify-between gap-3 border-b border-line px-4 text-left last:border-b-0 active:bg-slate-50">
            <span className="truncate font-medium">{s.full_name}</span>
            <span className="shrink-0 text-sm text-ink-mute">{formatMoney(s.hourly_rate, currency)}/h</span>
          </button>
        ))}
        {matches.length === 0 && query.trim() && (
          <div className="px-4 py-3 text-sm text-ink-mute">No hay alumnos con ese nombre.</div>
        )}
        <button type="button" onClick={() => onCreateNew(query.trim())}
          className="flex min-h-14 w-full items-center gap-3 bg-sand/60 px-4 text-left font-semibold text-ocean-900 active:bg-sand">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-ocean-900 text-white"><Icon name="plus" className="h-4 w-4" /></span>
          Nuevo alumno{query.trim() ? `: “${query.trim()}”` : ''}
        </button>
      </div>
    </div>
  )
}
