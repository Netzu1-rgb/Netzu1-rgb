import { useState, type FormEvent } from 'react'
import AuthShell from '../components/AuthShell'
import { ErrorBox, Field, Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { loginToEmail } from '../lib/username'

const DOMAIN = (import.meta.env.VITE_USERNAME_DOMAIN as string | undefined) ?? 'usuarios.truevento.app'

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!login.trim() || !password) {
      setError('Ingresá tu usuario y contraseña.')
      return
    }
    setBusy(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: loginToEmail(login, DOMAIN), password })
    setBusy(false)
    if (err) setError(friendlyError(err))
  }

  return (
    <AuthShell title="Ingresar" subtitle="Usá el usuario y la contraseña que te dio la escuela.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Usuario o email">
          {(id) => (
            <input id={id} className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off"
              value={login} onChange={(e) => setLogin(e.target.value)} placeholder="ej: sebastian" />
          )}
        </Field>
        <Field label="Contraseña">
          {(id) => (
            <input id={id} type="password" className="input" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy && <Spinner />} Ingresar
        </button>
      </form>
    </AuthShell>
  )
}
