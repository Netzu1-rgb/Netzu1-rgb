import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import PeriodFilter from '../components/PeriodFilter'
import { ErrorBox, Field, Icon, Loading, Modal, OfflineNote, PageHeader, Spinner, Stat, useConfirm, useToast } from '../components/ui'
import { cancelSettlement, fetchClasses, fetchSettlements, paySettlement } from '../lib/api'
import { useInstructors } from '../lib/hooks'
import { useData } from '../lib/useData'
import { describePeriod, formatDate, formatShortDate, periodFor, today, type Period } from '../lib/dates'
import { formatHours, formatMoney, sumAmounts, sumHours } from '../lib/money'
import { friendlyError } from '../lib/errors'
import { downloadCsv, toCsv } from '../lib/csv'
import type { ClassRow, Settlement } from '../lib/types'

export default function Settlements() {
  const { session, isAdmin, profile, currency } = useAuth()
  const uid = session!.user.id
  const instructors = useInstructors()
  const [instructorId, setInstructorId] = useState('')
  const [period, setPeriod] = useState<Period>(() => periodFor('month'))
  const [payOpen, setPayOpen] = useState(false)

  // admins pick any instructor (externals first); instructors see themselves
  useEffect(() => {
    if (instructorId || !instructors.data?.length) return
    if (!isAdmin) setInstructorId(profile?.instructor_id ?? '')
    else setInstructorId((instructors.data.find((i) => i.kind === 'external' && i.active) ?? instructors.data[0]).id)
  }, [instructors.data, instructorId, isAdmin, profile?.instructor_id])

  const instructor = instructors.data?.find((i) => i.id === instructorId)
  const classes = useData(instructorId ? `${uid}:classes:${instructorId}:${period.from}:${period.to}` : null,
    () => fetchClasses({ instructorId, from: period.from, to: period.to }))
  const history = useData(`${uid}:settlements:${isAdmin ? instructorId || 'all' : 'mine'}`,
    () => fetchSettlements(isAdmin ? instructorId || undefined : undefined))

  const rows = useMemo(() => classes.data ?? [], [classes.data])
  const pending = rows.filter((r) => !r.settlement_id)
  const paid = rows.filter((r) => r.settlement_id)
  const isOwner = instructor?.kind === 'owner'
  const pendingAmount = sumAmounts(pending.map((r) => r.instructor_pay))

  function exportDetail() {
    const csv = toCsv(rows, [
      { header: 'Fecha', value: (r) => r.class_date },
      { header: 'Alumno', value: (r) => r.student?.full_name },
      { header: 'Horas', value: (r) => r.hours, numeric: true },
      { header: 'Pago por hora', value: (r) => r.instructor_rate, numeric: true },
      { header: 'Pago', value: (r) => r.instructor_pay, numeric: true },
      { header: 'Estado', value: (r) => (r.settlement_id ? 'Pagada' : 'Pendiente') },
    ])
    downloadCsv(`liquidacion-${(instructor?.full_name ?? 'instructor').replace(/\s+/g, '-').toLowerCase()}-${period.from}-a-${period.to}.csv`, csv)
  }

  return (
    <div>
      <PageHeader title="Liquidaciones" subtitle={isAdmin ? 'Horas y pagos por instructor y período' : 'Tus horas, pagos pendientes y pagos recibidos'} />
      {(classes.offline || instructors.offline) && <OfflineNote savedAt={classes.savedAt} />}

      <div className="card mb-5 space-y-4 p-4">
        {isAdmin && (
          <Field label="Instructor">
            {(id) => (
              <select id={id} className="input" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                {(instructors.data ?? []).map((i) => (
                  <option key={i.id} value={i.id}>{i.full_name} · {i.kind === 'owner' ? 'dueño' : 'externo'}{i.active ? '' : ' (inactivo)'}</option>
                ))}
              </select>
            )}
          </Field>
        )}
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {classes.error && <ErrorBox message={classes.error} onRetry={classes.reload} />}
      {!instructor || (classes.loading && !classes.data) ? <Loading /> : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Horas trabajadas" value={formatHours(sumHours(rows.map((r) => r.hours)))} hint={describePeriod(period)} />
            <Stat label="Clases realizadas" value={rows.length} />
            {isOwner ? (
              <>
                <Stat tone="sky" label="Ingresos generados" value={formatMoney(sumAmounts(rows.map((r) => r.total_amount)), currency)} />
                <Stat label="Pago de instructor" value="No genera" hint="Dueño de la escuela" />
              </>
            ) : (
              <>
                <Stat tone="coral" label="Pendiente de pago" value={formatMoney(pendingAmount, currency)} hint={`${pending.length} clases`} />
                <Stat tone="lagoon" label="Ya pagado" value={formatMoney(sumAmounts(paid.map((r) => r.instructor_pay)), currency)} hint={`${paid.length} clases`} />
              </>
            )}
          </div>

          {isAdmin && !isOwner && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <button type="button" className="btn-dark flex-1 text-lg" disabled={pending.length === 0 || classes.offline}
                onClick={() => setPayOpen(true)}>
                <Icon name="check" /> Marcar como PAGADA · {formatMoney(pendingAmount, currency)}
              </button>
              <button type="button" className="btn-ghost" onClick={exportDetail} disabled={rows.length === 0}>
                <Icon name="download" /> Exportar
              </button>
            </div>
          )}

          <h2 className="mb-3 text-lg font-semibold text-ocean-900">Detalle de clases</h2>
          {rows.length === 0 ? (
            <div className="card mb-8 p-6 text-center text-ink-mute">No hay clases en este período.</div>
          ) : (
            <ul className="card mb-8 divide-y divide-line">
              {rows.map((r) => <DetailRow key={r.id} r={r} currency={currency} owner={isOwner} />)}
            </ul>
          )}
        </>
      )}

      <h2 className="mb-3 text-lg font-semibold text-ocean-900">{isAdmin ? 'Pagos registrados' : 'Pagos recibidos'}</h2>
      {history.error && <ErrorBox message={history.error} onRetry={history.reload} />}
      {history.loading && !history.data ? <Loading /> : (history.data ?? []).length === 0 ? (
        <div className="card p-6 text-center text-ink-mute">Todavía no hay pagos registrados.</div>
      ) : (
        <ul className="space-y-3">
          {history.data!.map((s) => (
            <SettlementItem key={s.id} s={s} currency={currency} canCancel={isAdmin}
              onChanged={() => { history.reload(); classes.reload() }} />
          ))}
        </ul>
      )}

      {instructor && (
        <PayDialog open={payOpen} onClose={() => setPayOpen(false)} instructorName={instructor.full_name}
          instructorId={instructor.id} period={period} classes={pending} amount={pendingAmount} currency={currency}
          onPaid={() => { classes.reload(); history.reload() }} />
      )}
    </div>
  )
}

