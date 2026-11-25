import { timeAgo } from '../lib/format'
import type { Announcement } from '../lib/types'
import { Icon } from './ui'
import { t } from '../i18n'

export function AnnouncementCard({ a, onDelete, studentName }: {
  a: Announcement
  onDelete?: () => void
  studentName?: string | null
}) {
  return (
    <article className="card flex gap-3 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-soft text-violet-deep">
        <Icon name="megaphone" className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-heading">{a.title}</h3>
        {a.body && <p className="mt-0.5 whitespace-pre-line text-sm text-ink-soft">{a.body}</p>}
        <p className="mt-1.5 text-xs text-ink-mute">
          {a.author_name ?? t('news.school')} · {timeAgo(a.created_at)}
          {a.student_id ? <> · <b className="font-semibold">{studentName ? t('news.for', { name: studentName }) : t('news.personal')}</b></> : onDelete ? ` · ${t('news.forAll')}` : ''}
        </p>
      </div>
      {onDelete && (
        <button type="button" onClick={onDelete} aria-label={t('news.delete', { title: a.title })}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-mute hover:bg-surface-2 hover:text-coral">
          <Icon name="trash" className="h-5 w-5" />
        </button>
      )}
    </article>
  )
}
