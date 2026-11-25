import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useMe } from '../context/Session'
import { LanguageMenu, t, useLang } from '../i18n'
import type { Key } from '../i18n/messages'
import { RequestLessonModal, ScheduleModal } from './lessons'
import { Icon } from './ui'
import * as api from '../lib/api'
import { addDays, today } from '../lib/format'
import { useLoad } from '../lib/hooks'

interface Tab { to: string; label: Key; icon: string }

// phone bar: two tabs, the big "+" in the middle, two tabs (like the management app)
const STUDENT_TABS: Tab[] = [
  { to: '/', label: 'nav.home', icon: 'home' },
  { to: '/agenda', label: 'nav.myClasses', icon: 'calendar' },
  { to: '/progreso', label: 'nav.progress', icon: 'star' },
  { to: '/viento', label: 'nav.wind', icon: 'wind' },
]
const STAFF_TABS: Tab[] = [
  { to: '/', label: 'nav.today', icon: 'home' },
  { to: '/agenda', label: 'nav.agenda', icon: 'calendar' },
  { to: '/alumnos', label: 'nav.students', icon: 'users' },
  { to: '/avisos', label: 'nav.announcements', icon: 'megaphone' },
]
// the sidebar on big screens has room for everything
const STAFF_SIDEBAR: Tab[] = [...STAFF_TABS, { to: '/viento', label: 'nav.wind', icon: 'wind' }]

function TabLink({ tab, badge = 0 }: { tab: Tab; badge?: number }) {
  return (
    <NavLink to={tab.to} end={tab.to === '/'} aria-label={badge > 0 ? `${t(tab.label)} (${badge})` : undefined}
      className={({ isActive }) => `flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${isActive ? 'text-brand-deep' : badge > 0 ? 'text-coral-ink' : 'text-ink-mute'}`}>
      {({ isActive }) => (
        <>
          <span className={`relative grid h-8 w-12 place-items-center rounded-full transition ${isActive ? 'bg-brand-soft' : ''}`}>
            <Icon name={tab.icon} className="h-5 w-5" />
            {badge > 0 && <span className="pop absolute -top-1 right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface" aria-hidden="true">{badge}</span>}
          </span>
          {t(tab.label)}
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const me = useMe()
  const { lang } = useLang()
  // the school writes to the student (WhatsApp, notifications) in this language
  useEffect(() => { if (me.role === 'student') void api.setMyLang(lang).catch(() => {}) }, [me.role, lang])
  const tabs = me.isStaff ? STAFF_TABS : STUDENT_TABS
  const side = me.isStaff ? STAFF_SIDEBAR : STUDENT_TABS
  const { pathname } = useLocation()
  const [quick, setQuick] = useState(false)
  const actionLabel = t(me.isStaff ? 'staff.schedule' : 'nav.ask')
  // instructors: class requests waiting for them (or for anyone), shown on "Today"
  const reqs = useLoad(async () => me.isStaff
    ? (await api.agenda(today(), addDays(today(), 180))).filter((l) => l.status === 'requested' && (me.isAdmin || !l.instructor_id || l.instructor_id === me.instructor_id)).length
    : 0, [me.isStaff])
  const pendingRequests = reqs.data ?? 0

  return (
    <div className="min-h-dvh lg:flex">
      {/* big screens: sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-night-900 p-5 text-white lg:flex">
        <div className="mb-6 flex items-center gap-3">
          <img src="/logo-mark.svg" alt="" className="h-12 w-12 rounded-full ring-1 ring-white/15" />
          <div>
            <div className="font-display text-lg font-extrabold tracking-[0.08em]">TRUEVENTO</div>
            <div className="text-xs text-brand-200">{t(me.isStaff ? 'nav.forInstructors' : 'nav.forStudents')}</div>
          </div>
        </div>
        <button type="button" onClick={() => setQuick(true)} className="btn-primary mb-6 w-full"><Icon name="plus" /> {actionLabel}</button>
        <nav className="flex flex-col gap-1" aria-label={t('nav.sections')}>
          {side.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.to === '/'}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-brand-100/80 hover:bg-white/6 hover:text-white'}`}>
              <Icon name={tab.icon} /> <span className="flex-1">{t(tab.label)}</span>
              {tab.to === '/' && pendingRequests > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">{pendingRequests}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between rounded-xl px-1">
            <span className="truncate text-sm text-brand-100/80">{me.full_name}</span>
            <LanguageMenu />
          </div>
          <NavLink to="/ajustes" className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${isActive ? 'bg-white/12' : 'text-brand-100/80 hover:bg-white/6'}`}>
            <Icon name="settings" /> {t('nav.settings')}
          </NavLink>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* phones and tablets: top bar */}
        <header className="safe-top sticky top-0 z-30 bg-night-900 text-white lg:hidden">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
            <img src="/logo-mark.svg" alt="" className="h-10 w-10 rounded-full ring-1 ring-white/15" />
            <div className="min-w-0 flex-1 pl-1">
              <div className="font-display font-extrabold leading-tight tracking-[0.06em]">TRUEVENTO</div>
              <div className="truncate text-xs text-brand-200">{me.full_name}</div>
            </div>
            <LanguageMenu />
            <NavLink to="/ajustes" aria-label={t('nav.settings')}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${pathname === '/ajustes' ? 'bg-white/15' : 'hover:bg-white/10'}`}>
              <Icon name="settings" />
            </NavLink>
          </div>
          <div className="brand-gradient h-[3px]" />
        </header>

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          {/* each screen fades in when you arrive */}
          <div key={pathname} className="page-enter"><Outlet /></div>
        </main>

        {/* phones and tablets: bottom bar with the main action in the middle */}
        <nav aria-label={t('nav.sections')} className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-xl grid-cols-5 items-center">
            <TabLink tab={tabs[0]} badge={pendingRequests} />
            <TabLink tab={tabs[1]} />
            <div className="flex flex-col items-center">
              <button type="button" onClick={() => setQuick(true)} aria-label={actionLabel}
                className="brand-gradient -mt-7 grid h-16 w-16 place-items-center rounded-full text-white shadow-[0_10px_24px_-6px_rgba(109,75,233,0.7)] ring-4 ring-surface transition active:scale-95">
                <Icon name="plus" className="h-8 w-8" strokeWidth={2.6} />
              </button>
              <span className="mt-0.5 text-[11px] font-semibold text-ink-mute">{actionLabel}</span>
            </div>
            <TabLink tab={tabs[2]} />
            <TabLink tab={tabs[3]} />
          </div>
        </nav>
      </div>

      {me.isStaff
        ? <ScheduleModal open={quick} lesson={null} onClose={() => setQuick(false)} myInstructorId={me.instructor_id} isAdmin={me.isAdmin} />
        : <RequestLessonModal open={quick} onClose={() => setQuick(false)} />}
    </div>
  )
}
