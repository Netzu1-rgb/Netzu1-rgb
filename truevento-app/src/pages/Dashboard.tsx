import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/AuthContext'
import PeriodFilter from '../components/PeriodFilter'
import { ErrorBox, Icon, Loading, OfflineNote, PageHeader, Stat } from '../components/ui'
import { fetchClasses, fetchPendingPayouts, fetchStudents } from '../lib/api'
import { useData } from '../lib/useData'
import { chartBuckets, describePeriod, periodFor, type Period } from '../lib/dates'
import { formatHours, formatMoney, formatNumber, sumAmounts, sumHours } from '../lib/money'
import type { ClassRow } from '../lib/types'

const SKY = '#0284c7'
const PROFIT = '#0f766e'
const SPLIT_SCHOOL = '#0ea5e9'
const SPLIT_PAY = '#f97362'
const AXIS = { fontSize: 13, fill: '#475569' }

export default function Dashboard() {
  const { isAdmin, session, currency, profile } = useAuth()
  const uid = session!.user.id
  const [period, setPeriod] = useState<Period>(() => periodFor('month'))

  const classes = useData(`${uid}:classes:${period.from}:${period.to}`, () => fetchClasses({ from: period.from, to: period.to }))
  const pending = useData(`${uid}:pending-payouts`, fetchPendingPayouts)
  const students = useData(`${uid}:students`, fetchStudents)

  const rows = classes.data ?? []
  const totals = useMemo(() => ({
    revenue: sumAmounts(rows.map((r) => r.total_amount)),
    pay: sumAmounts(rows.map((r) => r.instructor_pay)),
    profit: sumAmounts(rows.map((r) => r.school_profit)),
    hours: sumHours(rows.map((r) => r.hours)),
    classes: rows.length,
    studentsInPeriod: new Set(rows.map((r) => r.student_id)).size,
  }), [rows])
  const pendingTotal = sumAmounts((pending.data ?? []).map((p) => p.instructor_pay))

  const series = useMemo(() => buildSeries(rows, period), [rows, period])
  const byInstructor = useMemo(() => {
    const m = new Map<string, { name: string; hours: number }>()
    for (const r of rows) {
      const k = r.instructor_id
      const cur = m.get(k) ?? { name: r.instructor?.full_name ?? '—', hours: 0 }
      cur.hours = sumHours([cur.hours, r.hours])
      m.set(k, cur)
    }
    return [...m.values()].sort((a, b) => b.hours - a.hours)
  }, [rows])

  const firstName = (profile?.full_name ?? '').split(' ')[0]

  return (
    <div>
      <PageHeader title={isAdmin ? 'Resumen de la escuela' : `Hola${firstName ? `, ${firstName}` : ''}`}
        subtitle={isAdmin ? undefined : 'Tu actividad en la escuela'}
        action={<Link to="/registrar" className="btn-primary hidden sm:inline-flex"><Icon name="plus" /> Registrar clase</Link>} />

      <div className="mb-4"><PeriodFilter value={period} onChange={setPeriod} /></div>
      {classes.offline && <OfflineNote savedAt={classes.savedAt} />}
      {classes.error && <div className="mb-4"><ErrorBox message={classes.error} onRetry={classes.reload} /></div>}

      {classes.loading && !classes.data ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {isAdmin ? (
              <>
                <Stat tone="dark" label="Ingresos totales" value={formatMoney(totals.revenue, currency)} hint={describePeriod(period)} />
                <Stat tone="lagoon" label="Ganancia neta" value={formatMoney(totals.profit, currency)}
                  hint={`Pagos a instructores: ${formatMoney(totals.pay, currency)}`} />
                <Stat label="Horas de clase" value={formatHours(totals.hours)} />
                <Stat label="Clases realizadas" value={formatNumber(totals.classes)} />
                <Stat label="Alumnos registrados" value={formatNumber(students.data?.length ?? 0)}
                  hint={`${totals.studentsInPeriod} con clases en el período`} />
                <Link to="/liquidaciones" className="block">
                  <Stat tone="coral" label="Pendiente a externos" value={formatMoney(pendingTotal, currency)}
                    hint="Todas las clases sin liquidar →" />
                </Link>
              </>
            ) : (
              <>
                <Stat tone="dark" label="Mis clases" value={formatNumber(totals.classes)} hint={describePeriod(period)} />
                <Stat tone="sky" label="Mis horas" value={formatHours(totals.hours)} />
                <Stat label="Ingresos generados" value={formatMoney(totals.revenue, currency)} />
                {pending.data && pending.data.length > 0 ? (
                  <Stat tone="coral" label="Pago pendiente" value={formatMoney(pendingTotal, currency)} hint="Clases aún no liquidadas" />
                ) : (
                  <Stat label="Mi pago del período" value={formatMoney(totals.pay, currency)} />
                )}
              </>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="card mt-4 flex flex-col items-center px-6 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-sky-soft text-sky-deep"><Icon name="trend" className="h-7 w-7" /></div>
              <h2 className="mt-3 text-lg font-semibold text-ocean-900">Todavía no hay clases en {describePeriod(period).toLowerCase()}</h2>
              <p className="mt-1 max-w-sm text-sm text-ink-mute">Cuando registres clases, acá vas a ver cuánto se cobró, cuánto le quedó a la escuela y las horas de cada instructor.</p>
              <Link to="/registrar" className="btn-primary mt-5"><Icon name="plus" /> Registrar clase</Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <ChartCard title={isAdmin ? '¿Cuánto se cobró?' : 'Ingresos que generaste'}
                subtitle={`Total cobrado a alumnos ${series.unit} · ${describePeriod(period)}`}>
                <MoneyBars data={series.data} dataKey="revenue" color={SKY} currency={currency} name="Cobrado" />
              </ChartCard>

              {isAdmin && (
                <ChartCard title="¿Cuánto le quedó a la escuela?"
                  subtitle={`Ganancia ${series.unit}: lo cobrado menos lo que se paga a instructores`}>
                  <MoneyBars data={series.data} dataKey="profit" color={PROFIT} currency={currency} name="Ganancia" />
                </ChartCard>
              )}

              {isAdmin && (
                <ChartCard title="Horas por instructor" subtitle={describePeriod(period)}>
                  <ResponsiveContainer width="100%" height={Math.max(130, byInstructor.length * 52)}>
                    <BarChart data={byInstructor} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: '#0f172a', fontWeight: 600 }} width={130} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} formatter={(v) => [formatHours(Number(v)), 'Horas']} />
                      <Bar dataKey="hours" fill={SKY} radius={[0, 6, 6, 0]} barSize={26}>
                        <LabelList dataKey="hours" position="right" formatter={(v: unknown) => formatHours(Number(v))}
                          style={{ fontSize: 13, fontWeight: 700, fill: '#0f172a' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {isAdmin && (
                <ChartCard title="¿A dónde va lo cobrado?" subtitle="Parte que queda en la escuela y parte que se paga a instructores">
                  <RevenueSplit school={totals.profit} pay={totals.pay} currency={currency} />
                </ChartCard>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-ocean-900">{title}</h2>
        {subtitle && <p className="text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

interface SeriesPoint { label: string; title: string; revenue: number; profit: number }

/** Bars with the amount written on top of each one, so the chart reads without hovering. */
function MoneyBars({ data, dataKey, color, currency, name }: {
  data: SeriesPoint[]; dataKey: 'revenue' | 'profit'; color: string; currency: string; name: string
}) {
  const short = (v: unknown) => (Number(v) === 0 ? '' : compactMoney(Number(v), currency))
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 24, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval={0} />
        <YAxis tick={{ ...AXIS, fontSize: 12 }} tickLine={false} axisLine={false} width={62}
          tickFormatter={(v: number) => compactMoney(v, currency)} />
        <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }}
          labelFormatter={(_l, p) => (p?.[0]?.payload as SeriesPoint | undefined)?.title ?? ''}
          formatter={(v) => [formatMoney(Number(v), currency), name]} />
        <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={56}>
          <LabelList dataKey={dataKey} position="top" formatter={short} style={{ fontSize: 12, fontWeight: 700, fill: '#0f172a' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function RevenueSplit({ school, pay, currency }: { school: number; pay: number; currency: string }) {
  const total = school + pay
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
  const parts = [
    { label: 'Ganancia de la escuela', value: school, color: SPLIT_SCHOOL },
    { label: 'Pagos a instructores externos', value: pay, color: SPLIT_PAY },
  ]
  return (
    <div>
      <div className="flex h-10 w-full gap-0.5 overflow-hidden rounded-lg" role="img"
        aria-label={parts.map((p) => `${p.label} ${pct(p.value)}%`).join(', ')}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            className="flex items-center justify-center text-sm font-bold text-white" title={`${p.label}: ${formatMoney(p.value, currency)}`}>
            {pct(p.value) >= 12 ? `${pct(p.value)}%` : ''}
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="flex-1 text-ink-soft">{p.label}</span>
            <span className="tabular font-semibold text-ink">{formatMoney(p.value, currency)}</span>
            <span className="tabular w-10 text-right text-ink-mute">{pct(p.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function compactMoney(v: number, currency: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 1,
  }).format(v)
}

function buildSeries(rows: ClassRow[], period: Period) {
  const { buckets, keyOf, unit } = chartBuckets(period.from, period.to)
  const acc = new Map(buckets.map((b) => [b.key, { label: b.label, title: b.title, revenue: [] as number[], profit: [] as number[] }]))
  for (const r of rows) {
    const b = acc.get(keyOf(r.class_date))
    if (b) {
      b.revenue.push(r.total_amount)
      b.profit.push(r.school_profit)
    }
  }
  return {
    unit,
    data: [...acc.values()].map((b) => ({ label: b.label, title: b.title, revenue: sumAmounts(b.revenue), profit: sumAmounts(b.profit) })),
  }
}
