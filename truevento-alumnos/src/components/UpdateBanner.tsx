import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { t } from '../i18n'

/** When the app opens, a new version found in these first seconds is applied by itself. */
const ON_OPEN_MS = 15_000
const openedAt = Date.now()

/**
 * Registers the service worker. A new version found right when the app opens is installed
 * at once (nobody keeps an old version, e.g. an old sign-up form); one found later, while
 * the app is in use, waits for a tap on "Update" so nothing is interrupted.
 */
export default function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // look for a new version now, and every hour while the app stays open
      void reg.update()
      setInterval(() => void reg.update(), 60 * 60 * 1000)
    },
  })
  const onOpen = needRefresh && Date.now() - openedAt < ON_OPEN_MS
  useEffect(() => {
    if (onOpen) void updateServiceWorker(true)
  }, [onOpen, updateServiceWorker])
  if (!needRefresh || onOpen) return null
  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-tile ring-1 ring-white/10 px-4 py-3 text-sm text-white shadow-xl lg:bottom-6">
      <span className="flex-1">{t('update.text')}</span>
      <button type="button" className="font-semibold text-brand-300" onClick={() => setNeedRefresh(false)}>{t('update.later')}</button>
      <button type="button" className="rounded-lg bg-brand px-3 py-1.5 font-semibold" onClick={() => void updateServiceWorker(true)}>
        {t('update.now')}
      </button>
    </div>
  )
}
