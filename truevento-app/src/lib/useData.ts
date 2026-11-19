import { useCallback, useEffect, useRef, useState } from 'react'
import { cacheGet, cachePut } from './offline'
import { friendlyError, isNetworkError } from './errors'

export interface DataState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  /** data shown comes from this device because the server could not be reached */
  offline: boolean
  savedAt: string | null
  reload: () => void
}

/**
 * Loads data with a device cache: cached data shows at once, fresh data replaces it,
 * and if there is no connection the cached copy stays on screen.
 * `key` null skips loading. The key must change whenever the query changes.
 */
export function useData<T>(key: string | null, fetcher: () => Promise<T>): DataState<T> {
  const [state, setState] = useState<Omit<DataState<T>, 'reload'>>({
    data: undefined, loading: key !== null, error: null, offline: false, savedAt: null,
  })
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const lastKey = useRef(key)

  useEffect(() => {
    if (key === null) return
    let cancelled = false
    // a new query must not show the previous query's rows; a reload keeps them
    const keyChanged = lastKey.current !== key
    lastKey.current = key
    setState((s) => ({ ...s, data: keyChanged ? undefined : s.data, loading: true, error: null }))
    void (async () => {
      const cached = await cacheGet<T>(key)
      if (cancelled) return
      if (cached) setState((s) => ({ ...s, data: s.data ?? cached.data, savedAt: cached.savedAt }))
      try {
        const fresh = await fetcherRef.current()
        if (cancelled) return
        setState({ data: fresh, loading: false, error: null, offline: false, savedAt: null })
        void cachePut(key, fresh)
      } catch (err) {
        if (cancelled) return
        if (isNetworkError(err) && cached) {
          setState({ data: cached.data, loading: false, error: null, offline: true, savedAt: cached.savedAt })
        } else {
          setState((s) => ({ ...s, loading: false, error: friendlyError(err), offline: isNetworkError(err) }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [key, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
