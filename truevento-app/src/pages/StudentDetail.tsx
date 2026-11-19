import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { fetchClasses, fetchStudent } from '../lib/api'
import { useData } from '../lib/useData'
import { useInstructors } from '../lib/hooks'
import { formatDate } from '../lib/dates'
import { formatHours, formatMoney, sumAmounts, sumHours } from '../lib/money'
import StudentForm from '../components/StudentForm'
import { ErrorBox, Icon, Loading, OfflineNote, Stat } from '../components/ui'

export default function StudentDetail() {
  const { id } = useParams()
  const { session, isAdmin, currency } = useAuth()
  const uid = session!.user.id
  const student = useData(`${uid}:student:${id}`, () => fetchStudent(id!))
  const classes = useData(`${uid}:classes:student:${id}`, () => fetchClasses({ studentId: id }))
  const instructors = useInstructors()
  const [editOpen, setEditOpen] = useState(false)

  if (student.loading && !student.data) return <Loading />
  if (!student.data) return <ErrorBox message={student.error ?? 'No se encontró el alumno.'} onRetry={student.reload} />
  const s = student.data
  const rows = classes.data ?? []
  const instructorName = instructors.data?.find((i) => i.id === s.default_instructor_id)?.full_name

  return (
    <div>
      <Link to="/alumnos" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-deep">
        <Icon name="chevronLeft" className="h-4 w-4" /> Alumnos
      </Link>
      {(student.offline || classes.offline) && <OfflineNote savedAt={student.savedAt} />}

      <div className="card mb-5 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ocean-900 font-display text-xl font-bold text-white">
            {s.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-ocean-900">{s.full_name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-mute">
              <span>{formatMoney(s.hourly_rate, currency)} por hora</span>
              <span>Desde {formatDate(s.start_date)}</span>
              {instructorName && <span>Instructor: {instructorName}</span>}
              {!s.active && <span className="badge bg-slate-100">Inactivo</span>}
            </div>
            {s.phone && (
              <a href={`tel:${s.phone}`} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-deep">
                <Icon name="phone" className="h-4 w-4" /> {s.phone}
              </a>
            )}
            {s.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-mist px-3 py-2 text-sm text-ink-soft">{s.notes}</p>}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link to={`/registrar?alumno=${s.id}`} className="btn-primary"><Icon name="plus" /> Registrar clase</Link>
          {isAdmin && <button type="button" className="btn-ghost" onClick={() => setEditOpen(true)}><Icon name="edit" /> Editar ficha</button>}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Clases" value={rows.length} />
        <Stat label="Horas" value={formatHours(sumHours(rows.map((r) => r.hours)))} />
        <Stat label="Total cobrado" value={formatMoney(sumAmounts(rows.map((r) => r.total_amount)), currency)} />
      </div>

      <h2 className="mb-3 text-lg font-semibold text-ocean-900">Historial de clases</h2>
      {classes.error && <ErrorBox message={classes.error} onRetry={classes.reload} />}
      {classes.loading && !classes.data ? <Loading /> : rows.length === 0 ? (
        <div className="card p-6 text-center text-ink-mute">Todavía no tiene clases registradas.</div>
      ) : (
        <ul className="card divide-y divide-line">
          {rows.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{formatDate(c.class_date)}</div>
                <div className="truncate text-sm text-ink-mute">
                  {c.instructor?.full_name ?? '—'} · {c.fixed_total !== null ? 'precio total' : `${formatMoney(c.student_rate, currency)}/h`}
                  {c.price_note ? ` · ${c.price_note}` : ''}
                  {c.notes ? ` · ${c.notes}` : ''}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="tabular font-semibold">{formatMoney(c.total_amount, currency)}</div>
                <div className="tabular text-sm text-ink-mute">{formatHours(c.hours)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <StudentForm open={editOpen} student={s} instructors={instructors.data ?? []} onClose={() => setEditOpen(false)}
        onSaved={() => { student.reload(); classes.reload() }} />
    </div>
  )
}
