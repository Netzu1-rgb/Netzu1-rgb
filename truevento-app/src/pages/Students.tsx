import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useInstructors, useStudents } from '../lib/hooks'
import { fetchStudentTotals } from '../lib/api'
import { useData } from '../lib/useData'
import { formatHours, formatMoney, sumHours } from '../lib/money'
import StudentForm from '../components/StudentForm'
import { EmptyState, ErrorBox, Icon, Loading, OfflineNote, PageHeader } from '../components/ui'

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function Students() {
  const { session, currency } = useAuth()
  const students = useStudents()
  const instructors = useInstructors()
  const totals = useData(`${session!.user.id}:student-totals`, fetchStudentTotals)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const stats = useMemo(() => {
    const m = new Map<string, { hours: number[]; count: number; last: string }>()
    for (const r of totals.data ?? []) {
      const cur = m.get(r.student_id) ?? { hours: [], count: 0, last: '' }
      cur.hours.push(Number(r.hours))
      cur.count++
      if (r.class_date > cur.last) cur.last = r.class_date
      m.set(r.student_id, cur)
    }
    return m
  }, [totals.data])

  const list = useMemo(() => {
    const q = normalize(query.trim())
    return (students.data ?? [])
      .filter((s) => showInactive || s.active)
      .filter((s) => !q || normalize(s.full_name).includes(q) || (s.phone ?? '').includes(q))
  }, [students.data, query, showInactive])

  const instructorName = (id: string | null) => instructors.data?.find((i) => i.id === id)?.full_name

  return (
    <div>
      <PageHeader title="Alumnos y clases" subtitle={`${(students.data ?? []).filter((s) => s.active).length} alumnos activos`}
        action={<button type="button" className="btn-primary" onClick={() => setFormOpen(true)}><Icon name="plus" /> <span className="hidden sm:inline">Nuevo alumno</span><span className="sm:hidden">Nuevo</span></button>} />
      {students.offline && <OfflineNote savedAt={students.savedAt} />}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
          <input className="input pl-12" placeholder="Buscar por nombre o teléfono…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Mostrar inactivos
        </label>
      </div>

      {students.error && !students.data && <ErrorBox message={students.error} onRetry={students.reload} />}
      {students.loading && !students.data ? <Loading /> : list.length === 0 ? (
        <EmptyState title={query ? 'Sin resultados' : 'Todavía no hay alumnos'}
          text={query ? 'Probá con otro nombre.' : 'Creá el primer alumno o registrá una clase con un alumno nuevo.'}
          action={!query && <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}><Icon name="plus" /> Nuevo alumno</button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => {
            const st = stats.get(s.id)
            return (
              <li key={s.id}>
                <Link to={`/alumnos/${s.id}`} className="card flex items-center gap-4 p-4 transition hover:border-brand/40 active:scale-[0.99]">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-lg font-bold text-brand-deep">
                    {s.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-heading">{s.full_name}</span>
                      {!s.active && <span className="badge bg-surface-2 text-ink-mute">Inactivo</span>}
                      {s.pending && <span className="badge bg-sand text-ink-soft">Sin sincronizar</span>}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-ink-mute">
                      {formatMoney(s.hourly_rate, currency)}/h{instructorName(s.default_instructor_id) ? ` · ${instructorName(s.default_instructor_id)}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <div className="tabular font-semibold">{formatHours(st ? sumHours(st.hours) : 0)}</div>
                    <div className="text-ink-mute">{st?.count ?? 0} clases</div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      <StudentForm open={formOpen} student={null} instructors={instructors.data ?? []} onClose={() => setFormOpen(false)}
        onSaved={() => students.reload()} />
    </div>
  )
}
