import { isStandalone } from '../lib/pwa'
import { openWhatsApp } from '../lib/whatsapp'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { PrivacyModal, schoolWhatsAppLink } from '../components/Privacy'
import { ErrorBox, Field, Icon, Spinner } from '../components/ui'
import { useSession } from '../context/Session'
import { LanguagePicker, t } from '../i18n'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { normalizeCode } from '../lib/format'
import type { InvitePreview, PersonalData } from '../lib/types'
import { EXPERIENCE, experienceLabel } from '../lib/types'

function Shell({ children, subtitle }: { children: ReactNode; subtitle: string }) {
  return (
    <div className="min-h-dvh bg-night-950 text-white">
      <div className="safe-top mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8">
        <div className="flex justify-center pt-5"><LanguagePicker dark /></div>
        <div className="flex flex-col items-center pb-6 pt-6 text-center">
          <div className="pop relative">
            <div className="absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(109,75,233,0.55),rgba(230,78,134,0.15)_55%,transparent_70%)] blur-xl" aria-hidden="true" />
            <img src="/logo-truevento.svg" alt="TRUEVENTO kiteschool" className="relative h-36 w-36 rounded-full ring-1 ring-white/10 sm:h-40 sm:w-40" />
          </div>
          <h1 className="sr-only">TRUEVENTO</h1>
          <p className="mt-4 text-lg text-brand-100">{subtitle}</p>
        </div>
        <div className="page-enter rounded-3xl bg-surface p-5 text-ink shadow-2xl sm:p-6">{children}</div>
      </div>
    </div>
  )
}

/** Code field with a live check: "Código de Ana ✓". */
function CodeField({ code, setCode, preview }: { code: string; setCode: (v: string) => void; preview: InvitePreview | null | undefined }) {
  return (
    <Field label={t('code.label')} hint={
      preview ? <span className="flex items-center gap-1.5 font-semibold text-violet-deep"><Icon name="check" className="h-4 w-4" />
        {preview.kind === 'admin' ? t('code.admin')
          : t('code.ok', { name: preview.first_name ?? '', kind: t(preview.kind === 'student' ? 'code.kindStudent' : 'code.kindInstructor') })}</span>
        : preview === null && code.length === 9 ? <span className="font-semibold text-coral">{t('code.bad')}</span>
          : t('code.hint')}>
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
    if (codeLength(code) < 6) return
    let alive = true
    void api.invitePreview(code).then((p) => { if (alive) setPreview(p) }).catch(() => { if (alive) setPreview(undefined) })
    return () => { alive = false }
  }, [code])
  return preview
}

/** Letters and digits typed: invitations have 8, the admin code fewer. */
const codeLength = (code: string) => code.replace(/-/g, '').length
const isInvitation = (code: string) => codeLength(code) === 8

/** An invitation links the account to its person; the admin code makes it an admin. */
async function claim(code: string, name: string) {
  if (isInvitation(code)) await api.claimInvite(code)
  else await api.claimAdminCode(code, name.trim())
}

function AdminName({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label={t('data.name')}>
      {(id) => <input id={id} className="input" autoComplete="name" autoCapitalize="words" value={value} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  )
}


const EMPTY: PersonalData = { full_name: '', phone: '', weight_kg: null, experience: null }

/** Name, WhatsApp, weight and experience: what the school needs to know about a new student. */
export function PersonalFields({ value, onChange, withName = true }: {
  value: PersonalData
  onChange: (v: PersonalData) => void
  withName?: boolean
}) {
  return (
    <>
      {withName && (
        <Field label={t('data.name')}>
          {(id) => <input id={id} className="input" autoComplete="name" maxLength={120}
            value={value.full_name} onChange={(e) => onChange({ ...value, full_name: e.target.value })} />}
        </Field>
      )}
      <Field label={t('data.phone')} hint={t('data.phoneHint')}>
        {(id) => <input id={id} className="input" type="tel" inputMode="tel" autoComplete="tel" maxLength={40}
          value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />}
      </Field>
      <p className="-mt-2 flex gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm text-brand-deep">
        <Icon name="whatsapp" className="mt-0.5 h-4 w-4 shrink-0" /> {t('ask.phoneWhy')}
      </p>
      <Field label={t('data.weight')} hint={t('data.weightHint')}>
        {(id) => <input id={id} className="input" inputMode="numeric" maxLength={3}
          value={value.weight_kg ?? ''} onChange={(e) => {
            const n = Number(e.target.value.replace(/\D/g, ''))
            onChange({ ...value, weight_kg: e.target.value.trim() && n ? Math.min(n, 999) : null })
          }} />}
      </Field>
      <fieldset>
        <legend className="field-label">{t('data.experience')}</legend>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE.map((x) => (
            <button key={x} type="button" aria-pressed={value.experience === x}
              onClick={() => onChange({ ...value, experience: x })}
              className={value.experience === x ? 'chip-on' : 'chip'}>{experienceLabel(x)}</button>
          ))}
        </div>
      </fieldset>
    </>
  )
}

