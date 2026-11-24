import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ErrorBox, Field, Icon, Spinner } from '../components/ui'
import { useSession } from '../context/Session'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { normalizeCode } from '../lib/format'
import type { InvitePreview } from '../lib/types'

function Shell({ children, subtitle }: { children: ReactNode; subtitle: string }) {
  return (
    <div className="min-h-dvh bg-night-950 text-white">
      <div className="safe-top mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8">
        <div className="flex flex-col items-center pb-6 pt-10 text-center">
          <img src="/logo-truevento.png" alt="TRUEVENTO kiteschool" className="h-24 w-24 rounded-full shadow-[0_12px_40px_rgba(109,75,233,0.45)]" />
          <h1 className="mt-4 font-display text-3xl font-bold">TRUEVENTO</h1>
          <p className="mt-1 text-brand-200">{subtitle}</p>
        </div>
        <div className="rounded-3xl bg-surface p-5 text-ink shadow-2xl sm:p-6">{children}</div>
      </div>
    </div>
  )
}

/** Code field with a live check: "Código de Ana ✓". */
function CodeField({ code, setCode, preview }: { code: string; setCode: (v: string) => void; preview: InvitePreview | null | undefined }) {
  return (
    <Field label="Código de invitación" hint={
      preview ? <span className="flex items-center gap-1.5 font-semibold text-violet-deep"><Icon name="check" className="h-4 w-4" />
        Código de {preview.first_name} ({preview.kind === 'student' ? 'alumno' : 'instructor'})</span>
        : preview === null && code.length === 9 ? <span className="font-semibold text-coral">Ese código no existe o ya se usó.</span>
          : 'Te lo manda la escuela por WhatsApp. Ej: K7MD-Q2XP'}>
      {(id) => (
        <input id={id} className="input tabular text-center text-xl font-bold tracking-[0.2em] uppercase" autoComplete="one-time-code"
          autoCapitalize="characters" autoCorrect="off" spellCheck={false} inputMode="text" maxLength={9} placeholder="XXXX-XXXX"
          value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} />
      )}
    </Field>
  )
}

function usePreview(code: string) {
  const [preview, setPreview] = useState<InvitePreview | null | undefined>(undefined)
  useEffect(() => {
    setPreview(undefined)
    if (code.length !== 9) return
    let alive = true
    void api.invitePreview(code).then((p) => { if (alive) setPreview(p) }).catch(() => { if (alive) setPreview(undefined) })
    return () => { alive = false }
  }, [code])
  return preview
}

const DEMO = import.meta.env.VITE_DEMO === '1'
const demoApi = api as unknown as { demoInvite?: () => string }

export default function Welcome() {
  const { refresh } = useSession()
  const [mode, setMode] = useState<'join' | 'login'>(() => (new URLSearchParams(location.search).get('codigo') ? 'join' : 'login'))
  const [code, setCode] = useState(() => normalizeCode(new URLSearchParams(location.search).get('codigo') ?? ''))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = usePreview(code)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'join') {
      if (code.length !== 9) return setError('Escribí el código completo (8 letras y números).')
      if (!api.validUsername(username)) return setError('El usuario debe tener de 3 a 30 letras o números, sin espacios.')
      if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    } else if (!username.trim() || !password) {
      return setError('Escribí tu usuario y tu contraseña.')
    }
    setBusy(true)
    try {
      if (mode === 'join') await api.signUpWithCode(code, username, password)
      else await api.signIn(username, password)
      await refresh()
    } catch (err) {
      const msg = friendlyError(err)
      setError(/Ya existe una cuenta/.test(msg) ? 'Ese usuario ya está en uso. Elegí otro.' : msg)
      // the account may exist without the code applied: the next screen asks for it again
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell subtitle="Tus clases, tu progreso y el viento">
      {DEMO && (
        <div className="mb-5 space-y-2">
          <p className="rounded-xl bg-sand px-3 py-2 text-sm text-ink-soft"><b>Demo:</b> los datos se guardan solo en este navegador. Probá los dos lados:</p>
          <button type="button" className="btn-dark w-full justify-between" disabled={busy}
            onClick={() => { setBusy(true); void api.signIn('ana', 'demo1234').then(refresh).finally(() => setBusy(false)) }}>
            <span>Entrar como alumna</span><span className="text-sm text-brand-200">Ana</span>
          </button>
          <button type="button" className="btn-dark w-full justify-between" disabled={busy}
            onClick={() => { setBusy(true); void api.signIn('victoria', 'demo1234').then(refresh).finally(() => setBusy(false)) }}>
            <span>Entrar como instructora</span><span className="text-sm text-brand-200">Victoria</span>
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => { setMode('join'); setCode(demoApi.demoInvite?.() ?? '') }}>
            Probar con un código de invitación
          </button>
        </div>
      )}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
        {(['login', 'join'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null) }}
            className={`min-h-11 rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-surface text-heading shadow' : 'text-ink-mute'}`}>
            {m === 'login' ? 'Ya tengo cuenta' : 'Tengo un código'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === 'join' && <CodeField code={code} setCode={setCode} preview={preview} />}
        <Field label={mode === 'join' ? 'Elegí un usuario' : 'Usuario'} hint={mode === 'join' ? 'Con esto vas a entrar siempre. Ej: ana.silva' : undefined}>
          {(id) => <input id={id} className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off"
            value={username} onChange={(e) => setUsername(e.target.value)} />}
        </Field>
        <Field label={mode === 'join' ? 'Elegí una contraseña' : 'Contraseña'} hint={mode === 'join' ? 'Al menos 8 caracteres.' : undefined}>
          {(id) => <input id={id} type="password" className="input" autoComplete={mode === 'join' ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy && <Spinner />} {mode === 'join' ? 'Crear mi cuenta' : 'Entrar'}
        </button>
      </form>
    </Shell>
  )
}

/** Signed in, but the account is not linked yet (the code failed or was never entered). */
export function ClaimCode() {
  const { refresh, signOut } = useSession()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const preview = usePreview(code)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.claimInvite(code)
      await refresh()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell subtitle="Falta un paso">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-ink-soft">Tu cuenta está creada. Escribí el código que te mandó la escuela para ver tus clases.</p>
        <CodeField code={code} setCode={setCode} preview={preview} />
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy || code.length !== 9}>
          {busy && <Spinner />} Continuar
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => void signOut()}>Salir</button>
      </form>
    </Shell>
  )
}
