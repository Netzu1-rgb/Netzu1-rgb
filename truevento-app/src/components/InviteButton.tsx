import { useState } from 'react'
import { createInvite } from '../lib/api'
import { friendlyError } from '../lib/errors'
import { Icon, Modal, Spinner, useToast } from './ui'

export const STUDENTS_APP_URL = ((import.meta.env.VITE_STUDENTS_APP_URL as string | undefined) ?? 'https://app.truevento.com').replace(/\/$/, '')

/** Invites a student or instructor to the students app: makes a code and sends it by WhatsApp. */
export default function InviteButton({ kind, targetId, name, phone, className = 'btn-ghost' }: {
  kind: 'student' | 'instructor'
  targetId: string
  name: string
  phone?: string | null
  className?: string
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)

  async function open() {
    setBusy(true)
    try {
      setCode(await createInvite(kind, targetId))
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const first = name.trim().split(/\s+/)[0]
  const link = code ? `${STUDENTS_APP_URL}/?codigo=${code}` : ''
  const text = kind === 'student'
    ? `¡Hola ${first}! Te invitamos a la app de TRUEVENTO: vas a ver tus clases, pedir horarios, seguir tu progreso y el pronóstico del viento.\n\n1. Entrá acá: ${link}\n2. Tu código: ${code}\n3. Elegí un usuario y una contraseña.\n\n¡Nos vemos en el agua! 🪁`
    : `¡Hola ${first}! Esta es la app de TRUEVENTO para instructores: agenda, pedidos de clases y progreso de los alumnos.\n\n1. Entrá acá: ${link}\n2. Tu código: ${code}\n3. Elegí un usuario y una contraseña.`
  const digits = (phone ?? '').replace(/\D/g, '')
  const wa = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={() => void open()}>
        {busy ? <Spinner /> : <Icon name="phone" />} Invitar a la app
      </button>
      <Modal open={code !== null} title={`Invitar a ${first}`} onClose={() => setCode(null)}
        footer={<>
          <button type="button" className="btn-ghost flex-1" onClick={async () => {
            try {
              await navigator.clipboard.writeText(text)
              toast('Mensaje copiado')
            } catch {
              toast('No se pudo copiar: mandalo por WhatsApp', 'error')
            }
          }}>Copiar</button>
          <a className="btn-primary flex-[2]" href={wa} target="_blank" rel="noreferrer">Enviar por WhatsApp</a>
        </>}>
        <div className="space-y-4">
          <p className="text-ink-soft">
            {kind === 'student'
              ? `Con este código, ${first} crea su cuenta en la app de alumnos. Ve sus clases y su progreso, nunca los precios ni los datos de otros alumnos.`
              : `Con este código, ${first} entra a la app de alumnos como instructor: agenda, pedidos y progreso de los alumnos.`}
          </p>
          <div className="rounded-2xl bg-tile px-4 py-5 text-center text-white">
            <div className="text-xs font-semibold uppercase tracking-widest text-brand-200">Código</div>
            <div className="tabular mt-1 font-display text-3xl font-bold tracking-[0.15em]">{code}</div>
            <div className="mt-1 text-xs text-brand-200">Vale 30 días y se usa una sola vez</div>
          </div>
          <p className="break-all rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-soft">{link}</p>
          {!digits && <p className="text-sm text-ink-mute">No hay teléfono cargado: WhatsApp te va a pedir el contacto.</p>}
        </div>
      </Modal>
    </>
  )
}
