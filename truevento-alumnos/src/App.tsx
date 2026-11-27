import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { ErrorBox } from './components/ui'
import UpdateBanner from './components/UpdateBanner'
import { useSession } from './context/Session'
import { isConfigured } from './lib/supabase'
import { t } from './i18n'
// each screen is downloaded when it is first opened: a student never downloads the staff ones
const page = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))
const SettingsPage = page(() => import('./pages/common'), 'SettingsPage')
const WindPage = page(() => import('./pages/common'), 'WindPage')
const StaffToday = page(() => import('./pages/staff'), 'StaffToday')
const StaffAgenda = page(() => import('./pages/staff'), 'StaffAgenda')
const StaffStudents = page(() => import('./pages/staff'), 'StaffStudents')
const StaffStudentDetail = page(() => import('./pages/staff'), 'StaffStudentDetail')
const StaffAnnouncements = page(() => import('./pages/staff'), 'StaffAnnouncements')
const StudentHome = page(() => import('./pages/student'), 'StudentHome')
const StudentAgenda = page(() => import('./pages/student'), 'StudentAgenda')
const StudentProgress = page(() => import('./pages/student'), 'StudentProgress')
import Welcome, { ClaimCode, PhoneGate } from './pages/Welcome'

// the logo shows briefly when the app opens (it used to wait 1.8 s even when ready)
const SPLASH_MIN_MS = 800
const started = performance.now()

function hideSplash() {
  const el = document.getElementById('splash')
  if (!el) return
  const wait = Math.max(0, SPLASH_MIN_MS - (performance.now() - started))
  setTimeout(() => {
    el.classList.add('hide')
    setTimeout(() => el.remove(), 700)
  }, wait)
}

export default function App() {
  const { status, me, refresh } = useSession()
  useEffect(() => {
    if (status !== 'loading') hideSplash()
  }, [status])

  return (
    <>
      <UpdateBanner />
      <Screens status={status} role={me?.role ?? null} retry={refresh} />
    </>
  )
}

function Screens({ status, role, retry }: { status: string; role: string | null; retry: () => Promise<void> }) {
  if (!isConfigured) {
    return <div className="p-6"><ErrorBox message={t('app.noConfig')} /></div>
  }
  if (status === 'loading') return null
  if (status === 'error') return <div className="p-6"><ErrorBox message={t('app.noConnection')} onRetry={() => void retry()} /></div>
  if (status === 'signedOut') return <Welcome />
  if (status === 'noRole') return <ClaimCode />

  const staff = role !== 'student'
  const routes = (
    <Suspense fallback={null}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={staff ? <StaffToday /> : <StudentHome />} />
        <Route path="agenda" element={staff ? <StaffAgenda /> : <StudentAgenda />} />
        {staff ? <>
          <Route path="alumnos" element={<StaffStudents />} />
          <Route path="alumnos/:id" element={<StaffStudentDetail />} />
          <Route path="avisos" element={<StaffAnnouncements />} />
        </> : <Route path="progreso" element={<StudentProgress />} />}
        <Route path="viento" element={<WindPage />} />
        <Route path="ajustes" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
    </Suspense>
  )
  // a student first confirms a WhatsApp number with its country code
  return staff ? routes : <PhoneGate>{routes}</PhoneGate>
}
