import { useState, type FormEvent } from 'react'
import AuthShell from '../components/AuthShell'
import { ErrorBox, Field, Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'
import { loginToEmail } from '../lib/username'

const DOMAIN = (import.meta.env.VITE_USERNAME_DOMAIN as string | undefined) ?? 'truevento.com'
const DEMO = import.meta.env.VITE_DEMO === '1'
const DEMO_LOGINS = DEMO
  ? [
      { label: 'Entrar como Victoria', who: 'Dueña · administradora', user: 'victoria', password: 'demo1234' },
      { label: 'Entrar como Sebastián', who: 'Dueño', user: 'sebastian', password: 'demo1234' },
    ]
  : []

export default function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function enter(user: string, pass: string) {
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email: loginToEmail(user, DOMAIN), password: pass })
    setBusy(false)
    if (err) setError(friendlyError(err))
  }

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
      {DEMO && (
        <div className="mb-6 space-y-2">
          <p className="rounded-xl bg-sand px-3 py-2 text-sm text-ink-soft">
            <b>Demo:</b> empieza vacía; lo que cargues se guarda solo en este navegador. Entrá con un toque:
          </p>
          {DEMO_LOGINS.map((d) => (
            <button key={d.user} type="button" disabled={busy} onClick={() => void enter(d.user, d.password)}
              className="btn-dark w-full justify-between text-left">
              <span>{d.label}</span><span className="text-sm font-medium text-brand-200">{d.who}</span>
            </button>
          ))}
          <p className="pt-2 text-center text-xs text-ink-mute">o con usuario y contraseña (victoria / demo1234)</p>
        </div>
      )}
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
