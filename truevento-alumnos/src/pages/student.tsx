// Screens for students: home, my classes and progress.
import { useState } from 'react'
import { Link } from 'react-router'
import { AnnouncementCard } from '../components/announcements'
import { LessonCard, RequestLessonModal } from '../components/lessons'
import { NotesList, ProgressPath } from '../components/progress'
import { ErrorBox, Icon, Loading, PageHeader, Stat, useConfirm, useToast } from '../components/ui'
import { todayOf, useWind, WindSummary } from '../components/wind'
import { schoolToday } from '../lib/wind'
import { useMe } from '../context/Session'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, firstName, formatHours, longDay, shortTime, today } from '../lib/format'
import { notifyChange, useLoad } from '../lib/hooks'
import type { Lesson } from '../lib/types'
import { locale, t } from '../i18n'

function useMyLessons(daysBack = 90) {
  return useLoad(() => api.agenda(addDays(today(), -daysBack), addDays(today(), 365)))
}

function CancelButton({ lesson }: { lesson: Lesson }) {
  const confirm = useConfirm()
  const toast = useToast()
  return (
    <button type="button" className="btn-ghost min-h-10 px-4 py-2 text-sm" onClick={async () => {
      if (!(await confirm({ title: t('classes.cancelTitle'), message: t('classes.cancelMsg', { day: longDay(lesson.lesson_date), time: shortTime(lesson.start_time) }), confirmLabel: t('classes.cancelYes'), danger: true }))) return
      try {
        await api.cancelLesson(lesson.id, '')
        notifyChange()
        toast(t('classes.cancelled'))
      } catch (err) {
        toast(friendlyError(err), 'error')
      }
    }}>
      {t('classes.cancel')}
    </button>
  )
}

/** How many days until a class: "today", "tomorrow" or "N days to go". */
function countdown(date: string): string {
  const days = Math.round((new Date(date + 'T12:00').getTime() - new Date(today() + 'T12:00').getTime()) / 86400000)
  return days <= 0 ? t('home.countToday') : days === 1 ? t('home.countTomorrow') : t('home.countDays', { n: days })
}

