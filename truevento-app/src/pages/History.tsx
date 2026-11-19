import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import PeriodFilter from '../components/PeriodFilter'
import { EmptyState, ErrorBox, Icon, Loading, OfflineNote, PageHeader, useConfirm, useToast } from '../components/ui'
import { deleteClass, fetchClasses } from '../lib/api'
import { useInstructors, usePendingOutbox, useStudents } from '../lib/hooks'
import { useData } from '../lib/useData'
import { formatShortDate, periodFor, type Period } from '../lib/dates'
import { classAmounts, formatHours, formatMoney, fromCents, sumAmounts, sumHours } from '../lib/money'
import { friendlyError } from '../lib/errors'
import { downloadCsv, toCsv } from '../lib/csv'
import type { ClassRow } from '../lib/types'

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export default function History() {
  const { session, isAdmin, currency } = useAuth()
  const uid = session!.user.id
  const toast = useToast()
  const confirm = useConfirm()
  const instructors = useInstructors()
  const students = useStudents()
  const outbox = usePendingOutbox()
  const [period, setPeriod] = useState<Period>(() => periodFor('month'))
  const [query, setQuery] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const classes = useData(`${uid}:classes:${period.from}:${period.to}`, () => fetchClasses({ from: period.from, to: period.to }))

  // classes saved on this device without connection, shown until they sync
  const local: ClassRow[] = useMemo(() => outbox.classes
    .filter((c) => c.class_date >= period.from && c.class_date <= period.to)
    .filter((c) => !(classes.data ?? []).some((r) => r.id === c.id))
    .map((c) => {
      const ins = instructors.data?.find((i) => i.id === c.instructor_id)
      const rate = ins?.kind === 'owner' ? 0 : c.instructor_rate ?? ins?.hourly_pay ?? 0
      const a = classAmounts(c.hours, c.student_rate, rate)
      return {
        ...c, instructor_rate: rate, instructor_kind: ins?.kind ?? 'external', total_amount: fromCents(a.totalCents),
        instructor_pay: fromCents(a.instructorPayCents), school_profit: fromCents(a.profitCents), settlement_id: null,
        created_at: '', pending: true,
        student: { full_name: students.data?.find((s) => s.id === c.student_id)?.full_name ?? 'Alumno' },
        instructor: { full_name: ins?.full_name ?? '—' },
      }
    }), [outbox.classes, classes.data, instructors.data, students.data, period])

  const rows = useMemo(() => {
    const q = normalize(query.trim())
    return [...local, ...(classes.data ?? [])]
      .filter((r) => !instructorId || r.instructor_id === instructorId)
      .filter((r) => !q || normalize(r.student?.full_name ?? '').includes(q) || normalize(r.notes ?? '').includes(q))
  }, [local, classes.data, instructorId, query])

  const totals = {
    hours: sumHours(rows.map((r) => r.hours)),
    total: sumAmounts(rows.map((r) => r.total_amount)),
    pay: sumAmounts(rows.map((r) => r.instructor_pay)),
    profit: sumAmounts(rows.map((r) => r.school_profit)),
  }

  async function remove(r: ClassRow) {
    const ok = await confirm({
      title: 'Eliminar clase',
      message: <>Se eliminará la clase de <b>{r.student?.full_name}</b> del {formatShortDate(r.class_date)} ({formatHours(r.hours)}, {formatMoney(r.total_amount, currency)}). No se puede deshacer.</>,
      confirmLabel: 'Eliminar', danger: true,
    })
    if (!ok) return
    try {
      await deleteClass(r.id)
      toast('Clase eliminada.')
      classes.reload()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  function exportCsv() {
    const cols = [
      { header: 'Fecha', value: (r: ClassRow) => r.class_date },
      { header: 'Alumno', value: (r: ClassRow) => r.student?.full_name },
      { header: 'Instructor', value: (r: ClassRow) => r.instructor?.full_name },
      { header: 'Duración', value: (r: ClassRow) => formatHours(r.hours) },
      { header: 'Horas (decimal)', value: (r: ClassRow) => r.hours, numeric: true },
      { header: 'Precio por hora alumno', value: (r: ClassRow) => r.student_rate, numeric: true },
      { header: 'Total cobrado', value: (r: ClassRow) => r.total_amount, numeric: true },
      { header: 'Pago por hora instructor', value: (r: ClassRow) => r.instructor_rate, numeric: true },
      { header: 'Pago al instructor', value: (r: ClassRow) => r.instructor_pay, numeric: true },
      ...(isAdmin ? [{ header: 'Ganancia escuela', value: (r: ClassRow) => r.school_profit, numeric: true }] : []),
      { header: 'Estado pago instructor', value: (r: ClassRow) => (r.instructor_kind === 'owner' ? 'Dueño' : r.settlement_id ? 'Pagado' : 'Pendiente') },
      { header: 'Observaciones', value: (r: ClassRow) => r.notes },
    ]
    downloadCsv(`truevento-clases-${period.from}-a-${period.to}.csv`, toCsv(rows, cols))
  }

  return (
    <div>
      <PageHeader title="Historial" subtitle={`${rows.length} clases`}
        action={<button type="button" className="btn-ghost" onClick={exportCsv} disabled={rows.length === 0}>
          <Icon name="download" /> <span className="hidden sm:inline">Exportar a Excel (CSV)</span><span className="sm:hidden">CSV</span>
        </button>} />
      {classes.offline && <OfflineNote savedAt={classes.savedAt} />}

      <div className="card mb-5 space-y-3 p-4">
        <PeriodFilter value={period} onChange={setPeriod} />
        <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-2' : ''}`}>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
            <input className="input pl-12" placeholder="Buscar alumno…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {isAdmin && (
            <select className="input" aria-label="Instructor" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">Todos los instructores</option>
              {(instructors.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.full_name}</option>)}
            </select>
          )}
        </div>
      </div>

      {classes.error && <div className="mb-4"><ErrorBox message={classes.error} onRetry={classes.reload} /></div>}
      {classes.loading && !classes.data ? <Loading /> : rows.length === 0 ? (
        <EmptyState title="No hay clases" text="Probá con otro período o filtro." />
      ) : (
        <>
          {/* phones: cards */}
          <ul className="space-y-3 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-ocean-900">{r.student?.full_name}</div>
                    <div className="text-sm text-ink-mute">{formatShortDate(r.class_date)} · {r.instructor?.full_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="tabular font-display text-lg font-bold">{formatMoney(r.total_amount, currency)}</div>
                    <div className="tabular text-sm text-ink-mute">{formatHours(r.hours)} × {formatMoney(r.student_rate, currency)}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <StatusBadge r={r} />
                  {r.instructor_kind === 'external' && <span className="text-ink-mute">Instructor: {formatMoney(r.instructor_pay, currency)}</span>}
                  {isAdmin && <span className="text-ink-mute">· Ganancia: {formatMoney(r.school_profit, currency)}</span>}
                </div>
                {r.notes && <p className="mt-2 text-sm text-ink-soft">{r.notes}</p>}
                {isAdmin && !r.pending && !r.settlement_id && (
                  <div className="mt-3 flex gap-2 border-t border-line pt-3">
                    <Link to={`/clases/${r.id}/editar`} className="btn-ghost min-h-10 flex-1 py-2 text-sm"><Icon name="edit" className="h-4 w-4" /> Editar</Link>
                    <button type="button" className="btn-ghost min-h-10 flex-1 py-2 text-sm text-coral" onClick={() => void remove(r)}>
                      <Icon name="trash" className="h-4 w-4" /> Eliminar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* tablets and computers: table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-mist text-left text-xs font-semibold uppercase tracking-wide text-ink-mute">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3 text-right">Horas</th>
                  <th className="px-4 py-3 text-right">Precio/h</th>
                  <th className="px-4 py-3 text-right">Total cobrado</th>
                  <th className="px-4 py-3 text-right">Pago instructor</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Ganancia</th>}
                  <th className="px-4 py-3">Estado</th>
                  {isAdmin && <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>}
                </tr>
              </thead>
              <tbody className="tabular divide-y divide-line">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-mist/60">
                    <td className="whitespace-nowrap px-4 py-3">{formatShortDate(r.class_date)}</td>
                    <td className="px-4 py-3 font-medium">{r.student?.full_name}</td>
                    <td className="px-4 py-3">{r.instructor?.full_name}</td>
                    <td className="px-4 py-3 text-right">{formatHours(r.hours)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(r.student_rate, currency)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatMoney(r.total_amount, currency)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(r.instructor_pay, currency)}</td>
                    {isAdmin && <td className="px-4 py-3 text-right font-semibold text-teal-700">{formatMoney(r.school_profit, currency)}</td>}
                    <td className="px-4 py-3"><StatusBadge r={r} /></td>
                    {isAdmin && (
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        {!r.pending && !r.settlement_id && (
                          <>
                            <Link to={`/clases/${r.id}/editar`} className="inline-grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-slate-100" aria-label="Editar"><Icon name="edit" className="h-4 w-4" /></Link>
                            <button type="button" onClick={() => void remove(r)} className="inline-grid h-9 w-9 place-items-center rounded-lg text-coral hover:bg-coral-soft" aria-label="Eliminar"><Icon name="trash" className="h-4 w-4" /></button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="tabular border-t-2 border-line bg-mist font-semibold">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>Totales</td>
                  <td className="px-4 py-3 text-right">{formatHours(totals.hours)}</td>
                  <td />
                  <td className="px-4 py-3 text-right">{formatMoney(totals.total, currency)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(totals.pay, currency)}</td>
                  {isAdmin && <td className="px-4 py-3 text-right text-teal-700">{formatMoney(totals.profit, currency)}</td>}
                  <td colSpan={isAdmin ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="card mt-4 grid grid-cols-2 gap-3 p-4 text-sm md:hidden">
            <div>Horas: <b className="tabular">{formatHours(totals.hours)}</b></div>
            <div>Cobrado: <b className="tabular">{formatMoney(totals.total, currency)}</b></div>
            <div>Instructores: <b className="tabular">{formatMoney(totals.pay, currency)}</b></div>
            {isAdmin && <div>Ganancia: <b className="tabular">{formatMoney(totals.profit, currency)}</b></div>}
          </div>
        </>
      )}
    </div>
  )
}

function StatusBadge({ r }: { r: ClassRow }) {
  if (r.pending) return <span className="badge bg-sand text-ink-soft"><Icon name="cloudOff" className="h-3 w-3" /> Sin sincronizar</span>
  if (r.instructor_kind === 'owner') return <span className="badge bg-sky-soft text-sky-deep">Dueño</span>
  if (r.settlement_id) return <span className="badge bg-lagoon-soft text-teal-800">Liquidada</span>
  return <span className="badge bg-coral-soft text-[#9a2f22]">Pago pendiente</span>
}
