// Screens for students: home, my classes and progress.
import { useState } from 'react'
import { Link } from 'react-router'
import { AnnouncementCard } from '../components/announcements'
import { LessonCard, RequestLessonModal } from '../components/lessons'
import { NotesList, ProgressPath } from '../components/progress'
import { ErrorBox, Icon, Loading, PageHeader, useConfirm, useToast } from '../components/ui'
import { todayOf, useWind, WindArrow } from '../components/wind'
import { compass, schoolToday, windLabel } from '../lib/wind'
import { useMe } from '../context/Session'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, firstName, formatHours, longDay, shortTime, today } from '../lib/format'
import { notifyChange, useLoad } from '../lib/hooks'
import type { Lesson } from '../lib/types'
import { t } from '../i18n'

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
  const todayWind = todayOf(wind.data)
  const latest = (news.data ?? [])[0]

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-heading sm:text-3xl">{t('home.hello', { name: firstName(me.full_name) })}</h1>

      {/* 1. the next lesson, or the way to book one */}
      {lessons.loading && !lessons.data ? <Loading /> : lessons.error ? <ErrorBox message={lessons.error} onRetry={() => void lessons.reload()} />
        : next ? <NextLessonHero lesson={next} />
          : (
            <div className="card px-5 py-7 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand-deep"><Icon name="calendar" className="h-7 w-7" /></div>
              <h2 className="text-lg font-semibold text-heading">{t(pending ? 'home.noConfirmed' : 'home.empty')}</h2>
              {!pending && <p className="mt-1 text-sm text-ink-mute">{t('home.emptyText')}</p>}
              <button type="button" className="btn-primary mt-5 w-full text-lg" onClick={() => setAsking(true)}>
                <Icon name="plus" /> {t(all.length ? 'home.ask' : 'home.emptyCta')}
              </button>
            </div>
          )}

      {pending > 0 && (
        <Link to="/agenda" className="tap flex items-center gap-3 rounded-2xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-ink">
          <span className="pulse grid h-7 min-w-7 place-items-center rounded-full bg-coral px-1.5 text-xs font-bold text-white">{pending}</span>
          <span className="flex-1">{pending === 1 ? t('home.pendingOne') : t('home.pendingMany', { n: pending })}</span>
          <Icon name="chevronRight" className="h-4 w-4" />
        </Link>
      )}

      {/* 2. today's wind in one line */}
      {todayWind && (
        <Link to="/viento" className="tap card flex items-center gap-3 p-3 pr-4" aria-label={`${t('home.windToday')}: ${todayWind.avg} ${t('wind.knots')}, ${windLabel(todayWind.level)}`}>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-tile text-white">
            <span className="text-center leading-none"><span className="block font-display text-lg font-bold tabular">{todayWind.avg}</span><span className="text-[9px] font-semibold text-brand-200">kn</span></span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold uppercase tracking-wide text-ink-mute">{t(todayWind.date === schoolToday() ? 'home.windToday' : 'home.windNext')}</span>
            <span className="block font-semibold text-heading">{windLabel(todayWind.level)} · {compass(todayWind.direction)} <WindArrow deg={todayWind.direction} /></span>
          </span>
          <Icon name="chevronRight" className="h-5 w-5 text-ink-mute" />
        </Link>
      )}

      {/* 3. only the latest notice */}
      {latest && (
        <section aria-label={t('home.news')}>
          <AnnouncementCard a={latest} />
        </section>
      )}

      <RequestLessonModal open={asking} onClose={() => setAsking(false)} />
    </div>
  )
}

export function StudentAgenda() {
  const { data, error, loading, reload } = useMyLessons()
  const [showPast, setShowPast] = useState(false)
  const lessons = data ?? []
  const upcoming = lessons.filter((l) => (l.status === 'confirmed' || l.status === 'requested') && l.lesson_date >= today())
  const past = lessons.filter((l) => !upcoming.includes(l)).reverse()

  return (
    <div>
      <PageHeader title={t('classes.title')} />
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} /> : (
        <div className="space-y-4">
          {upcoming.length === 0
            ? <p className="card px-4 py-8 text-center text-ink-mute">{t('classes.noneUpcoming')}</p>
            : <div className="stagger space-y-3">{upcoming.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" simple actions={<CancelButton lesson={l} />} />)}</div>}
          {past.length > 0 && (
            <>
              <button type="button" className="btn-ghost w-full" aria-expanded={showPast} onClick={() => setShowPast(!showPast)}>
                {showPast ? t('classes.hidePast') : t('classes.showPast', { n: past.length })}
                <Icon name="chevronRight" className={`h-4 w-4 transition-transform ${showPast ? '-rotate-90' : 'rotate-90'}`} />
              </button>
              {showPast && <div className="stagger space-y-3">{past.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" simple />)}</div>}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function StudentProgress() {
  const me = useMe()
  const sid = me.student_id!
  const [allNotes, setAllNotes] = useState(false)
  const { data, error, loading, reload } = useLoad(async () => {
    const [summary, skills, progress, notes, people] = await Promise.all([
      api.myStudentSummary(), api.listSkills(), api.studentSkills(sid), api.lessonNotes(sid), api.instructorDirectory(),
    ])
    return { summary, skills, progress, notes, names: new Map(people.map((p) => [p.id, p.full_name])) }
  }, [sid])

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? t('common.loadFailed')} onRetry={() => void reload()} />
  const s = data.summary
  const notes = allNotes ? data.notes : data.notes.slice(0, 1)
  return (
    <div className="space-y-5">
      <PageHeader title={t('progress.title')} />
      <ProgressPath skills={data.skills} progress={data.progress} studentId={sid} editable={false} compact
        summaryExtra={s ? (s.classes === 1 ? t('progress.lineOne', { hours: formatHours(s.hours) }) : t('progress.line', { hours: formatHours(s.hours), n: s.classes })) : undefined} />
      {data.notes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{t(allNotes ? 'progress.notes' : 'progress.lastNote')}</h2>
          <NotesList notes={notes} instructorNames={data.names} />
          {data.notes.length > 1 && (
            <button type="button" className="mt-3 w-full text-center text-sm font-semibold text-brand-deep underline underline-offset-2" onClick={() => setAllNotes(!allNotes)}>
              {allNotes ? t('progress.fewerNotes') : t('progress.allNotes', { n: data.notes.length })}
            </button>
          )}
        </section>
      )}
    </div>
  )
}
