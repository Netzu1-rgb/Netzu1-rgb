import { useNavigate } from 'react-router'
import { PageHeader, Icon, useConfirm } from '../components/ui'
import { WindForecast } from '../components/wind'
import { useMe, useSession } from '../context/Session'
import { useInstall } from '../lib/pwa'
import { useTheme, type ThemeChoice } from '../lib/theme'
import * as api from '../lib/api'

const demoApi = api as unknown as { resetDemo?: () => void }

export function WindPage() {
  return (
    <div>
      <PageHeader title="Viento" subtitle="Pronóstico de los próximos 7 días, de 6 a 18 h" />
      <WindForecast />
    </div>
  )
}

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Automático' },
]

export function SettingsPage() {
  const me = useMe()
  const { signOut } = useSession()
  const { choice, setChoice } = useTheme()
  const install = useInstall()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const roleLabel = me.role === 'student' ? 'Alumno' : me.role === 'admin' ? 'Escuela (administración)' : 'Instructor'

  return (
    <div className="space-y-4">
      <PageHeader title="Ajustes" />
      <section className="card flex items-center gap-3 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep"><Icon name="user" /></span>
        <div>
          <div className="font-semibold text-heading">{me.full_name}</div>
          <div className="text-sm text-ink-mute">{roleLabel} · {me.school_name}</div>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold text-heading">Tema</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button key={t.value} type="button" aria-pressed={choice === t.value} onClick={() => setChoice(t.value)}
              className={choice === t.value ? 'chip-on' : 'chip'}>{t.label}</button>
          ))}
        </div>
      </section>

      {!install.installed && (
        <section className="card p-4">
          <h2 className="font-semibold text-heading">Instalar en el celular</h2>
          {install.canPrompt ? (
            <button type="button" className="btn-dark mt-3 w-full" onClick={() => void install.prompt()}><Icon name="install" /> Instalar la app</button>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">
              {install.ios ? 'En Safari tocá Compartir y después “Agregar a inicio”.' : 'En el menú del navegador elegí “Instalar app” o “Agregar a la pantalla de inicio”.'}
            </p>
          )}
        </section>
      )}

      <button type="button" className="btn-ghost w-full" onClick={async () => {
        if (!(await confirm({ title: 'Cerrar sesión', message: 'Para volver a entrar vas a necesitar tu usuario y contraseña.', confirmLabel: 'Cerrar sesión' }))) return
        navigate('/', { replace: true })
        await signOut()
      }}>
        <Icon name="logout" /> Cerrar sesión
      </button>
      {demoApi.resetDemo && (
        <button type="button" className="btn-ghost w-full" onClick={async () => {
          if (await confirm({ title: 'Reiniciar la demo', message: 'Se borra todo lo que cargaste en esta demo.', confirmLabel: 'Reiniciar', danger: true })) demoApi.resetDemo!()
        }}>
          <Icon name="refresh" /> Reiniciar la demo
        </button>
      )}
      <p className="text-center text-xs text-ink-mute">TRUEVENTO Alumnos · versión {__APP_VERSION__}</p>
    </div>
  )
}
