import { useEffect, useState } from 'react'
import { disablePush, enablePush, getPushState, resyncPush, testNotification, type PushState } from '../lib/push'
import { friendlyError } from '../lib/errors'
import { Icon, useToast } from './ui'

/** Turns notifications for new requests on or off on this device. */
export function NotificationsCard({ compact = false }: { compact?: boolean }) {
  const toast = useToast()
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void getPushState().then((s) => { if (alive) setState(s) })
    void resyncPush('gestion', 'es')
    return () => { alive = false }
  }, [])

  if (state === null || state === 'unsupported') return null
  // on the requests page, show the card only while it can still be turned on
  if (compact && state === 'on') return null

  async function turnOn() {
    setBusy(true)
    try {
      const s = await enablePush('gestion', 'es')
      setState(s)
      if (s === 'on') {
        toast('Notificaciones activadas')
        await testNotification('Notificaciones activadas', 'Te vamos a avisar cuando un alumno pida una clase.')
      }
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally { setBusy(false) }
  }
  async function turnOff() {
    setBusy(true)
    try { setState(await disablePush()); toast('Notificaciones desactivadas') }
    catch (err) { toast(friendlyError(err), 'error') }
    finally { setBusy(false) }
  }

  return (
    <section className={`card mb-5 p-5 ${compact ? 'border-brand/40' : ''}`} aria-labelledby="notif-title">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/15 text-brand-deep"><Icon name="bell" /></span>
        <div className="min-w-0 flex-1">
          <h2 id="notif-title" className="text-lg font-semibold text-heading">Notificaciones</h2>
          {state === 'on' && <p className="mt-1 text-sm text-ink-soft">Activadas en este dispositivo: te avisamos de cada solicitud nueva y de las cancelaciones.</p>}
          {state === 'off' && <p className="mt-1 text-sm text-ink-soft">Recibí un aviso en este dispositivo cada vez que un alumno pida una clase, aunque la app esté cerrada.</p>}
          {state === 'denied' && <p className="mt-1 text-sm text-ink-soft">Las notificaciones están bloqueadas para esta app. Activalas en los ajustes del navegador o del celular (Notificaciones → TRUEVENTO) y volvé a abrir la app.</p>}
          {state === 'install-ios' && <p className="mt-1 text-sm text-ink-soft">En iPhone primero instalá la app: en <b>Safari</b> tocá <b>Compartir</b> → <b>Agregar a pantalla de inicio</b>, abrila desde el ícono y activá las notificaciones acá.</p>}
        </div>
      </div>
      {state === 'off' && (
        <button type="button" className="btn-primary mt-4 w-full" disabled={busy} onClick={() => void turnOn()}>
          <Icon name="bell" /> Activar notificaciones
        </button>
      )}
      {state === 'on' && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-ghost" disabled={busy} onClick={() => void testNotification('Prueba de TRUEVENTO', 'Así te van a llegar los avisos.')}>Probar</button>
          <button type="button" className="btn-ghost text-coral" disabled={busy} onClick={() => void turnOff()}>Desactivar</button>
        </div>
      )}
    </section>
  )
}