function NextLessonHero({ lesson }: { lesson: Lesson }) {
  return (
    <Link to="/agenda" className="tap relative block overflow-hidden rounded-3xl bg-tile p-5 text-white ring-1 ring-white/10 shadow-[0_18px_40px_-20px_rgba(109,75,233,0.8)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet/40 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-32 w-32 rounded-full bg-pink/25 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-white/15 text-white">{countdown(lesson.lesson_date)}</span>
          <span className="badge bg-white text-night-900"><Icon name="check" className="h-3.5 w-3.5" /> {t('status.confirmed')}</span>
        </div>
        <div className="mt-3 font-display text-4xl font-bold tabular">{shortTime(lesson.start_time)}</div>
        <div className="mt-1 text-brand-100">{longDay(lesson.lesson_date, true)} · {formatHours(lesson.hours)}</div>
        {lesson.instructor_name && <div className="mt-3 text-sm text-brand-200">{t('lesson.with')} <b className="text-white">{lesson.instructor_name}</b></div>}
        {lesson.staff_note && <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-brand-100">{lesson.staff_note}</p>}
      </div>
      <div className="brand-gradient absolute inset-x-0 bottom-0 h-1" aria-hidden="true" />
    </Link>
  )
}

const SHORTCUTS: { to: string; icon: string; label: 'nav.myClasses' | 'nav.progress' | 'nav.wind'; tone: string }[] = [
  { to: '/agenda', icon: 'calendar', label: 'nav.myClasses', tone: 'bg-brand-soft text-brand-deep' },
  { to: '/progreso', icon: 'star', label: 'nav.progress', tone: 'bg-violet-soft text-violet-deep' },
  { to: '/viento', icon: 'wind', label: 'nav.wind', tone: 'bg-coral-soft text-coral-ink' },
]

export function StudentHome() {
  const me = useMe()
  const lessons = useMyLessons(365)
  const news = useLoad(api.listAnnouncements)
  const wind = useWind()
  const [asking, setAsking] = useState(false)

  const all = lessons.data ?? []
  const upcoming = all.filter((l) => (l.status === 'confirmed' || l.status === 'requested') && l.lesson_date >= today())
  const next = upcoming.find((l) => l.status === 'confirmed')
  const pending = upcoming.filter((l) => l.status === 'requested').length
  // new students (no class yet) get a short guide
  const isNew = lessons.data !== null && all.every((l) => l.status === 'cancelled')
  const todayWind = todayOf(wind.data)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading sm:text-3xl">{t('home.hello', { name: firstName(me.full_name) })}</h1>
        <p className="text-ink-mute">{t('home.ready')}</p>
      </div>

      <section aria-labelledby="next-h" className="space-y-3">
        <h2 id="next-h" className="text-sm font-bold uppercase tracking-wide text-ink-mute">{t('home.next')}</h2>
        {lessons.loading && !lessons.data ? <Loading /> : lessons.error ? <ErrorBox message={lessons.error} onRetry={() => void lessons.reload()} />
          : next ? <NextLessonHero lesson={next} />
            : <div className="card p-5 text-center text-ink-soft">{t('home.noConfirmed')}</div>}
        {pending > 0 && (
          <Link to="/agenda" className="tap flex items-center gap-2 rounded-xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-ink">
            <span className="pulse grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-xs font-bold text-white">{pending}</span>
            {pending === 1 ? t('home.pendingOne') : t('home.pendingMany', { n: pending })}
            <Icon name="chevronRight" className="ml-auto h-4 w-4" />
          </Link>
        )}
        <button type="button" className="btn-primary w-full text-lg" onClick={() => setAsking(true)}>
          <Icon name="plus" /> {t('home.ask')}
        </button>
      </section>

      {isNew && (
        <section className="card p-5" aria-labelledby="steps-h">
          <h2 id="steps-h" className="mb-3 font-semibold text-heading">{t('steps.title')}</h2>
          <ol className="stagger space-y-3">
            {(['steps.1', 'steps.2', 'steps.3'] as const).map((k, i) => (
              <li key={k} className="flex items-start gap-3">
                <span className="brand-gradient grid h-8 w-8 shrink-0 place-items-center rounded-full font-display font-bold text-white">{i + 1}</span>
                <span className="pt-1 text-ink-soft">{t(k)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <nav aria-label={t('home.shortcuts')} className="stagger grid grid-cols-3 gap-3">
        {SHORTCUTS.map((sc) => (
          <Link key={sc.to} to={sc.to} className="tap card flex flex-col items-center gap-2 px-2 py-4 text-center">
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${sc.tone}`}><Icon name={sc.icon} className="h-6 w-6" /></span>
            <span className="text-sm font-semibold text-heading">{t(sc.label)}</span>
          </Link>
        ))}
      </nav>

      {todayWind && (
        <section aria-labelledby="wind-h">
          <h2 id="wind-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t(todayWind.date === schoolToday() ? 'home.windToday' : 'home.windNext')}</h2>
          <Link to="/viento" className="tap card block p-4">
            <WindSummary day={todayWind} />
            <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-deep">{t('home.nextDays')} <Icon name="chevronRight" className="h-4 w-4" /></span>
          </Link>
        </section>
      )}

      <section aria-labelledby="news-h">
        <h2 id="news-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t('home.news')}</h2>
        {news.error ? <ErrorBox message={news.error} />
          : (news.data ?? []).length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">{t('home.noNews')}</p>
            : <div className="stagger space-y-3">{news.data!.slice(0, 5).map((a) => <AnnouncementCard key={a.id} a={a} />)}</div>}
      </section>

      <RequestLessonModal open={asking} onClose={() => setAsking(false)} />
    </div>
  )
}

export function StudentAgenda() {
  const { data, error, loading, reload } = useMyLessons()
  const [asking, setAsking] = useState(false)
  const lessons = data ?? []
  const upcoming = lessons.filter((l) => (l.status === 'confirmed' || l.status === 'requested') && l.lesson_date >= today())
  const past = lessons.filter((l) => !upcoming.includes(l)).reverse()

  return (
    <div>
      <PageHeader title={t('classes.title')} action={<button type="button" className="btn-primary" onClick={() => setAsking(true)}><Icon name="plus" /> {t('classes.ask')}</button>} />
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} /> : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t('classes.upcoming')}</h2>
            {upcoming.length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">{t('classes.noneUpcoming')}</p> : (
              <div className="stagger space-y-3">
                {upcoming.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" actions={<CancelButton lesson={l} />} />)}
              </div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t('classes.past')}</h2>
              <div className="stagger space-y-3">{past.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" />)}</div>
            </section>
          )}
        </div>
      )}
      <RequestLessonModal open={asking} onClose={() => setAsking(false)} />
    </div>
  )
}

export function StudentProgress() {
  const me = useMe()
  const sid = me.student_id!
  const { data, error, loading, reload } = useLoad(async () => {
    const [summary, skills, progress, notes, people] = await Promise.all([
      api.myStudentSummary(), api.listSkills(), api.studentSkills(sid), api.lessonNotes(sid), api.instructorDirectory(),
    ])
    return { summary, skills, progress, notes, names: new Map(people.map((p) => [p.id, p.full_name])) }
  }, [sid])

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? t('common.loadFailed')} onRetry={() => void reload()} />
  const s = data.summary
  return (
    <div className="space-y-6">
      <PageHeader title={t('progress.title')} subtitle={s ? t('progress.since', { date: new Date(s.start_date + 'T12:00').toLocaleDateString(locale(), { month: 'long', year: 'numeric' }) }) : undefined} />
      {s && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label={t('progress.hours')} value={formatHours(s.hours)} tone="dark" />
          <Stat label={t('progress.classes')} value={s.classes} tone="sky" />
        </div>
      )}
      <ProgressPath skills={data.skills} progress={data.progress} studentId={sid} editable={false} />
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t('progress.notes')}</h2>
        <NotesList notes={data.notes} instructorNames={data.names} />
      </section>
    </div>
  )
}
