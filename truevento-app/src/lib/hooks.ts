import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { fetchInstructors, fetchStudents } from './api'
import { onOutboxChange, outboxItems } from './offline'
import { useData } from './useData'
import type { Instructor, NewClassInput, NewStudentInput, Student } from './types'

/** Students from the server plus the ones created on this device that are still waiting to sync. */
export function useStudents() {
  const { session } = useAuth()
  const uid = session?.user.id ?? null
  const q = useData(uid ? `${uid}:students` : null, fetchStudents)
  const pending = usePendingOutbox()
  const data = useMemo(() => {
    if (!q.data) return q.data
    const ids = new Set(q.data.map((s) => s.id))
    const local: Student[] = pending.students
      .filter((s) => !ids.has(s.id))
      .map((s) => ({ ...s, active: true, pending: true }))
    return [...q.data, ...local].sort((a, b) => a.full_name.localeCompare(b.full_name, 'es'))
  }, [q.data, pending.students])
  return { ...q, data }
}

export function useInstructors() {
  const { session } = useAuth()
  const uid = session?.user.id ?? null
  return useData<Instructor[]>(uid ? `${uid}:instructors` : null, fetchInstructors)
}

/** Writes made offline that are not on the server yet. */
export function usePendingOutbox() {
  const [state, setState] = useState<{ students: NewStudentInput[]; classes: NewClassInput[]; errors: number }>({
    students: [], classes: [], errors: 0,
  })
  useEffect(() => onOutboxChange(() => {
    void outboxItems().then((items) => setState({
      students: items.filter((i) => i.kind === 'student').map((i) => i.payload as NewStudentInput),
      classes: items.filter((i) => i.kind === 'class').map((i) => i.payload as NewClassInput),
      errors: items.filter((i) => i.error).length,
    }))
  }), [])
  return state
}