/** Checks the personal data; returns a message or null. */
export function personalError(d: PersonalData, withName = true): string | null {
  if (withName && d.full_name.trim().length < 3) return t('err.name')
  if (d.phone.replace(/\D/g, '').length < 8) return t('err.phone')
  if (d.weight_kg !== null && (d.weight_kg < 20 || d.weight_kg > 200)) return t('err.weight')
  if (!d.experience) return t('err.experience')
  return null
}

/** Consent to keep the student's data, with the policy one tap away. */
function PrivacyConsent({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3 text-sm">
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand)]" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-ink-soft">{t('welcome.privacyAccept')}</span>
      </label>
      <button type="button" className="mt-1 pl-8 font-semibold text-brand-deep underline underline-offset-2" onClick={() => setOpen(true)}>
        {t('welcome.privacyRead')}
      </button>
      <PrivacyModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default function Welcome() {
  const { refresh } = useSession()
  const urlCode = normalizeCode(new URLSearchParams(location.search).get('codigo') ?? '')
  const [mode, setMode] = useState<'login' | 'join'>(urlCode ? 'join' : 'login')
  const [withCode, setWithCode] = useState(Boolean(urlCode))
  const [code, setCode] = useState(urlCode)
  const [data, setData] = useState<PersonalData>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forgot, setForgot] = useState(false)
  const [adminName, setAdminName] = useState('')
  const preview = usePreview(code)
  const asAdmin = withCode && !isInvitation(code)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (mode === 'join') {
      if (withCode && codeLength(code) < 6) return setError(t('err.codeIncomplete'))
      if (asAdmin && adminName.trim().length < 3) return setError(t('err.name'))
      if (!withCode) { const msg = personalError(data); if (msg) return setError(msg) }
      if (!api.validUsername(username)) return setError(t('err.username'))
      if (password.length < 8) return setError(t('err.password'))
      if (!consent) return setError(t('err.privacy'))
    } else if (!username.trim() || !password) {
      return setError(t('err.loginEmpty'))
    }
    setBusy(true)
    try {
      if (mode === 'join') {
        await api.signUpAccount(username, password)
        if (withCode) await claim(code, adminName)
        else await api.registerStudent({ ...data, full_name: data.full_name.trim(), phone: data.phone.trim() })
      } else {
        await api.signIn(username, password)
      }
      await refresh()
    } catch (err) {
      const msg = friendlyError(err)
      setError(msg === t('err.registered') ? t('err.userTaken') : msg)
      // the login may exist without its data: the next screen asks for it again
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell subtitle={t('welcome.subtitle')}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
        {(['login', 'join'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null) }}
            className={`min-h-11 rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-surface text-heading shadow' : 'text-ink-mute'}`}>
            {t(m === 'login' ? 'welcome.login' : 'welcome.join')}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {mode === 'join' && (withCode ? (
          <>
            <CodeField code={code} setCode={setCode} preview={preview} />
            {asAdmin && <AdminName value={adminName} onChange={setAdminName} />}
            <button type="button" className="text-sm font-semibold text-brand-deep underline underline-offset-2"
              onClick={() => { setWithCode(false); setError(null) }}>{t('welcome.noCode')}</button>
          </>
        ) : (
          <>
            <PersonalFields value={data} onChange={setData} />
            <button type="button" className="text-sm font-semibold text-brand-deep underline underline-offset-2"
              onClick={() => { setWithCode(true); setError(null) }}>
              {t('welcome.haveCode')}
            </button>
          </>
        ))}
        {mode === 'join' && <div className="border-t border-line pt-4 text-sm font-semibold text-heading">{t('welcome.yourLogin')}</div>}
        <Field label={t(mode === 'join' ? 'welcome.chooseUser' : 'welcome.user')} hint={mode === 'join' ? t('welcome.userHint') : undefined}>
          {(id) => <input id={id} className="input" autoComplete="username" autoCapitalize="none" autoCorrect="off"
            value={username} onChange={(e) => setUsername(e.target.value)} />}
        </Field>
        <Field label={t(mode === 'join' ? 'welcome.choosePassword' : 'welcome.password')} hint={mode === 'join' ? t('welcome.passwordHint') : undefined}>
          {(id) => <input id={id} type="password" className="input" autoComplete={mode === 'join' ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)} />}
        </Field>
        {mode === 'join' && <PrivacyConsent checked={consent} onChange={setConsent} />}
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy}>
          {busy && <Spinner />} {t(mode === 'join' ? 'welcome.create' : 'welcome.enter')}
        </button>
        {mode === 'login' && (
          <div className="text-center text-sm">
            <button type="button" className="font-semibold text-brand-deep underline underline-offset-2" aria-expanded={forgot} onClick={() => setForgot(!forgot)}>
              {t('welcome.forgot')}
            </button>
            {forgot && (
              <div className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-left text-ink-soft">
                <p>{t('welcome.forgotText')}</p>
                <a href={schoolWhatsAppLink()} target="_blank" rel="noreferrer" onClick={(e) => openWhatsApp(e, schoolWhatsAppLink())} className="btn-dark mt-3 w-full">
                  <Icon name="phone" /> WhatsApp
                </a>
              </div>
            )}
          </div>
        )}
      </form>
      {/* first visit from a browser: how to keep the app on the home screen */}
      {import.meta.env.VITE_DEMO !== '1' && !isStandalone() && (
        <a href="/instalar.html" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm font-semibold text-brand-deep">
          <Icon name="install" className="h-4 w-4" /> {t('welcome.install')}
        </a>
      )}
    </Shell>
  )
}