function DetailRow({ r, currency, owner }: { r: ClassRow; currency: string; owner: boolean }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{r.student?.full_name ?? '—'}</div>
        <div className="text-sm text-ink-mute">{formatDate(r.class_date)} · {formatHours(r.hours)}{!owner && ` × ${formatMoney(r.instructor_rate, currency)}`}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="tabular font-semibold">{owner ? formatMoney(r.total_amount, currency) : formatMoney(r.instructor_pay, currency)}</div>
        {!owner && (r.settlement_id
          ? <span className="badge bg-lagoon-soft text-teal-800">Pagada</span>
          : <span className="badge bg-coral-soft text-[#9a2f22]">Pendiente</span>)}
      </div>
    </li>
  )
}

function PayDialog({ open, onClose, instructorName, instructorId, period, classes, amount, currency, onPaid }: {
  open: boolean; onClose: () => void; instructorName: string; instructorId: string; period: Period
  classes: ClassRow[]; amount: number; currency: string; onPaid: () => void
}) {
  const toast = useToast()
  const [paidAt, setPaidAt] = useState(today())
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setPaidAt(today()); setNotes(''); setError(null) }
  }, [open])

  async function pay() {
    setBusy(true)
    setError(null)
    try {
      await paySettlement({ instructorId, from: period.from, to: period.to, paidAt, expectedCount: classes.length, expectedAmount: amount, notes })
      toast('Liquidación registrada como PAGADA.')
      onPaid()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title="Registrar pago" onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-dark flex-1" disabled={busy || !paidAt} onClick={() => void pay()}>{busy && <Spinner />} Confirmar pago</button>
      </>}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-ocean-900 p-5 text-white">
          <div className="text-sm text-sky-200">{instructorName}</div>
          <div className="tabular mt-1 font-display text-3xl font-bold">{formatMoney(amount, currency)}</div>
          <div className="mt-1 text-sm text-sky-100/80">
            {classes.length} clases · {formatHours(sumHours(classes.map((c) => c.hours)))} · {formatShortDate(period.from)} – {formatShortDate(period.to)}
          </div>
        </div>
        <p className="text-sm text-ink-soft">Estas clases quedan marcadas como pagadas y no podrán entrar en otra liquidación.</p>
        <Field label="Fecha de pago">
          {(id) => <input id={id} type="date" className="input" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />}
        </Field>
        <Field label="Notas (opcional)">
          {(id) => <input id={id} className="input" placeholder="Ej.: transferencia, Pix, efectivo" value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}

function SettlementItem({ s, currency, canCancel, onChanged }: { s: Settlement; currency: string; canCancel: boolean; onChanged: () => void }) {
  const { session } = useAuth()
  const confirm = useConfirm()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const detail = useData(open ? `${session!.user.id}:settlement:${s.id}` : null, () => fetchClasses({ settlementId: s.id }))

  async function cancel() {
    const ok = await confirm({
      title: 'Anular pago',
      message: `Las ${s.classes_count} clases de este pago vuelven a quedar pendientes. Usalo solo si el pago se registró por error.`,
      confirmLabel: 'Anular pago', danger: true,
    })
    if (!ok) return
    try {
      await cancelSettlement(s.id)
      toast('Pago anulado.')
      onChanged()
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  return (
    <li className="card overflow-hidden">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(!open)}>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lagoon-soft text-teal-700"><Icon name="check" /></div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{s.instructor?.full_name ?? '—'}</div>
          <div className="text-sm text-ink-mute">
            Pagado el {formatDate(s.paid_at)} · {formatShortDate(s.period_start)} – {formatShortDate(s.period_end)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="tabular font-semibold">{formatMoney(s.amount, currency)}</div>
          <div className="tabular text-sm text-ink-mute">{s.classes_count} clases · {formatHours(s.total_hours)}</div>
        </div>
      </button>
      {open && (
        <div className="border-t border-line bg-mist/60 px-4 py-3">
          {s.notes && <p className="mb-2 text-sm text-ink-soft">Notas: {s.notes}</p>}
          {detail.loading && !detail.data ? <Loading /> : (
            <ul className="divide-y divide-line text-sm">
              {(detail.data ?? []).map((c) => (
                <li key={c.id} className="flex justify-between gap-3 py-2">
                  <span>{formatShortDate(c.class_date)} · {c.student?.full_name} · {formatHours(c.hours)}</span>
                  <span className="tabular font-medium">{formatMoney(c.instructor_pay, currency)}</span>
                </li>
              ))}
            </ul>
          )}
          {canCancel && (
            <button type="button" className="mt-3 text-sm font-semibold text-coral" onClick={() => void cancel()}>Anular este pago</button>
          )}
        </div>
      )}
    </li>
  )
}
