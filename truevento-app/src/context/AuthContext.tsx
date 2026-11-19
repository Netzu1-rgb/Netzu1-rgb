import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { fetchProfile, fetchSettings, fetchSetupStatus } from '../lib/api'
import { cacheGet, cachePut, clearLocalData, onOutboxChange, syncOutbox, type SyncResult } from '../lib/offline'
import { isNetworkError } from '../lib/errors'
import { autoSignIn, SINGLE_USER } from '../lib/singleUser'
import type { Profile, SchoolSettings } from '../lib/types'

interface AuthState {
  loading: boolean
  session: Session | null
  profile: Profile | null
  settings: SchoolSettings | null
  /** null while unknown (e.g. offline before first login) */
  setupCompleted: boolean | null
  schoolName: string
  isAdmin: boolean
  currency: string
  pendingSync: number
  lastSync: SyncResult | null
  refresh: () => Promise<void>
  syncNow: () => Promise<SyncResult | null>
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [setupCompleted, setSetupCompleted] = useState<boolean | null>(null)
  const [schoolName, setSchoolName] = useState('TRUEVENTO')
  const [pendingSync, setPendingSync] = useState(0)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)

  const userId = session?.user.id ?? null

  const load = useCallback(async (s: Session | null) => {
    try {
      if (!s) {
        setProfile(null)
        setSettings(null)
        try {
          const st = await fetchSetupStatus()
          setSetupCompleted(st.completed)
          setSchoolName(st.school_name)
        } catch {
          setSetupCompleted(null)
        }
        return
      }
      const uid = s.user.id
      try {
        const [p, st] = await Promise.all([fetchProfile(uid), fetchSettings()])
        setProfile(p)
        setSettings(st)
        setSetupCompleted(Boolean(st?.setup_completed_at) || (await fetchSetupStatus()).completed)
        if (st) setSchoolName(st.school_name)
        void cachePut(`${uid}:me`, { profile: p, settings: st })
      } catch (err) {
        if (!isNetworkError(err)) throw err
        // offline: continue with what this device saw last time
        const cached = await cacheGet<{ profile: Profile | null; settings: SchoolSettings | null }>(`${uid}:me`)
        setProfile(cached?.data.profile ?? null)
        setSettings(cached?.data.settings ?? null)
        setSetupCompleted(cached ? Boolean(cached.data.settings?.setup_completed_at) : null)
        if (cached?.data.settings) setSchoolName(cached.data.settings.school_name)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      // single-person mode: sign in silently; SIGNED_IN below then loads the app
      if (!data.session && SINGLE_USER && (await autoSignIn().catch(() => false))) return
      setSession(data.session)
      void load(data.session)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setLoading(true)
        // run outside the auth callback (supabase-js recommends not awaiting inside it)
        setTimeout(() => void load(s), 0)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [load])

  // offline queue: count + automatic sync when the connection comes back
  useEffect(() => onOutboxChange(setPendingSync), [])

  const syncNow = useCallback(async () => {
    if (!userId) return null
    const r = await syncOutbox(userId)
    setLastSync(r)
    return r
  }, [userId])

  useEffect(() => {
    if (!userId || !profile?.role) return
    void syncNow()
    const onOnline = () => void syncNow()
    const onVisible = () => document.visibilityState === 'visible' && void syncNow()
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(() => {
      if (navigator.onLine) void syncNow()
    }, 30_000)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(timer)
    }
  }, [userId, profile?.role, syncNow])

  const refresh = useCallback(() => load(session), [load, session])

  const signOut = useCallback(async () => {
    await clearLocalData(pendingSync > 0)
    await supabase.auth.signOut({ scope: 'local' })
  }, [pendingSync])

  const value = useMemo<AuthState>(() => ({
    loading, session, profile, settings, setupCompleted, schoolName,
    isAdmin: profile?.role === 'admin' && profile.active,
    currency: settings?.currency ?? 'BRL',
    pendingSync, lastSync, refresh, syncNow, signOut,
  }), [loading, session, profile, settings, setupCompleted, schoolName, pendingSync, lastSync, refresh, syncNow, signOut])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth outside AuthProvider')
  return v
}
