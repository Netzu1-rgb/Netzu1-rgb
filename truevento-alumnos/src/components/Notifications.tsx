import { useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, resyncPush, testNotification, type PushState } from '../lib/push'
import { friendlyError } from '../lib/errors'
import { t, useLang } from '../i18n'
import { Icon, useToast } from './ui'

const LATER = 'truevento-notif-later'

function usePush() {
  const { lang } = useLang()
  const [state, setState] = useState<PushState | null>(null)
  useEffect(() => {
    let alive = true
    void getPushState().then((s) => { if (alive) setState(s) })
    void resyncPush('alumnos', lang)
    return () => { alive = false }
  }, [lang])
  return { state, setState, lang }
}

function useActions(setState: (s: PushState) => void, lang: string) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  async function on() {
    setBusy(true)
    try {
      const s = await enablePush('alumnos', lang)
      setState(s)
      if (s === 'on') {
        toast(t('notif.enabled'))
        await testNotification(t('notif.enabled'), t('notif.welcome'))
      }
    } catch (err) { toast(friendlyError(err), 'error') } finally { setBusy(false) }
  }
  async function off() {
    setBusy(true)
    try { setState(await disablePush()); toast(t('notif.disabled')) }
    catch (err) { toast(friendlyError(err), 'error') } finally { setBusy(false) }
  }
  return { busy, on, off }
}

/** Ajustes: notifications on this phone. */
export function NotificationsCard() {
  const { state, setState, lang } = usePush()
  const { busy, on, off } = useActions(setState, lang)
  if (state === null || state === 'unsupported') return null
  const text = state === 'on' ? 'notif.on' : state === 'off' ? 'notif.off' : state === 'denied' ? 'notif.denied' : 'notif.ios'
  return (
    <section className="card p-4" aria-labelledby="notif-title">
      <h2 id="notif-title" className="flex items-center gap-2 font-semibold text-heading"><Icon name="bell" /> {t('notif.title')}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t(text)}</p>
      {state === 'off' && (
        <button type="button" className="btn-dark mt-3 w-full" disabled={busy} onClick={() => void on()}><Icon name="bell" /> {t('notif.enable')}</button>
      )}
      {state === 'on' && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void testNotification(t('notif.testTitle'), t('notif.testBody'))}>{t('notif.test')}</button>
          <button type="button" className="btn-ghost text-coral" disabled={busy} onClick={() => void off()}>{t('notif.disable')}</button>
        </div>
      )}
    </section>
  )
}

/** Home: a one-tap offer while the student waits for a request to be confirmed. */
export function NotificationsPrompt() {
  const { state, setState, lang } = usePush()
  const { busy, on } = useActions(setState, lang)
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(LATER) === '1' } catch { return false } })
  if (hidden || state !== 'off') return null
  return (
    <div className="card flex flex-wrap items-center gap-3 border-brand/40 p-4" role="region" aria-label={t('notif.title')}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-deep"><Icon name="bell" /></span>
      <p className="min-w-0 flex-1 font-semibold text-heading">{t('notif.prompt')}</p>
      <div className="flex w-full gap-2 sm:w-auto">
        <button type="button" className="btn-ghost flex-1" onClick={() => { setHidden(true); try { localStorage.setItem(LATER, '1') } catch { /* fine */ } }}>{t('notif.later')}</button>
        <button type="button" className="btn-dark flex-1" disabled={busy} onClick={() => void on()}>{t('notif.enable')}</button>
      </div>
    </div>
  )
}
