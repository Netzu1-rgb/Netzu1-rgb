import { useEffect, useState } from 'react'
import { WA_PREVIEW_EVENT } from '../lib/whatsapp'
import { Icon, Modal } from './ui'


/** Demo only: what WhatsApp would open with, instead of leaving the page. */
export function WhatsAppPreview() {
  const [msg, setMsg] = useState<{ phone: string; text: string } | null>(null)
  useEffect(() => {
    const on = (e: Event) => setMsg((e as CustomEvent<{ phone: string; text: string }>).detail)
    window.addEventListener(WA_PREVIEW_EVENT, on)
    return () => window.removeEventListener(WA_PREVIEW_EVENT, on)
  }, [])
  if (!msg) return null
  return (
    <Modal open title={'Vista previa de WhatsApp'} onClose={() => setMsg(null)}
      footer={<button type="button" className="btn-ghost w-full" onClick={() => setMsg(null)}>{'Cerrar'}</button>}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-heading">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1fa855] text-white"><Icon name="whatsapp" className="h-4 w-4" /></span>
          {'Para: +' + msg.phone}
        </div>
        {msg.text && (
          <div className="rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-4 py-3 text-[15px] leading-relaxed text-[#111b21] shadow-sm">{msg.text}</div>
        )}
        <p className="text-sm text-ink-mute">{'En el celular se abre WhatsApp con este mensaje listo para enviar.'}</p>
      </div>
    </Modal>
  )
}
