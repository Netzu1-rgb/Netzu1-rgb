import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAuth } from '../context/AuthContext'
import PeriodFilter from '../components/PeriodFilter'
import { ErrorBox, Icon, Loading, OfflineNote, PageHeader, Stat } from '../components/ui'
import { fetchClasses, fetchPendingPayouts, fetchStudents } from '../lib/api'
import { useData } from '../lib/useData'
import { chartBuckets, describePeriod, periodFor, type Period } from '../lib/dates'
import { formatHours, formatMoney, formatNumber, sumAmounts, sumHours } from '../lib/money'
import type { ClassRow } from '../lib/types'

const SKY = '#0284c7'
const PROFIT = '#1b4a7a'
const SPLIT_SCHOOL = '#0ea5e9'
const SPLIT_PAY = '#f97362'
const AXIS = { fontSize: 12, fill: '#64748b' }

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
            <div className="card mt-5 p-6 text-center text-ink-mute">No hay clases en este período.</div>
          ) : (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <ChartCard title={isAdmin ? 'Ingresos' : 'Ingresos generados'} subtitle={series.byDay ? 'por día' : 'por mes'}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={series.data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#eef2f6" />
                    <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={compact} />
                    <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} formatter={(v) => [formatMoney(Number(v), currency), 'Ingresos']} />
                    <Bar dataKey="revenue" fill={SKY} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {isAdmin && (
                <ChartCard title="Ganancia de la escuela" subtitle={series.byDay ? 'por día' : 'por mes'}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={series.data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0" stopColor={PROFIT} stopOpacity={0.22} />
                          <stop offset="1" stopColor={PROFIT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#eef2f6" />
                      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} width={56} tickFormatter={compact} />
                      <Tooltip formatter={(v) => [formatMoney(Number(v), currency), 'Ganancia']} />
                      <Area dataKey="profit" type="linear" stroke={PROFIT} strokeWidth={2} fill="url(#profitFill)"
                        dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {isAdmin && (
                <ChartCard title="Horas por instructor" subtitle={describePeriod(period)}>
                  <ResponsiveContainer width="100%" height={Math.max(120, byInstructor.length * 44)}>
                    <BarChart data={byInstructor} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: '#0f172a' }} width={120} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: 'rgba(14,165,233,0.08)' }} formatter={(v) => [formatHours(Number(v)), 'Horas']} />
                      <Bar dataKey="hours" fill={SKY} radius={[0, 4, 4, 0]} maxBarSize={22}
                        label={{ position: 'right', fontSize: 12, fill: '#475569', formatter: (v: unknown) => formatHours(Number(v)) }} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {isAdmin && (
                <ChartCard title="Distribución de ingresos" subtitle="Qué queda en la escuela y qué se paga a instructores">
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
        <h2 className="text-base font-semibold text-ocean-900">{title}</h2>
        {subtitle && <p className="text-xs text-ink-mute">{subtitle}</p>}
      </div>
      {children}
    </section>
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
      <div className="flex h-5 w-full gap-0.5 overflow-hidden rounded-md" role="img"
        aria-label={parts.map((p) => `${p.label} ${pct(p.value)}%`).join(', ')}>
        {parts.filter((p) => p.value > 0).map((p) => (
          <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label}: ${formatMoney(p.value, currency)}`} />
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

function compact(v: number) {
  return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(v)
}

function buildSeries(rows: ClassRow[], period: Period) {
  const buckets = chartBuckets(period.from, period.to)
  const byDay = buckets.length > 0 && buckets[0].key.length === 10
  const acc = new Map(buckets.map((b) => [b.key, { label: b.label, revenue: [] as number[], profit: [] as number[] }]))
  for (const r of rows) {
    const k = byDay ? r.class_date : r.class_date.slice(0, 7)
    const b = acc.get(k)
    if (b) {
      b.revenue.push(r.total_amount)
      b.profit.push(r.school_profit)
    }
  }
  return {
    byDay,
    data: [...acc.values()].map((b) => ({ label: b.label, revenue: sumAmounts(b.revenue), profit: sumAmounts(b.profit) })),
  }
}
