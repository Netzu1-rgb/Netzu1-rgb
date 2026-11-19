import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateSettings } from '../lib/api'
import { useInstructors } from '../lib/hooks'
import { discardOutboxItem, outboxItems, onOutboxChange, type OutboxItem } from '../lib/offline'
import { friendlyError } from '../lib/errors'
import { useInstall } from '../lib/pwa'
import { CURRENCIES } from '../lib/currencies'
import { ErrorBox, Field, Icon, PageHeader, Spinner, useConfirm, useToast } from '../components/ui'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { isAdmin, profile, session, signOut, pendingSync } = useAuth()
  const confirm = useConfirm()

  async function logout() {
    if (pendingSync > 0) {
      const ok = await confirm({
        title: 'Hay datos sin sincronizar',
        message: `Tenés ${pendingSync} registros guardados solo en este dispositivo. Se van a enviar la próxima vez que ingreses con esta cuenta en este dispositivo. ¿Salir igual?`,
        confirmLabel: 'Salir igual', danger: true,
      })
      if (!ok) return
    }
    await signOut()
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Configuración" />
      {isAdmin && <SchoolSettingsForm />}
      <PendingSyncCard />
      <InstallCard />
      <section className="card mb-5 p-5">
        <h2 className="mb-3 text-lg font-semibold text-ocean-900">Mi cuenta</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-ink-mute">Nombre</dt><dd className="font-medium">{profile?.full_name ?? '—'}</dd>
          <dt className="text-ink-mute">Usuario</dt><dd className="font-medium">{profile?.username ?? session?.user.email}</dd>
          <dt className="text-ink-mute">Rol</dt><dd className="font-medium">{isAdmin ? 'Administrador' : 'Instructor'}</dd>
        </dl>
        <ChangePassword />
        <button type="button" className="btn-ghost mt-5 w-full text-coral" onClick={() => void logout()}>
          <Icon name="logout" /> Cerrar sesión
        </button>
      </section>
      <p className="text-center text-xs text-ink-mute">TRUEVENTO · versión {__APP_VERSION__}</p>
    </div>
  )
}

function SchoolSettingsForm() {
  const { settings, refresh } = useAuth()
  const instructors = useInstructors()
  const toast = useToast()
  const [school, setSchool] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [owner1, setOwner1] = useState('')
  const [owner2, setOwner2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSchool(settings?.school_name ?? '')
    setCurrency(settings?.currency ?? 'BRL')
  }, [settings])
  useEffect(() => {
    const o = instructors.data ?? []
    setOwner1(o.find((i) => i.owner_slot === 1)?.full_name ?? '')
    setOwner2(o.find((i) => i.owner_slot === 2)?.full_name ?? '')
  }, [instructors.data])

  async function save() {
    if (!school.trim() || !owner1.trim() || !owner2.trim()) return setError('Completá todos los campos.')
    setBusy(true)
    setError(null)
    try {
      await updateSettings({ school_name: school, currency, owner1, owner2 })
      await refresh()
      instructors.reload()
      toast('Configuración guardada.')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card mb-5 space-y-4 p-5">
      <h2 className="text-lg font-semibold text-ocean-900">Escuela</h2>
      <Field label="Nombre de la escuela">
        {(id) => <input id={id} className="input" value={school} onChange={(e) => setSchool(e.target.value)} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dueño / instructor principal 1">
          {(id) => <input id={id} className="input" value={owner1} onChange={(e) => setOwner1(e.target.value)} />}
        </Field>
        <Field label="Dueño / instructor principal 2">
          {(id) => <input id={id} className="input" value={owner2} onChange={(e) => setOwner2(e.target.value)} />}
        </Field>
      </div>
      <Field label="Moneda" hint="Solo cambia cómo se muestran los importes; no convierte valores.">
        {(id) => (
          <select id={id} className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        )}
      </Field>
      {error && <ErrorBox message={error} />}
      <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => void save()}>{busy && <Spinner />} Guardar</button>
    </section>
  )
}

