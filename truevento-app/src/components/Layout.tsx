import { useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../lib/pwa'
import { Icon } from './ui'

interface NavItem {
  to: string
  label: string
  icon: string
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/registrar', label: 'Registrar clase', icon: 'plus' },
  { to: '/solicitudes', label: 'Solicitudes', icon: 'calendar', adminOnly: true },
  { to: '/alumnos', label: 'Alumnos', icon: 'users' },
  { to: '/instructores', label: 'Instructores', icon: 'kite', adminOnly: true },
  { to: '/liquidaciones', label: 'Liquidaciones', icon: 'wallet' },
  { to: '/historial', label: 'Historial', icon: 'list' },
  { to: '/configuracion', label: 'Configuración', icon: 'settings' },
]

function SyncStatus({ compact = false }: { compact?: boolean }) {
  const online = useOnline()
  const { pendingSync, syncNow } = useAuth()
  if (online && pendingSync === 0) return null
  return (
    <button type="button" onClick={() => void syncNow()}
      className={`badge ${online ? 'bg-brand-soft text-brand-deep' : 'bg-sand text-ink-soft'} ${compact ? '' : 'py-1'}`}
      title={online ? 'Sincronizar ahora' : 'Sin conexión'}>
      <Icon name={online ? 'refresh' : 'cloudOff'} className="h-3.5 w-3.5" />
      {online ? `${pendingSync} por sincronizar` : pendingSync > 0 ? `Sin conexión · ${pendingSync} pendientes` : 'Sin conexión'}
    </button>
  )
}

function Brand({ name }: { name: string }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <img src="/logo-mark.svg" alt="" className="h-10 w-10 rounded-full ring-1 ring-white/15" />
      <div className="leading-none">
        <div className="font-display text-lg font-extrabold tracking-[0.08em] text-white">{name.toUpperCase()}</div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.42em] text-brand-300">KITESCHOOL</div>
      </div>
    </Link>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { isAdmin, schoolName, profile } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const items = NAV.filter((n) => !n.adminOnly || isAdmin)
  const bottom = ['/', '/alumnos', '/registrar', '/historial']
  const more = items.filter((i) => !bottom.includes(i.to))
  const moreActive = more.some((i) => location.pathname.startsWith(i.to))

  return (
    <div className="min-h-dvh lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-night-900 px-4 py-6 lg:flex">
        <div className="px-2"><Brand name={schoolName} /></div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
                isActive ? 'bg-white/10 text-white' : 'text-brand-100/70 hover:bg-white/5 hover:text-white'}`}>
              <Icon name={n.icon} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-3 px-2">
          <SyncStatus />
          <div className="text-sm text-brand-100/70">
            {profile?.full_name ?? profile?.username}
            <div className="text-xs text-brand-100/50">{isAdmin ? 'Administrador' : 'Instructor'}</div>
          </div>
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* mobile top bar */}
        <header className="safe-top sticky top-0 z-30 bg-night-900 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Brand name={schoolName} />
            <SyncStatus compact />
          </div>
          <div className="brand-gradient h-0.5" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* mobile bottom navigation */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5 items-center">
          {[
            { to: '/', label: 'Inicio', icon: 'home' },
            { to: '/alumnos', label: 'Alumnos', icon: 'users' },
          ].map((n) => <TabLink key={n.to} {...n} />)}
          <div className="flex justify-center">
            <NavLink to="/registrar" aria-label="Registrar clase"
              className="brand-gradient -mt-7 grid h-16 w-16 place-items-center rounded-full text-white shadow-[0_10px_24px_-6px_rgba(109,75,233,0.7)] ring-4 ring-surface active:scale-95">
              <Icon name="plus" className="h-8 w-8" strokeWidth={2.6} />
            </NavLink>
          </div>
          <TabLink to="/historial" label="Historial" icon="list" />
          <button type="button" onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${moreActive ? 'text-brand-deep' : 'text-ink-mute'}`}>
            <Icon name="menu" className="h-6 w-6" />
            Más
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-night-950/50" />
          <div className="safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
            {more.map((n) => (
              <NavLink key={n.to} to={n.to} onClick={() => setMoreOpen(false)}
                className="flex min-h-14 items-center gap-4 rounded-2xl px-4 text-lg font-semibold text-heading active:bg-surface-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand-deep"><Icon name={n.icon} /></span>
                {n.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Demo only (shown in Configuración): erase what was loaded and start empty again. */
export function DemoReset() {
  const [confirming, setConfirming] = useState(false)
  async function reset() {
    const demo = await import('../demo/supabase')
    demo.resetDemo()
    window.location.reload()
  }
  return (
    <section className="card mb-5 p-5">
      <h2 className="text-lg font-semibold text-heading">Demo</h2>
      <p className="mt-1 text-sm text-ink-mute">Lo que cargues se guarda solo en este navegador.</p>
      {confirming ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" className="btn-ghost" onClick={() => setConfirming(false)}>Cancelar</button>
          <button type="button" className="btn-danger" onClick={() => void reset()}>Borrar todo</button>
        </div>
      ) : (
        <button type="button" className="btn-ghost mt-3 w-full" onClick={() => setConfirming(true)}>Reiniciar demo (dejar todo en 0)</button>
      )}
    </section>
  )
}

function TabLink({ to, label, icon }: { to: string; label: string; icon: string }) {
  return (
    <NavLink to={to} end={to === '/'}
      className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] font-semibold ${isActive ? 'text-brand-deep' : 'text-ink-mute'}`}>
      <Icon name={icon} className="h-6 w-6" />
      {label}
    </NavLink>
  )
}
