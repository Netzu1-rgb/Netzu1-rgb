import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchRequests } from './api'

// How many class requests from the students app are waiting. Shared by the menu,
// the bottom bar, the dashboard and the app icon; refreshed every minute, when the
// app comes back to the screen and right after a request is confirmed or declined.

const EVENT = 'tv-requests-changed'
/** Call after confirming or declining a request so every counter updates. */
export const requestsChanged = () => window.dispatchEvent(new Event(EVENT))

const Ctx = createContext<{ count: number; refresh: () => void }>({ count: 0, refresh: () => {} })

export function RequestCountProvider({ children }: { children: ReactNode }) {
  const { isAdmin, session } = useAuth()
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    if (!isAdmin || !session) return
    fetchRequests().then((r) => setCount(r.length)).catch(() => { /* keep the last number offline */ })
  }, [isAdmin, session])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(EVENT, refresh)
    // a push message about a new request also refreshes an open app
    const onMessage = (e: MessageEvent) => { if (e.data?.type === 'push') refresh() }
    navigator.serviceWorker?.addEventListener('message', onMessage)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(EVENT, refresh)
      navigator.serviceWorker?.removeEventListener('message', onMessage)
    }
  }, [refresh])

  // the number on the app icon (installed app) and in the browser tab
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { setAppBadge?: (n: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
      if (count > 0) void nav.setAppBadge?.(count).catch(() => {})
      else void nav.clearAppBadge?.().catch(() => {})
    } catch { /* not supported */ }
    const base = document.title.replace(/^\(\d+\)\s*/, '')
    document.title = count > 0 ? `(${count}) ${base}` : base
  }, [count])

  return <Ctx.Provider value={{ count, refresh }}>{children}</Ctx.Provider>
}

export const useRequestCount = () => useContext(Ctx)

/** Red counter on top of a menu icon. */
export function CountBadge({ n, className = '' }: { n: number; className?: string }) {
  if (n <= 0) return null
  return (
    <span className={`pop pointer-events-none grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold leading-none text-white ring-2 ring-surface ${className}`}
      aria-hidden="true">
      {n > 99 ? '99+' : n}
    </span>
  )
}
