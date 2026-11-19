import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createLogin, fetchClasses, fetchPendingPayouts, fetchProfiles, saveInstructor, updateLogin } from '../lib/api'
import { useInstructors } from '../lib/hooks'
import { useData } from '../lib/useData'
import { periodFor } from '../lib/dates'
import { formatHours, formatMoney, hasAtMostTwoDecimals, parseDecimal, sumAmounts, sumHours } from '../lib/money'
import { friendlyError } from '../lib/errors'
import { normalizeUsername, USERNAME_PATTERN } from '../lib/username'
import type { Instructor, Profile } from '../lib/types'
import { ErrorBox, Field, Icon, Loading, Modal, OfflineNote, PageHeader, Spinner, Toggle, useConfirm, useToast } from '../components/ui'

export default function Instructors() {
  const { session, currency } = useAuth()
  const uid = session!.user.id
  const instructors = useInstructors()
  const profiles = useData(`${uid}:profiles`, fetchProfiles)
  const month = periodFor('month')
  const monthClasses = useData(`${uid}:classes:${month.from}:${month.to}`, () => fetchClasses({ from: month.from, to: month.to }))
  const pending = useData(`${uid}:pending-payouts`, fetchPendingPayouts)
  const [editing, setEditing] = useState<Instructor | 'new' | null>(null)
  const [access, setAccess] = useState<Instructor | null>(null)

  const hoursThisMonth = (id: string) => sumHours((monthClasses.data ?? []).filter((c) => c.instructor_id === id).map((c) => c.hours))
  const pendingOf = (id: string) => sumAmounts((pending.data ?? []).filter((c) => c.instructor_id === id).map((c) => c.instructor_pay))
  const loginOf = (id: string) => profiles.data?.find((p) => p.instructor_id === id) ?? null

  const owners = (instructors.data ?? []).filter((i) => i.kind === 'owner')
  const externals = (instructors.data ?? []).filter((i) => i.kind === 'external')

  return (
    <div>
      <PageHeader title="Instructores" subtitle="Dueños y externos contratados por la escuela"
        action={<button type="button" className="btn-primary" onClick={() => setEditing('new')}><Icon name="plus" /> <span className="hidden sm:inline">Instructor externo</span><span className="sm:hidden">Nuevo</span></button>} />
      {instructors.offline && <OfflineNote savedAt={instructors.savedAt} />}
      {instructors.error && <ErrorBox message={instructors.error} onRetry={instructors.reload} />}
      {instructors.loading && !instructors.data ? <Loading /> : (
        <>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-mute">Instructores principales (dueños)</h2>
          <div className="mb-8 grid gap-3 md:grid-cols-2">
            {owners.map((i) => (
              <InstructorCard key={i.id} instructor={i} login={loginOf(i.id)} currency={currency}
                hours={hoursThisMonth(i.id)} pending={0} onAccess={() => setAccess(i)} />
            ))}
          </div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-mute">Instructores externos</h2>
          {externals.length === 0 ? (
            <div className="card p-6 text-center text-ink-mute">Todavía no hay instructores externos.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {externals.map((i) => (
                <InstructorCard key={i.id} instructor={i} login={loginOf(i.id)} currency={currency}
                  hours={hoursThisMonth(i.id)} pending={pendingOf(i.id)} onEdit={() => setEditing(i)} onAccess={() => setAccess(i)} />
              ))}
            </div>
          )}
        </>
      )}

      <InstructorForm open={editing !== null} instructor={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)} onSaved={instructors.reload} />
      <AccessDialog instructor={access} login={access ? loginOf(access.id) : null} onClose={() => setAccess(null)}
        onSaved={profiles.reload} />
    </div>
  )
}

