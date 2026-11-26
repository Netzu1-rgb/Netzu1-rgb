import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { ErrorBox } from './components/ui'
import UpdateBanner from './components/UpdateBanner'
import { useSession } from './context/Session'
import { isConfigured } from './lib/supabase'
import { t } from './i18n'
import { SettingsPage, WindPage } from './pages/common'
import { StaffAgenda, StaffAnnouncements, StaffStudentDetail, StaffStudents, StaffToday } from './pages/staff'
import { StudentAgenda, StudentHome, StudentProgress } from './pages/student'
import Welcome, { ClaimCode } from './pages/Welcome'

const SPLASH_MIN_MS = 1800
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
  return (
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
  )
}
