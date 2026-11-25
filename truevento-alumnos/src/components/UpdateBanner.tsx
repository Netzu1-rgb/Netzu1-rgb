import { useRegisterSW } from 'virtual:pwa-register/react'
import { t } from '../i18n'

/** Registers the service worker and offers to reload when a new version is published. */
export default function UpdateBanner() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // look for new versions every hour while the app stays open
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000)
    },
  })
  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-night-900 px-4 py-3 text-sm text-white shadow-xl lg:bottom-6">
      <span className="flex-1">{t('update.text')}</span>
      <button type="button" className="font-semibold text-brand-300" onClick={() => setNeedRefresh(false)}>{t('update.later')}</button>
      <button type="button" className="rounded-lg bg-brand px-3 py-1.5 font-semibold" onClick={() => void updateServiceWorker(true)}>
        {t('update.now')}
      </button>
    </div>
  )
}
