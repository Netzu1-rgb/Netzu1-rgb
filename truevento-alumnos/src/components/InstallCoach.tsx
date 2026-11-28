import { useEffect, useState } from 'react'
import { detectBrowser, isStandalone, useInstall, type Browser } from '../lib/pwa'
import { t } from '../i18n'
import type { Key } from '../i18n/messages'
import { Icon } from './ui'

/** Asks the coach to open (e.g. the "Install the app" button on the sign-in screen). */
export const OPEN_COACH = 'tv-install-coach'
export const openInstallCoach = () => window.dispatchEvent(new Event(OPEN_COACH))

const DISMISS_KEY = 'truevento-coach-dismissed'
const DISMISS_DAYS = 7

/**
 * Where to tap, for each phone and browser: the arrow points at the real button, outside the
 * page (the browser's own bar), and the steps below say what comes next.
 */
const GUIDE: Record<Exclude<Browser, 'desktop'>, { arrow: 'bottom-right' | 'bottom-center' | 'top-right'; steps: Key[]; name: Key }> = {
  ios26: { arrow: 'bottom-right', steps: ['coach.ios26.1', 'coach.share', 'coach.addHome', 'coach.add'], name: 'coach.name.ios26' },
  ios18: { arrow: 'bottom-center', steps: ['coach.ios18.1', 'coach.addHome', 'coach.add'], name: 'coach.name.ios18' },
  'ios-chrome': { arrow: 'top-right', steps: ['coach.chrome.1', 'coach.addHome', 'coach.add'], name: 'coach.name.chrome' },
  ipad: { arrow: 'top-right', steps: ['coach.ipad.1', 'coach.addHome', 'coach.add'], name: 'coach.name.ipad' },
  'in-app': { arrow: 'top-right', steps: ['coach.inapp.1', 'coach.inapp.2'], name: 'coach.name.inapp' },
  android: { arrow: 'top-right', steps: ['coach.android.1', 'coach.android.2'], name: 'coach.name.android' },
}

const dismissedRecently = () => {
  try { return Date.now() - Number(localStorage.getItem(DISMISS_KEY) ?? 0) < DISMISS_DAYS * 86400e3 } catch { return false }
}

/**
 * Helps to install the app from the browser. On Android (Chrome, Edge, Samsung) one button
 * installs it. On iPhone, where only the person can add it from Safari's menu, an arrow
 * points at the exact button on their screen (by iOS version and browser, detected), with
 * the next steps. Shows by itself once in a while; never inside the installed app.
 */
export default function InstallCoach() {
  const install = useInstall()
  const [open, setOpen] = useState(false)
  const browser = detectBrowser()
  const guide = browser === 'desktop' ? null : GUIDE[browser]

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(OPEN_COACH, show)
    // by itself on a phone's browser, not every time
    const timer = setTimeout(() => { if (browser !== 'desktop' && !dismissedRecently()) setOpen(true) }, 1500)
    return () => { window.removeEventListener(OPEN_COACH, show); clearTimeout(timer) }
  }, [browser])

  if (!open || isStandalone() || install.installed || !guide) return null
  const close = () => { setOpen(false); try { localStorage.setItem(DISMISS_KEY, String(Date.now())) } catch { /* not kept */ } }
  const oneTap = install.canPrompt // Android and other browsers that install with one tap
  const top = guide.arrow === 'top-right' && !oneTap

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-labelledby="coach-title">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label={t('coach.later')} onClick={close} />
      {!oneTap && (
        <span aria-hidden="true" className={`coach-arrow pointer-events-none absolute text-white ${
          guide.arrow === 'bottom-right' ? 'bottom-2 right-5' : guide.arrow === 'bottom-center' ? 'bottom-2 left-1/2 -translate-x-1/2' : 'right-4 top-2 rotate-180'}`}>
          <svg viewBox="0 0 24 24" className="h-14 w-14 drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v16M5 12l7 7 7-7" /></svg>
        </span>
      )}
      <div className={`absolute inset-x-3 mx-auto max-w-md rounded-3xl bg-surface p-5 text-ink shadow-2xl ${top ? 'top-20' : 'bottom-20'}`}>
        <div className="flex items-start gap-3">
          <img src="/icons/icon-192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <h2 id="coach-title" className="font-display text-lg font-bold text-heading">{t(oneTap ? 'coach.titleOneTap' : 'coach.title')}</h2>
            <p className="text-xs text-ink-mute">{t('coach.detected', { device: t(guide.name) })}</p>
          </div>
        </div>
        {oneTap ? (
          <>
            <p className="mt-3 text-sm text-ink-soft">{t('coach.oneTapText')}</p>
            <button type="button" className="btn-dark mt-4 w-full" onClick={async () => { if (await install.prompt()) setOpen(false) }}>
              <Icon name="install" /> {t('coach.installBtn')}
            </button>
          </>
        ) : (
          <ol className="mt-3 space-y-2">
            {guide.steps.map((k, i) => (
              <li key={k} className={`flex items-start gap-3 rounded-xl px-3 py-2 text-sm ${i === 0 ? 'bg-brand-soft font-semibold text-brand-deep' : 'text-ink-soft'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${i === 0 ? 'bg-brand text-white' : 'bg-surface-2 text-ink-mute'}`}>{i + 1}</span>
                <span className="pt-0.5">{t(k)}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <a href="/instalar" className="font-semibold text-brand-deep underline underline-offset-2">{t('coach.guide')}</a>
          <button type="button" className="font-semibold text-ink-mute" onClick={close}>{t('coach.later')}</button>
        </div>
      </div>
    </div>
  )
}
