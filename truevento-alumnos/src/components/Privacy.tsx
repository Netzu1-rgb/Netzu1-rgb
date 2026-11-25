import { t } from '../i18n'
import { Modal } from './ui'

/** The school's WhatsApp, for help with accounts. */
export const SCHOOL_WHATSAPP = (import.meta.env.VITE_SCHOOL_WHATSAPP as string | undefined) ?? '+54 9 221 545-1174'
export const schoolWhatsAppLink = () => `https://wa.me/${SCHOOL_WHATSAPP.replace(/\D/g, '')}`

export function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title={t('privacy.title')} onClose={onClose}
      footer={<button type="button" className="btn-primary w-full" onClick={onClose}>{t('common.close')}</button>}>
      <p className="leading-relaxed text-ink-soft">{t('privacy.body')}</p>
    </Modal>
  )
}
