import { useState } from 'react'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { timeAgo } from '../lib/format'
import type { LessonNote, Skill, SkillStatus, StudentSkill } from '../lib/types'
import { levelName } from '../lib/types'
import { Icon, useToast } from './ui'

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
      <div className="card p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-heading">Camino de aprendizaje</span>
          <span className="tabular text-sm font-semibold text-ink-mute">{doneTotal} de {skills.length}</span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0}
          aria-valuemax={skills.length} aria-valuenow={doneTotal} aria-label="Habilidades logradas">
          <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${skills.length ? (doneTotal / skills.length) * 100 : 0}%` }} />
        </div>
        {editable && <p className="mt-3 text-sm text-ink-mute">Tocá una habilidad para marcarla: practicando → logrado → sin marcar.</p>}
      </div>

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
                <div className="text-xs text-ink-mute">{complete ? 'Nivel completo' : isCurrent ? `En curso · ${done} de ${items.length}` : `${done} de ${items.length}`}</div>
              </div>
            </div>
            <ul className="divide-y divide-line">
              {items.map((s) => {
                const st = status.get(s.id) ?? null
                const content = (
                  <>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${st === 'done' ? 'border-violet bg-violet text-white' : st === 'learning' ? 'border-brand text-brand' : 'border-line-strong'}`}>
                      {st === 'done' ? <Icon name="check" className="h-4 w-4" strokeWidth={3} /> : st === 'learning' ? <span className="h-2.5 w-2.5 rounded-full bg-brand" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block font-medium ${st ? 'text-heading' : 'text-ink-soft'}`}>{s.name}</span>
                      {s.description && <span className="block text-sm text-ink-mute">{s.description}</span>}
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${st === 'done' ? 'text-violet-deep' : st === 'learning' ? 'text-brand-deep' : 'text-ink-mute'}`}>
                      {st === 'done' ? 'Logrado' : st === 'learning' ? 'Practicando' : ''}
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

export function NotesList({ notes, instructorNames }: { notes: LessonNote[]; instructorNames: Map<string, string> }) {
  if (!notes.length) {
    return <p className="card px-4 py-6 text-center text-sm text-ink-mute">Todavía no hay comentarios del instructor.</p>
  }
  return (
    <ol className="space-y-3">
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
