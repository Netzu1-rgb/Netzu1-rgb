import { useCallback, useEffect, useRef, useState } from 'react'
import { friendlyError } from './errors'

// After any change, screens that show data reload it.
const listeners = new Set<() => void>()
export function notifyChange() {
  listeners.forEach((fn) => fn())
}

/** Loads data, reloads it after changes and when the app comes back to the screen. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const loadRef = useRef(load)
  loadRef.current = load

  const reload = useCallback(async () => {
    try {
      const value = await loadRef.current()
      setData(value)
      setError(null)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    listeners.add(reload)
    const onVisible = () => { if (document.visibilityState === 'visible') void reload() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      listeners.delete(reload)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  return { data, error, loading, reload }
}
