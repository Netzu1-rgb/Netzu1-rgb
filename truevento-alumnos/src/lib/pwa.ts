import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const subscribers = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    subscribers.forEach((fn) => fn())
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    subscribers.forEach((fn) => fn())
  })
}

export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Install support: `canPrompt` on Chrome/Edge/Android; iOS installs from the Share menu. */
export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((n) => n + 1)
    subscribers.add(fn)
    return () => {
      subscribers.delete(fn)
    }
  }, [])
  return {
    installed: isStandalone(),
    canPrompt: deferred !== null,
    ios: isIOS(),
    async prompt() {
      if (!deferred) return false
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      deferred = null
      force((n) => n + 1)
      return outcome === 'accepted'
    },
  }
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

/**
 * Which phone and browser this is, read from what the browser says about itself, so the
 * person never has to know it: Safari on iOS 26 (small bar with •••) or on iOS 18 and older
 * (buttons at the bottom), Chrome on iPhone, iPad, an app's own browser (Instagram,
 * Facebook: no install from there), Android, or a computer.
 */
export type Browser = 'ios26' | 'ios18' | 'ios-chrome' | 'ipad' | 'in-app' | 'android' | 'desktop'
export function detectBrowser(ua: string = navigator.userAgent, touch = navigator.maxTouchPoints ?? 0, platform = navigator.platform): Browser {
  if (/Instagram|FBAN|FBAV|FB_IAB|Line\//.test(ua)) return 'in-app'
  if (/android/i.test(ua)) return 'android'
  const ipad = /iPad/.test(ua) || (platform === 'MacIntel' && touch > 1)
  if (!/iPhone|iPod/.test(ua) && !ipad) return 'desktop'
  if (/CriOS|FxiOS|EdgiOS/.test(ua)) return 'ios-chrome'
  if (ipad) return 'ipad'
  const v = Number((ua.match(/Version\/(\d+)/) || [])[1] || 0)
  const os = Number((ua.match(/OS (\d+)_/) || [])[1] || 0)
  return v >= 26 || os >= 26 ? 'ios26' : 'ios18'
}
