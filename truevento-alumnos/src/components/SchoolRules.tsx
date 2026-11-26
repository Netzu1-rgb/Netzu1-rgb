import { t } from '../i18n'
import type { Key } from '../i18n/messages'
import { Modal } from './ui'

const RULES = [1, 2, 3, 4, 5, 6, 7].map((n) => `rules.${n}` as Key)

/** The school's rules for taking lessons (arrival, wind, cancellations, course length). */
export function SchoolRules() {
  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t('rules.intro')}</p>
      <ol className="space-y-3">
        {RULES.map((k, i) => (
          <li key={k} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-deep">{i + 1}</span>
            <p className="pt-0.5 leading-relaxed text-ink">{t(k)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function SchoolRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} title={t('rules.title')} onClose={onClose}
      footer={<button type="button" className="btn-primary w-full" onClick={onClose}>{t('rules.understood')}</button>}>
      <SchoolRules />
    </Modal>
  )
}
