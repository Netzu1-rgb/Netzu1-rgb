import { useState } from 'react'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { timeAgo } from '../lib/format'
import type { LessonNote, Skill, SkillStatus, StudentSkill } from '../lib/types'
import { levelName } from '../lib/types'
import { Icon, useToast } from './ui'
import { skillText, t } from '../i18n'

/** Learning path by level. Staff can tap a skill to change it; students only see it. */
export function ProgressPath({ skills, progress, studentId, editable, onChanged }: {
  skills: Skill[]
  progress: StudentSkill[]
  studentId: string
  editable: boolean
  onChanged?: () => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const status = new Map(progress.map((p) => [p.skill_id, p.status]))
  const levels = [...new Set(skills.map((s) => s.level))]
  const doneTotal = skills.filter((s) => status.get(s.id) === 'done').length
  // the level being worked on: the first one not complete
  const currentLevel = levels.find((l) => skills.some((s) => s.level === l && status.get(s.id) !== 'done')) ?? levels.at(-1)

  async function cycle(skill: Skill) {
    const now = status.get(skill.id) ?? null
    const next: SkillStatus | null = now === null ? 'learning' : now === 'learning' ? 'done' : null
    setBusy(skill.id)
    try {
      await api.setStudentSkill(studentId, skill.id, next)
      onChanged?.()
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <ProgressSummary done={doneTotal} total={skills.length}
        next={skills.find((s) => status.get(s.id) !== 'done') ?? null} editable={editable} />

      {levels.map((l) => {
        const items = skills.filter((s) => s.level === l)
        const done = items.filter((s) => status.get(s.id) === 'done').length
        const complete = done === items.length
        const isCurrent = l === currentLevel && !complete
        return (
          <section key={l} className={`card overflow-hidden ${isCurrent ? 'ring-2 ring-brand/40' : ''}`}>
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display font-bold ${complete ? 'bg-violet text-white' : isCurrent ? 'bg-brand-soft text-brand-deep' : 'bg-surface-2 text-ink-mute'}`}>
                {complete ? <Icon name="check" className="h-5 w-5" /> : l}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-heading">{levelName(l)}</h3>
                <div className="text-xs text-ink-mute">{complete ? t('progress.levelDone') : isCurrent ? t('progress.inProgress', { done, total: items.length }) : t('progress.count', { done, total: items.length })}</div>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {items.map((s) => {
                const st = status.get(s.id) ?? null
                const [name, description] = skillText(s.name, s.description)
                const content = (
                  <>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${st === 'done' ? 'border-violet bg-violet text-white' : st === 'learning' ? 'border-brand text-brand' : 'border-line-strong'}`}>
                      {st === 'done' ? <span className="pop grid place-items-center"><Icon name="check" className="h-4 w-4" strokeWidth={3} /></span> : st === 'learning' ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-medium ${st ? 'text-heading' : 'text-ink-soft'}`}>{name}</span>
                      {description && <span className="block text-sm text-ink-mute">{description}</span>}
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${st === 'done' ? 'text-violet-deep' : st === 'learning' ? 'text-brand-deep' : 'text-ink-mute'}`}>
                      {st === 'done' ? t('progress.done') : st === 'learning' ? t('progress.learning') : ''}
                    </span>
                  </>
                )
                return (
                  <li key={s.id}>
                    {editable ? (
                      <button type="button" disabled={busy === s.id} onClick={() => void cycle(s)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2 disabled:opacity-50">
                        {content}
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-3">{content}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** Ring with the share of the learning path achieved and the next skill to work on. */
function ProgressSummary({ done, total, next, editable }: { done: number; total: number; next: Skill | null; editable: boolean }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  const r = 42
  const len = 2 * Math.PI * r
  const nextName = next ? skillText(next.name, next.description)[0] : null
  return (
    <div className="card overflow-hidden p-5">
      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label={t('progress.achieved')}>
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <defs>
              <linearGradient id="tv-prog" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#5278ec" /><stop offset=".5" stopColor="#7d4bec" /><stop offset="1" stopColor="#e64e86" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
            <circle cx="50" cy="50" r={r} fill="none" stroke="url(#tv-prog)" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={len} strokeDashoffset={len * (1 - pct / 100)} className="ring-draw"
              style={{ ['--tv-ring-from' as string]: len }} />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-display text-2xl font-bold tabular text-heading">{pct}%</div>
              <div className="text-[11px] font-semibold text-ink-mute">{t('progress.count', { done, total })}</div>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-heading">{t('progress.path')}</div>
          {nextName ? (
            <div className="mt-2 rounded-xl bg-brand-soft px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-deep"><Icon name="target" className="h-4 w-4" /> {t('progress.nextGoal')}</div>
              <div className="mt-0.5 font-semibold text-heading">{nextName}</div>
            </div>
          ) : total > 0 ? <p className="mt-2 font-semibold text-violet-deep">{t('progress.allDone')}</p> : null}
        </div>
      </div>
      {editable && <p className="mt-4 text-sm text-ink-mute">{t('progress.tapHint')}</p>}
    </div>
  )
}

export function NotesList({ notes, instructorNames }: { notes: LessonNote[]; instructorNames: Map<string, string> }) {
  if (!notes.length) {
    return <p className="card px-4 py-6 text-center text-sm text-ink-mute">{t('progress.noNotes')}</p>
  }
  return (
    <ol className="stagger space-y-3">
      {notes.map((n) => (
        <li key={n.id} className="card p-4">
          <p className="whitespace-pre-line text-ink">{n.body}</p>
          <p className="mt-2 text-xs font-medium text-ink-mute">
            {n.instructor_id && instructorNames.get(n.instructor_id) ? `${instructorNames.get(n.instructor_id)} · ` : ''}{timeAgo(n.created_at)}
          </p>
        </li>
      ))}
    </ol>
  )
}
