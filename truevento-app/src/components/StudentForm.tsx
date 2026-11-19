import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createStudent, updateStudent } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { hasAtMostTwoDecimals, parseDecimal } from '../lib/money'
import { today } from '../lib/dates'
import type { Instructor, Student } from '../lib/types'
import { ErrorBox, Field, Modal, Spinner, Toggle, useToast } from './ui'

interface Props {
  open: boolean
  student: Student | null // null = new
  instructors: Instructor[]
  onClose: () => void
  onSaved: () => void
}

export default function StudentForm({ open, student, instructors, onClose, onSaved }: Props) {
  const { session, isAdmin, profile } = useAuth()
  const toast = useToast()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [start, setStart] = useState(today())
  const [rate, setRate] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [notes, setNotes] = useState('')
  const [active, setActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(student?.full_name ?? '')
    setPhone(student?.phone ?? '')
    setStart(student?.start_date ?? today())
    setRate(student ? String(student.hourly_rate).replace('.', ',') : '')
    setInstructorId(student?.default_instructor_id ?? (isAdmin ? '' : profile?.instructor_id ?? ''))
    setNotes(student?.notes ?? '')
    setActive(student?.active ?? true)
    setErrors({})
    setError(null)
  }, [open, student, isAdmin, profile?.instructor_id])

  async function save() {
    const e: Record<string, string> = {}
    const rateN = parseDecimal(rate)
    if (!name.trim()) e.name = 'Escribí el nombre y apellido.'
    if (rateN === null) e.rate = 'Ingresá el precio por hora.'
    else if (!hasAtMostTwoDecimals(rateN)) e.rate = 'Usá como máximo 2 decimales.'
    if (!start) e.start = 'Elegí la fecha de inicio.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    setError(null)
    try {
      const data = {
        full_name: name.trim(), phone: phone.trim() || null, start_date: start, hourly_rate: rateN!,
        default_instructor_id: instructorId || null, notes: notes.trim() || null,
      }
      if (student) {
        await updateStudent(student.id, { ...data, active })
        toast('Alumno actualizado.')
      } else {
        const r = await createStudent({ id: crypto.randomUUID(), ...data }, session!.user.id)
        toast(r === 'queued' ? 'Sin conexión: el alumno se guardará al volver internet.' : 'Alumno creado.', r === 'queued' ? 'info' : 'success')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={student ? 'Editar alumno' : 'Nuevo alumno'} onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost flex-1" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn-primary flex-1" disabled={busy} onClick={() => void save()}>
          {busy && <Spinner />} Guardar
        </button>
      </>}>
      <div className="space-y-4">
        <Field label="Nombre y apellido" error={errors.name}>
          {(id) => <input id={id} className={errors.name ? 'input-error' : 'input'} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Teléfono (opcional)">
            {(id) => <input id={id} className="input" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
          </Field>
          <Field label="Fecha de inicio" error={errors.start}>
            {(id) => <input id={id} type="date" className={errors.start ? 'input-error' : 'input'} value={start} onChange={(e) => setStart(e.target.value)} />}
          </Field>
        </div>
        <Field label="Precio por hora" error={errors.rate}
          hint={student ? 'Cambiarlo no modifica las clases ya registradas.' : undefined}>
          {(id) => <input id={id} className={errors.rate ? 'input-error' : 'input'} inputMode="decimal" placeholder="0,00" value={rate}
            onChange={(e) => setRate(e.target.value)} />}
        </Field>
        <Field label="Instructor que realizará las clases">
          {(id) => (
            <select id={id} className="input" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
              <option value="">Sin asignar</option>
              {instructors.filter((i) => i.active || i.id === instructorId).map((i) => (
                <option key={i.id} value={i.id}>{i.full_name}{i.kind === 'owner' ? ' (dueño)' : ''}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Observaciones (opcional)">
          {(id) => <textarea id={id} className="input min-h-20" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </Field>
        {student && <Toggle checked={active} onChange={setActive} label={active ? 'Alumno activo' : 'Alumno inactivo (no aparece al registrar clases)'} />}
        {error && <ErrorBox message={error} />}
      </div>
    </Modal>
  )
}
