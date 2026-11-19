import AuthShell from '../components/AuthShell'
import { useAuth } from '../context/AuthContext'

export default function NoAccess() {
  const { signOut, refresh, profile } = useAuth()
  return (
    <AuthShell title="Cuenta sin acceso"
      subtitle={profile && !profile.active ? 'Tu acceso fue desactivado.' : 'Tu cuenta todavía no tiene un rol asignado.'}>
      <p className="text-sm text-ink-soft">Pedile a un administrador de la escuela que te habilite desde Instructores.</p>
      <div className="mt-6 grid gap-3">
        <button type="button" className="btn-primary" onClick={() => void refresh()}>Volver a comprobar</button>
        <button type="button" className="btn-ghost" onClick={() => void signOut()}>Salir</button>
      </div>
    </AuthShell>
  )
}
