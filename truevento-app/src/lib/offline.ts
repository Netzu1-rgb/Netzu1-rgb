import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { supabase } from './supabase'
import { isNetworkError } from './errors'
import type { NewClassInput, NewInstructorInput, NewStudentInput } from './types'

// IndexedDB is only an offline helper: a read cache of data already loaded and an
// outbox of writes made without connection. Postgres stays the source of truth.

export type OutboxKind = 'instructor' | 'student' | 'class'

export interface OutboxItem {
  seq?: number
  entityId: string
  kind: OutboxKind
  payload: NewInstructorInput | NewStudentInput | NewClassInput
  userId: string
  createdAt: string
  error?: string
}

interface TrueventoDB extends DBSchema {
  cache: { key: string; value: { key: string; data: unknown; savedAt: string } }
  outbox: { key: number; value: OutboxItem; indexes: { byEntity: string } }
}

let dbPromise: Promise<IDBPDatabase<TrueventoDB>> | null = null

function db() {
  dbPromise ??= openDB<TrueventoDB>('truevento', 1, {
    upgrade(d) {
      d.createObjectStore('cache', { keyPath: 'key' })
      const out = d.createObjectStore('outbox', { keyPath: 'seq', autoIncrement: true })
      out.createIndex('byEntity', 'entityId', { unique: true })
    },
  })
  return dbPromise
}

// ------------------------------------------------------------------ read cache

export async function cacheGet<T>(key: string): Promise<{ data: T; savedAt: string } | null> {
  try {
    const row = await (await db()).get('cache', key)
    return row ? { data: row.data as T, savedAt: row.savedAt } : null
  } catch {
    return null
  }
}

export async function cachePut(key: string, data: unknown): Promise<void> {
  try {
    await (await db()).put('cache', { key, data, savedAt: new Date().toISOString() })
  } catch {
    /* storage full or unavailable: the app still works online */
  }
}

/** Removes everything stored on this device (on logout). Pending writes are kept only if asked. */
export async function clearLocalData(keepOutbox = false): Promise<void> {
  try {
    const d = await db()
    await d.clear('cache')
    if (!keepOutbox) await d.clear('outbox')
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------------ outbox

type Listener = (count: number) => void
const listeners = new Set<Listener>()

export function onOutboxChange(fn: Listener): () => void {
  listeners.add(fn)
  void outboxCount().then(fn)
  return () => listeners.delete(fn)
}

async function notify() {
  const n = await outboxCount()
  listeners.forEach((fn) => fn(n))
}

export async function outboxCount(): Promise<number> {
  try {
    return await (await db()).count('outbox')
  } catch {
    return 0
  }
}

export async function outboxItems(): Promise<OutboxItem[]> {
  try {
    return await (await db()).getAll('outbox')
  } catch {
    return []
  }
}

export async function enqueue(kind: OutboxKind, payload: NewInstructorInput | NewStudentInput | NewClassInput, userId: string) {
  const d = await db()
  const existing = await d.getFromIndex('outbox', 'byEntity', payload.id)
  if (!existing) {
    await d.add('outbox', { entityId: payload.id, kind, payload, userId, createdAt: new Date().toISOString() })
  }
  await notify()
}

export async function discardOutboxItem(seq: number) {
  await (await db()).delete('outbox', seq)
  await notify()
}

async function send(item: OutboxItem): Promise<void> {
  const { error } = item.kind === 'instructor'
    ? await supabase.from('instructors').insert(item.payload as NewInstructorInput)
    : item.kind === 'student'
      ? await supabase.from('students').insert(item.payload as NewStudentInput)
      : await supabase.from('classes').insert(item.payload as NewClassInput)
  // 23505 = the id already exists: it was sent before (e.g. the answer got lost)
  if (error && error.code !== '23505') throw error
}

let syncing: Promise<SyncResult> | null = null

export interface SyncResult {
  sent: number
  failed: number
  offline: boolean
}

/**
 * Sends pending writes in the order they were made. Each item has a device-made id,
 * so retries never create duplicates. Stops at the first connection error; items the
 * server rejects keep their error so the user can fix or discard them.
 */
export function syncOutbox(userId: string): Promise<SyncResult> {
  syncing ??= (async () => {
    const result: SyncResult = { sent: 0, failed: 0, offline: false }
    try {
      const d = await db()
      const items = (await d.getAll('outbox')).filter((i) => i.userId === userId)
      const failedStudents = new Set<string>()
      for (const item of items) {
        const c = item.payload as NewClassInput
        if (item.kind === 'class' && (failedStudents.has(c.student_id) || failedStudents.has(c.instructor_id))) {
          result.failed++
          continue
        }
        try {
          await send(item)
          await d.delete('outbox', item.seq!)
          result.sent++
        } catch (err) {
          if (isNetworkError(err)) {
            result.offline = true
            break
          }
          const message = (err as { message?: string }).message ?? String(err)
          await d.put('outbox', { ...item, error: message })
          if (item.kind !== 'class') failedStudents.add(item.entityId) // its classes cannot go either
          result.failed++
        }
      }
    } finally {
      await notify()
      syncing = null
    }
    return result
  })()
  return syncing
}