function PendingSyncCard() {
  const { syncNow, lastSync } = useAuth()
  const confirm = useConfirm()
  const [items, setItems] = useState<OutboxItem[]>([])
  const [busy, setBusy] = useState(false)
  useEffect(() => onOutboxChange(() => void outboxItems().then(setItems)), [])
  if (items.length === 0) return null

  return (
    <section className="card mb-5 p-5">
      <h2 className="text-lg font-semibold text-ocean-900">Pendientes de sincronizar</h2>
      <p className="mt-1 text-sm text-ink-mute">Registros guardados sin conexión. Se envían solos al volver internet.</p>
      <ul className="mt-3 divide-y divide-line text-sm">
        {items.map((i) => (
          <li key={i.seq} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{i.kind === 'class' ? 'Clase' : 'Alumno'} · {new Date(i.createdAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</div>
              {i.error && <div className="text-coral">Rechazado: {i.error}</div>}
            </div>
            {i.error && (
              <button type="button" className="text-sm font-semibold text-coral" onClick={async () => {
                if (await confirm({ title: 'Descartar registro', message: 'Este registro no se pudo guardar en el servidor y se va a borrar del dispositivo.', confirmLabel: 'Descartar', danger: true })) {
                  await discardOutboxItem(i.seq!)
                }
              }}>Descartar</button>
            )}
          </li>
        ))}
      </ul>
      {lastSync?.offline && <p className="mt-2 text-sm text-ink-mute">Último intento: sin conexión.</p>}
      <button type="button" className="btn-ghost mt-3 w-full" disabled={busy}
        onClick={async () => { setBusy(true); await syncNow(); setBusy(false) }}>
        {busy ? <Spinner /> : <Icon name="refresh" />} Sincronizar ahora
      </button>
    </section>
  )
}

function InstallCard() {
  const install = useInstall()
  if (install.installed) return null
  return (
    <section className="card mb-5 p-5">
      <h2 className="text-lg font-semibold text-ocean-900">Instalar la app</h2>
      {install.canPrompt ? (
        <>
          <p className="mt-1 text-sm text-ink-mute">Instalá TRUEVENTO para abrirla como una app, con ícono propio y pantalla completa.</p>
          <button type="button" className="btn-primary mt-3 w-full" onClick={() => void install.prompt()}>
            <Icon name="install" /> Instalar TRUEVENTO
          </button>
        </>
      ) : install.ios ? (
        <p className="mt-1 text-sm text-ink-soft">
          En iPhone o iPad: abrí esta página en <b>Safari</b>, tocá <b>Compartir</b> y elegí <b>Agregar a pantalla de inicio</b>.
        </p>
      ) : (
        <p className="mt-1 text-sm text-ink-soft">
          Desde Chrome o Edge: abrí el menú del navegador y elegí <b>Instalar aplicación</b> (o el ícono de instalar en la barra de direcciones).
        </p>
      )}
    </section>
  )
}

function ChangePassword() {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) {
    return <button type="button" className="mt-4 text-sm font-semibold text-sky-deep" onClick={() => setOpen(true)}>Cambiar mi contraseña</button>
  }
  return (
    <div className="mt-4 space-y-3">
      <Field label="Nueva contraseña" hint="Mínimo 8 caracteres.">
        {(id) => <input id={id} type="password" className="input" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />}
      </Field>
      {error && <ErrorBox message={error} />}
      <button type="button" className="btn-primary w-full" disabled={busy || pw.length < 8} onClick={async () => {
        setBusy(true)
        setError(null)
        const { error: err } = await supabase.auth.updateUser({ password: pw })
        setBusy(false)
        if (err) return setError(friendlyError(err))
        toast('Contraseña actualizada.')
        setPw('')
        setOpen(false)
      }}>{busy && <Spinner />} Guardar contraseña</button>
    </div>
  )
}
