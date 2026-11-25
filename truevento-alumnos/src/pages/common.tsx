import { useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { ErrorBox, PageHeader, Icon, Spinner, useConfirm, useToast } from '../components/ui'
import { friendlyError } from '../lib/errors'
import type { PersonalData } from '../lib/types'
import { PersonalFields, personalError } from './Welcome'
import { WindForecast } from '../components/wind'
import { useMe, useSession } from '../context/Session'
import { useInstall } from '../lib/pwa'
import { useTheme, type ThemeChoice } from '../lib/theme'
import * as api from '../lib/api'
import { LanguagePicker, t } from '../i18n'
import type { Key } from '../i18n/messages'
import { PrivacyModal } from '../components/Privacy'

const demoApi = api as unknown as { resetDemo?: () => void }

export function WindPage() {
  return (
    <div>
      <PageHeader title={t('wind.title')} subtitle={t('wind.subtitle')} />
      <WindForecast />
    </div>
  )
}

const THEMES: { value: ThemeChoice; label: Key }[] = [
  { value: 'light', label: 'settings.light' },
  { value: 'dark', label: 'settings.dark' },
  { value: 'system', label: 'settings.system' },
]

export function SettingsPage() {
  const me = useMe()
  const { signOut } = useSession()
  const { choice, setChoice } = useTheme()
  const install = useInstall()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const [privacy, setPrivacy] = useState(false)
  const roleLabel = t(me.role === 'student' ? 'settings.roleStudent' : me.role === 'admin' ? 'settings.roleAdmin' : 'settings.roleInstructor')

  return (
    <div className="space-y-4">
      <PageHeader title={t('settings.title')} />
      <section className="card flex items-center gap-3 p-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep"><Icon name="user" /></span>
        <div>
          <div className="font-semibold text-heading">{me.full_name}</div>
          <div className="text-sm text-ink-mute">{roleLabel} · {me.school_name}</div>
        </div>
      </section>

      {me.role === 'student' && <MyDetails />}

      <section className="card p-4">
        <h2 className="mb-3 font-semibold text-heading">{t('settings.language')}</h2>
        <LanguagePicker />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold text-heading">{t('settings.theme')}</h2>
        <div className="flex flex-wrap gap-2">
          {THEMES.map((th) => (
            <button key={th.value} type="button" aria-pressed={choice === th.value} onClick={() => setChoice(th.value)}
              className={choice === th.value ? 'chip-on' : 'chip'}>{t(th.label)}</button>
          ))}
        </div>
      </section>

      {!install.installed && (
        <section className="card p-4">
          <h2 className="font-semibold text-heading">{t('settings.install')}</h2>
          {install.canPrompt ? (
            <button type="button" className="btn-dark mt-3 w-full" onClick={() => void install.prompt()}><Icon name="install" /> {t('settings.installBtn')}</button>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">
              {t(install.ios ? 'settings.installIos' : 'settings.installOther')}
            </p>
          )}
        </section>
      )}

      <button type="button" className="btn-ghost w-full" onClick={async () => {
        if (!(await confirm({ title: t('settings.logout'), message: t('settings.logoutMsg'), confirmLabel: t('settings.logout') }))) return
        navigate('/', { replace: true })
        await signOut()
      }}>
        <Icon name="logout" /> {t('settings.logout')}
      </button>
      <button type="button" className="w-full text-center text-sm font-semibold text-brand-deep underline underline-offset-2" onClick={() => setPrivacy(true)}>
        {t('settings.privacy')}
      </button>
      <PrivacyModal open={privacy} onClose={() => setPrivacy(false)} />
      {demoApi.resetDemo && (
        <button type="button" className="btn-ghost w-full" onClick={async () => {
          if (await confirm({ title: t('settings.resetDemo'), message: t('settings.resetDemoMsg'), confirmLabel: t('settings.reset'), danger: true })) demoApi.resetDemo!()
        }}>
          <Icon name="refresh" /> {t('settings.resetDemo')}
        </button>
      )}
      <p className="text-center text-xs text-ink-mute">{t('settings.version', { v: __APP_VERSION__ })}</p>
    </div>
  )
}

/** The student's own contact data, which the school sees. */
function MyDetails() {
  const toast = useToast()
  const [data, setData] = useState<PersonalData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void api.myStudentSummary().then((s) => s && setData({ full_name: s.full_name, phone: s.phone ?? '', weight_kg: s.weight_kg, experience: s.experience }))
      .catch(() => setError(t('mydata.loadFailed')))
  }, [])
  if (!data) return error ? <ErrorBox message={error} /> : null
  return (
    <form className="card space-y-4 p-4" noValidate onSubmit={async (e) => {
      e.preventDefault()
      const msg = personalError(data, false)
      if (msg) return setError(msg)
      setBusy(true)
      setError(null)
      try {
        await api.updateMyDetails({ phone: data.phone.trim(), weight_kg: data.weight_kg, experience: data.experience })
        toast(t('mydata.saved'))
      } catch (err) {
        setError(friendlyError(err))
      } finally {
        setBusy(false)
      }
    }}>
      <h2 className="font-semibold text-heading">{t('mydata.title')}</h2>
      <PersonalFields value={data} onChange={setData} withName={false} />
      {error && <ErrorBox message={error} />}
      <button type="submit" className="btn-dark w-full" disabled={busy}>{busy && <Spinner />} {t('mydata.save')}</button>
    </form>
  )
}
