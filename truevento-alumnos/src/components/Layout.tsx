import { NavLink, Outlet, useLocation } from 'react-router'
import { useMe } from '../context/Session'
import { Icon } from './ui'

interface Tab { to: string; label: string; icon: string }

const STUDENT_TABS: Tab[] = [
  { to: '/', label: 'Inicio', icon: 'home' },
  { to: '/agenda', label: 'Mis clases', icon: 'calendar' },
  { to: '/progreso', label: 'Progreso', icon: 'star' },
  { to: '/viento', label: 'Viento', icon: 'wind' },
]

const STAFF_TABS: Tab[] = [
  { to: '/', label: 'Hoy', icon: 'home' },
  { to: '/agenda', label: 'Agenda', icon: 'calendar' },
  { to: '/alumnos', label: 'Alumnos', icon: 'users' },
  { to: '/avisos', label: 'Avisos', icon: 'megaphone' },
  { to: '/viento', label: 'Viento', icon: 'wind' },
]

export default function Layout() {
  const me = useMe()
  const tabs = me.isStaff ? STAFF_TABS : STUDENT_TABS
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh lg:flex">
      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-night-900 p-5 text-white lg:flex">
        <div className="mb-8 flex items-center gap-3">
          <img src="/logo-truevento.png" alt="" className="h-11 w-11 rounded-full" />
          <div>
            <div className="font-display text-lg font-bold">TRUEVENTO</div>
            <div className="text-xs text-brand-200">{me.isStaff ? 'Instructores' : 'Alumnos'}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Secciones">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-brand-100/80 hover:bg-white/6'}`}>
              <Icon name={t.icon} /> {t.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/ajustes" className={({ isActive }) => `mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${isActive ? 'bg-white/12' : 'text-brand-100/80 hover:bg-white/6'}`}>
          <Icon name="settings" /> Ajustes
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* phone header */}
        <header className="safe-top sticky top-0 z-30 bg-night-900 text-white lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <img src="/logo-truevento.png" alt="" className="h-9 w-9 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="font-display font-bold leading-tight">TRUEVENTO</div>
              <div className="truncate text-xs text-brand-200">{me.full_name}</div>
            </div>
            <NavLink to="/ajustes" aria-label="Ajustes"
              className={`grid h-10 w-10 place-items-center rounded-full ${pathname === '/ajustes' ? 'bg-white/15' : 'hover:bg-white/10'}`}>
              <Icon name="settings" />
            </NavLink>
          </div>
          <div className="brand-gradient h-[3px]" />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
          <Outlet />
        </main>

        {/* phone bottom bar */}
        <nav aria-label="Secciones" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-lg">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.to === '/'}
                className={({ isActive }) => `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${isActive ? 'text-brand-deep' : 'text-ink-mute'}`}>
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-brand-soft' : ''}`}>
                      <Icon name={t.icon} className="h-5 w-5" />
                    </span>
                    {t.label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
