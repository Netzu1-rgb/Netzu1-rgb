import { useState, type FormEvent } from 'react'
import AuthShell from '../components/AuthShell'
import { ErrorBox, Field, Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import { friendlyError } from '../lib/errors'

/** Shown only while the school has not been set up: creates the first administrator login. */
export default function FirstAdmin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Ingresá un email válido.')
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== password2) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password })
    setBusy(false)
    if (err) return setError(friendlyError(err))
    if (!data.session) setCheckEmail(true)
  }

  if (checkEmail) {
    return (
      <AuthShell title="Revisá tu email" subtitle="Te enviamos un enlace para confirmar la cuenta.">
        <p className="text-sm text-ink-soft">
          Confirmá tu email y después volvé a abrir TRUEVENTO para terminar la configuración inicial.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Bienvenido a TRUEVENTO"
      subtitle="Primer ingreso: creá la cuenta del administrador. Con ella vas a configurar la escuela y dar acceso a los instructores.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email del administrador">
          {(id) => <input id={id} type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label="Contraseña" hint="Mínimo 8 caracteres.">
          {(id) => <input id={id} type="password" className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        <Field label="Repetir contraseña">
          {(id) => <input id={id} type="password" className="input" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />}
        </Field>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy && <Spinner />} Crear cuenta
        </button>
      </form>
    </AuthShell>
  )
}
