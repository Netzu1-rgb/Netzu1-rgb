import { useState, type FormEvent } from 'react'
import AuthShell from '../components/AuthShell'
import { ErrorBox, Field, Spinner } from '../components/ui'
import { setupSchool } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { useAuth } from '../context/AuthContext'
import { CURRENCIES } from '../lib/currencies'

/** First-run configuration: school name, the two owners and the currency. Runs once. */
export default function Setup() {
  const { refresh, signOut } = useAuth()
  const [schoolName, setSchoolName] = useState('TRUEVENTO')
  const [owner1, setOwner1] = useState('')
  const [owner2, setOwner2] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [me, setMe] = useState<1 | 2>(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!schoolName.trim() || !owner1.trim() || !owner2.trim()) return setError('Completá todos los campos.')
    setBusy(true)
    try {
      await setupSchool({ school_name: schoolName, owner1, owner2, currency, me })
      await refresh()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Configuración inicial"
      subtitle="Los dos instructores principales son los dueños: sus clases no generan pagos de instructor.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre de la escuela">
          {(id) => <input id={id} className="input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />}
        </Field>
        <Field label="Dueño / instructor principal 1">
          {(id) => <input id={id} className="input" autoComplete="off" value={owner1} onChange={(e) => setOwner1(e.target.value)} placeholder="Nombre y apellido" />}
        </Field>
        <Field label="Dueño / instructor principal 2">
          {(id) => <input id={id} className="input" autoComplete="off" value={owner2} onChange={(e) => setOwner2(e.target.value)} placeholder="Nombre y apellido" />}
        </Field>
        <Field label="Moneda de los precios">
          {(id) => (
            <select id={id} className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          )}
        </Field>
        <fieldset>
          <legend className="field-label">¿Cuál de los dos sos vos?</legend>
          <div className="grid grid-cols-2 gap-2">
            {([1, 2] as const).map((n) => (
              <button key={n} type="button" onClick={() => setMe(n)} className={me === n ? 'chip-on min-h-12' : 'chip min-h-12'}>
                {(n === 1 ? owner1 : owner2).trim() || `Dueño ${n}`}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy && <Spinner />} Guardar y empezar
        </button>
        <button type="button" className="w-full text-sm font-semibold text-ink-mute" onClick={() => void signOut()}>
          Salir
        </button>
      </form>
    </AuthShell>
  )
}
