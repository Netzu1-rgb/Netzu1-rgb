import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import * as api from '../lib/api'
import type { Me } from '../lib/types'

type Status = 'loading' | 'signedOut' | 'noRole' | 'ready' | 'error'

interface SessionValue {
  status: Status
  me: Me | null
  userId: string | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [me, setMe] = useState<Me | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const current = useRef<string | null | undefined>(undefined)

  const load = useCallback(async (uid: string | null) => {
    current.current = uid
    setUserId(uid)
    if (!uid) {
      setMe(null)
      setStatus('signedOut')
      return
    }
    try {
      const m = await api.getMe()
      setMe(m)
      setStatus(m?.role ? 'ready' : 'noRole')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void api.currentUserId().then(load)
    return api.onAuthChange((uid) => {
      // token refreshes fire too: only reload when the user changes
      if (current.current !== undefined && current.current !== uid) void load(uid)
    })
  }, [load])

  const value: SessionValue = {
    status,
    me,
    userId,
    refresh: async () => load(await api.currentUserId()),
    signOut: async () => {
      await api.signOut()
      await load(null)
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession(): SessionValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSession outside SessionProvider')
  return v
}

/** Shortcut for screens that only render once signed in with a role. */
export function useMe(): Me & { isStaff: boolean; isAdmin: boolean; user_id: string | null } {
  const { me, userId } = useSession()
  if (!me?.role) throw new Error('useMe without a role')
  return { ...me, user_id: userId, isStaff: me.role !== 'student', isAdmin: me.role === 'admin' }
}