/** Signed in, but the account is not linked yet (sign-up interrupted): finish with data or a code. */
export function ClaimCode() {
  const { refresh, signOut } = useSession()
  const [withCode, setWithCode] = useState(false)
  const [code, setCode] = useState('')
  const [data, setData] = useState<PersonalData>(EMPTY)
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminName, setAdminName] = useState('')
  const preview = usePreview(code)
  const asAdmin = withCode && !isInvitation(code)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!withCode) { const msg = personalError(data); if (msg) return setError(msg) }
    if (asAdmin && adminName.trim().length < 3) return setError(t('err.name'))
    if (!consent) return setError(t('err.privacy'))
    setBusy(true)
    try {
      if (withCode) await claim(code, adminName)
      else await api.registerStudent({ ...data, full_name: data.full_name.trim(), phone: data.phone.trim() })
      await refresh()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell subtitle={t('welcome.oneStep')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-ink-soft">{t('welcome.accountReady')} {t(withCode ? 'welcome.enterCode' : 'welcome.completeData')}</p>
        {withCode ? <CodeField code={code} setCode={setCode} preview={preview} /> : <PersonalFields value={data} onChange={setData} />}
        {asAdmin && <AdminName value={adminName} onChange={setAdminName} />}
        <button type="button" className="text-sm font-semibold text-brand-deep underline underline-offset-2" onClick={() => { setWithCode(!withCode); setError(null) }}>
          {t(withCode ? 'welcome.noCode' : 'welcome.haveCode')}
        </button>
        <PrivacyConsent checked={consent} onChange={setConsent} />
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full text-lg" disabled={busy || (withCode && codeLength(code) < 6)}>
          {busy && <Spinner />} {t('welcome.continue')}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => void signOut()}>{t('welcome.exit')}</button>
      </form>
    </Shell>
  )
}
