// Screens for students: home, my classes and progress.
import { useState } from 'react'
import { Link } from 'react-router'
import { AnnouncementCard } from '../components/announcements'
import { LessonCard, RequestLessonModal } from '../components/lessons'
import { NotesList, ProgressPath } from '../components/progress'
import { ErrorBox, Icon, Loading, PageHeader, Stat, useConfirm, useToast } from '../components/ui'
import { useWind, WindSummary } from '../components/wind'
import { useMe } from '../context/Session'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, firstName, formatHours, longDay, shortTime, today } from '../lib/format'
import { notifyChange, useLoad } from '../lib/hooks'
import type { Lesson } from '../lib/types'

function useMyLessons(daysBack = 90) {
  return useLoad(() => api.agenda(addDays(today(), -daysBack), addDays(today(), 365)))
}

function CancelButton({ lesson }: { lesson: Lesson }) {
  const confirm = useConfirm()
  const toast = useToast()
  return (
    <button type="button" className="btn-ghost min-h-10 px-4 py-2 text-sm" onClick={async () => {
      if (!(await confirm({ title: 'Cancelar la clase', message: `¿Cancelás la clase del ${longDay(lesson.lesson_date)} a las ${shortTime(lesson.start_time)}?`, confirmLabel: 'Sí, cancelar', danger: true }))) return
      try {
        await api.cancelLesson(lesson.id, '')
        notifyChange()
        toast('Clase cancelada')
      } catch (err) {
        toast(friendlyError(err), 'error')
      }
    }}>
      Cancelar clase
    </button>
  )
}

export function StudentHome() {
  const me = useMe()
  const lessons = useMyLessons(0)
  const news = useLoad(api.listAnnouncements)
  const wind = useWind()
  const [asking, setAsking] = useState(false)

  const upcoming = (lessons.data ?? []).filter((l) => l.status === 'confirmed' || l.status === 'requested')
  const next = upcoming.find((l) => l.status === 'confirmed')
  const pending = upcoming.filter((l) => l.status === 'requested').length
  const todayWind = wind.data?.days.find((d) => d.date === today()) ?? wind.data?.days[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-heading">¡Hola, {firstName(me.full_name)}!</h1>
        <p className="text-ink-mute">¿Listo para navegar?</p>
      </div>

      <section aria-labelledby="next-h">
        <h2 id="next-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Tu próxima clase</h2>
        {lessons.loading && !lessons.data ? <Loading /> : lessons.error ? <ErrorBox message={lessons.error} onRetry={() => void lessons.reload()} />
          : next ? <LessonCard lesson={next} show="instructor" />
            : <div className="card p-5 text-center text-ink-soft">No tenés clases confirmadas.</div>}
        {pending > 0 && (
          <Link to="/agenda" className="mt-2 flex items-center gap-2 rounded-xl bg-coral-soft px-4 py-3 text-sm font-medium text-coral-ink">
            <Icon name="clock" className="h-4 w-4" /> {pending === 1 ? '1 pedido esperando' : `${pending} pedidos esperando`} confirmación de la escuela
          </Link>
        )}
        <button type="button" className="btn-primary mt-3 w-full text-lg" onClick={() => setAsking(true)}>
          <Icon name="plus" /> Pedir una clase
        </button>
      </section>

      {todayWind && (
        <section aria-labelledby="wind-h">
          <h2 id="wind-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Viento {todayWind.date === today() ? 'hoy' : ''}</h2>
          <Link to="/viento" className="card block p-4 transition hover:border-brand/40">
            <WindSummary day={todayWind} />
            <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-deep">Ver los próximos días <Icon name="chevronRight" className="h-4 w-4" /></span>
          </Link>
        </section>
      )}

      <section aria-labelledby="news-h">
        <h2 id="news-h" className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Avisos de la escuela</h2>
        {news.error ? <ErrorBox message={news.error} />
          : (news.data ?? []).length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">No hay avisos nuevos.</p>
            : <div className="space-y-3">{news.data!.slice(0, 5).map((a) => <AnnouncementCard key={a.id} a={a} />)}</div>}
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
      <PageHeader title="Mis clases" action={<button type="button" className="btn-primary" onClick={() => setAsking(true)}><Icon name="plus" /> Pedir</button>} />
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} /> : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Próximas</h2>
            {upcoming.length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">No tenés clases próximas. ¡Pedí una!</p> : (
              <div className="space-y-3">
                {upcoming.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" actions={<CancelButton lesson={l} />} />)}
              </div>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Anteriores</h2>
              <div className="space-y-3">{past.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" />)}</div>
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
  if (error || !data) return <ErrorBox message={error ?? 'No se pudo cargar.'} onRetry={() => void reload()} />
  const s = data.summary
  return (
    <div className="space-y-6">
      <PageHeader title="Mi progreso" subtitle={s ? `En TRUEVENTO desde ${new Date(s.start_date + 'T12:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}` : undefined} />
      {s && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Horas en el agua" value={formatHours(s.hours)} tone="dark" />
          <Stat label="Clases" value={s.classes} tone="sky" />
        </div>
      )}
      <ProgressPath skills={data.skills} progress={data.progress} studentId={sid} editable={false} />
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Comentarios de tus instructores</h2>
        <NotesList notes={data.notes} instructorNames={data.names} />
      </section>
    </div>
  )
}
