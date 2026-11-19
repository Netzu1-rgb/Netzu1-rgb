import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { isConfigured } from './lib/supabase'
import Layout from './components/Layout'
import UpdateBanner from './components/UpdateBanner'
import Login from './pages/Login'
import FirstAdmin from './pages/FirstAdmin'
import Setup from './pages/Setup'
import NoAccess from './pages/NoAccess'
import { Loading } from './components/ui'

// each screen loads on demand (all are precached by the service worker for offline use)
const Dashboard = lazy(() => import('./pages/Dashboard'))
const RegisterClass = lazy(() => import('./pages/RegisterClass'))
const Students = lazy(() => import('./pages/Students'))
const StudentDetail = lazy(() => import('./pages/StudentDetail'))
const Instructors = lazy(() => import('./pages/Instructors'))
const Settlements = lazy(() => import('./pages/Settlements'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))

function hideSplash() {
  const el = document.getElementById('splash')
  if (!el || el.classList.contains('hide')) return
  el.classList.add('hide')
  setTimeout(() => el.remove(), 400)
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth()
  return isAdmin ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <>
      <Screens />
      <UpdateBanner />
    </>
  )
}

function Screens() {
  const { loading, session, profile, setupCompleted } = useAuth()

  useEffect(() => {
    if (!loading || !isConfigured) hideSplash()
  }, [loading])

  if (!isConfigured) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="card max-w-md p-6">
          <h1 className="text-xl font-bold text-ocean-900">Falta configurar Supabase</h1>
          <p className="mt-2 text-sm text-ink-mute">
            Definí VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (ver README) y volvé a compilar la app.
          </p>
        </div>
      </div>
    )
  }
  if (loading) return null // the launch screen is still visible

  if (!session) return setupCompleted === false ? <FirstAdmin /> : <Login />
  if (setupCompleted === false) return <Setup />
  if (!profile?.role || !profile.active) return <NoAccess />

  return (
    <Layout>
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/registrar" element={<RegisterClass />} />
        <Route path="/clases/:id/editar" element={<AdminOnly><RegisterClass /></AdminOnly>} />
        <Route path="/alumnos" element={<Students />} />
        <Route path="/alumnos/:id" element={<StudentDetail />} />
        <Route path="/instructores" element={<AdminOnly><Instructors /></AdminOnly>} />
        <Route path="/liquidaciones" element={<Settlements />} />
        <Route path="/historial" element={<History />} />
        <Route path="/configuracion" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Layout>
  )
}