function InstructorCard({ instructor: i, login, currency, hours, pending, onEdit, onAccess }: {
  instructor: Instructor; login: Profile | null; currency: string; hours: number; pending: number
  onEdit?: () => void; onAccess: () => void
}) {
  return (
    <div className={`card p-4 ${i.active ? '' : 'opacity-70'}`}>
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full font-display text-lg font-bold ${i.kind === 'owner' ? 'bg-ocean-900 text-white' : 'bg-sky-soft text-sky-deep'}`}>
          {i.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-ocean-900">{i.full_name}</span>
            {i.kind === 'owner' ? <span className="badge bg-ocean-900 text-white">Dueño</span>
              : <span className={`badge ${i.active ? 'bg-lagoon-soft text-teal-800' : 'bg-slate-100 text-ink-mute'}`}>{i.active ? 'Activo' : 'Inactivo'}</span>}
          </div>
          <div className="mt-0.5 text-sm text-ink-mute">
            {i.kind === 'owner' ? 'Sin pago por hora' : `${formatMoney(i.hourly_pay, currency)} por hora`}
            {i.phone ? ` · ${i.phone}` : ''}
          </div>
        </div>
        {onEdit && (
          <button type="button" onClick={onEdit} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-slate-100" aria-label="Editar">
            <Icon name="edit" />
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-mist px-3 py-2">
          <div className="text-xs text-ink-mute">Horas este mes</div>
          <div className="tabular font-semibold">{formatHours(hours)}</div>
        </div>
        <div className="rounded-xl bg-mist px-3 py-2">
          <div className="text-xs text-ink-mute">{i.kind === 'owner' ? 'Pagos' : 'Pendiente de pago'}</div>
          <div className="tabular font-semibold">{i.kind === 'owner' ? 'No genera' : formatMoney(pending, currency)}</div>
        </div>
      </div>
      <button type="button" onClick={onAccess} className="mt-3 flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-ink-soft">
          <Icon name="key" className="h-4 w-4" />
          {login ? <>Acceso: <b className="text-ink">{login.username ?? 'con su email'}</b>{!login.active && ' (desactivado)'}</> : 'Sin acceso a la app'}
        </span>
        <span className="font-semibold text-sky-deep">{login ? 'Gestionar' : 'Crear acceso'}</span>
      </button>
    </div>
  )
}

function InstructorForm({ open, instructor, onClose, onSaved }: {
  open: boolean; instructor: Instructor | null; onClose: () => void; onSaved: () => void
}) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [pay, setPay] = useState('')
  const [phone, setPhone] = useState('')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(instructor?.full_name ?? '')
    setPay(instructor ? String(instructor.hourly_pay).replace('.', ',') : '')
    setPhone(instructor?.phone ?? '')
    setActive(instructor?.active ?? true)
    setErrors({})
    setError(null)
  }, [open, instructor])

  async function save() {
    const e: Record<string, string> = {}
    const payN = parseDecimal(pay)
    if (!name.trim()) e.name = 'Escribí el nombre y apellido.'
    if (payN === null) e.pay = 'Ingresá el pago por hora.'
    else if (!hasAtMostTwoDecimals(payN)) e.pay = 'Usá como máximo 2 decimales.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await saveInstructor({ id: instructor?.id, full_name: name, hourly_pay: payN!, phone, active })
      toast(instructor ? 'Instructor actualizado.' : 'Instructor creado.')
      onSaved()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={instructor ? 'Editar instructor' : 'Nuevo instructor externo'} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-1" disabled={busy} onClick={() => void save()}>{busy && <Spinner />} Guardar</button>
      </>}>
      <div className="space-y-4">
        <Field label="Nombre y apellido" error={errors.name}>
          {(id) => <input id={id} className={errors.name ? 'input-error' : 'input'} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Pago por hora que recibe" error={errors.pay}
          hint={instructor ? 'Cambiarlo no modifica las clases ya registradas.' : undefined}>
          {(id) => <input id={id} className={errors.pay ? 'input-error' : 'input'} inputMode="decimal" placeholder="0,00" value={pay} onChange={(e) => setPay(e.target.value)} />}
        </Field>
        <Field label="Teléfono (opcional)">
          {(id) => <input id={id} className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
        <Toggle checked={active} onChange={setActive} label={active ? 'Activo' : 'Inactivo'} />
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}

function AccessDialog({ instructor, login, onClose, onSaved }: {
  instructor: Instructor | null; login: Profile | null; onClose: () => void; onSaved: () => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const { session } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSelf = login?.id === session?.user.id

  useEffect(() => {
    if (!instructor) return
    setUsername(normalizeUsername(instructor.full_name.split(' ')[0] ?? ''))
    setPassword('')
    setError(null)
  }, [instructor])

  const userOk = useMemo(() => USERNAME_PATTERN.test(normalizeUsername(username)), [username])

  async function run(fn: () => Promise<unknown>, done: string) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      toast(done)
      onSaved()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  if (!instructor) return <Modal open={false} title="" onClose={onClose}>{null}</Modal>
  const role = instructor.kind === 'owner' ? 'administrador' : 'instructor'

  return (
    <Modal open title={`Acceso de ${instructor.full_name}`} onClose={onClose}>
      {login ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-mist px-4 py-3 text-sm">
            <div>Usuario: <b>{login.username ?? '(ingresa con email)'}</b></div>
            <div className="mt-1">Rol: <b>{login.role === 'admin' ? 'Administrador' : 'Instructor'}</b> · {login.active ? 'activo' : 'desactivado'}</div>
          </div>
          <Field label="Nueva contraseña" hint="Mínimo 8 caracteres. Comunicásela a la persona.">
            {(id) => <input id={id} className="input" type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          {error && <ErrorBox message={error} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className="btn-primary" disabled={busy || password.length < 8}
              onClick={() => void run(() => updateLogin({ profile_id: login.id, password }), 'Contraseña actualizada.')}>
              {busy && <Spinner />} Cambiar contraseña
            </button>
            {!isSelf && (
              <button type="button" className={login.active ? 'btn-danger' : 'btn-ghost'} disabled={busy}
                onClick={async () => {
                  if (login.active && !(await confirm({ title: 'Desactivar acceso', message: `${instructor.full_name} no va a poder ingresar a la app. Sus clases se conservan.`, confirmLabel: 'Desactivar', danger: true }))) return
                  void run(() => updateLogin({ profile_id: login.id, active: !login.active }), login.active ? 'Acceso desactivado.' : 'Acceso reactivado.')
                }}>
                {login.active ? 'Desactivar acceso' : 'Reactivar acceso'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Creá un usuario y contraseña para que {instructor.full_name} ingrese como <b>{role}</b>.
            {instructor.kind === 'external' && ' Va a poder registrar sus clases y ver sus horas y liquidaciones.'}
          </p>
          <Field label="Usuario" error={username && !userOk ? 'De 3 a 30 letras, números, punto o guion, sin espacios.' : null}>
            {(id) => <input id={id} className="input" autoCapitalize="none" autoCorrect="off" value={username} onChange={(e) => setUsername(e.target.value)} />}
          </Field>
          <Field label="Contraseña" hint="Mínimo 8 caracteres.">
            {(id) => <input id={id} className="input" type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          {error && <ErrorBox message={error} />}
          <button type="button" className="btn-primary w-full" disabled={busy || !userOk || password.length < 8}
            onClick={() => void run(() => createLogin({ instructor_id: instructor.id, username: normalizeUsername(username), password }), 'Acceso creado.')}>
            {busy && <Spinner />} Crear acceso
          </button>
        </div>
      )}
    </Modal>
  )
}
