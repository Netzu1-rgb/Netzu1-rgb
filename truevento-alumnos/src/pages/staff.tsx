// Screens for instructors and the school's admins.
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { AnnouncementCard } from '../components/announcements'
import { CompleteModal, LessonCard, ScheduleModal } from '../components/lessons'
import { NotesList, ProgressPath } from '../components/progress'
import { EmptyState, ErrorBox, Field, Icon, Loading, PageHeader, Spinner, useConfirm, useToast } from '../components/ui'
import { useWind, WindSummary } from '../components/wind'
import { useMe } from '../context/Session'
import * as api from '../lib/api'
import { friendlyError } from '../lib/errors'
import { addDays, dayLabel, firstName, longDay, shortTime, today } from '../lib/format'
import { notifyChange, useLoad } from '../lib/hooks'
import type { Lesson } from '../lib/types'

// ------------------------------------------------------------------ lesson actions

function useLessonActions() {
  const me = useMe()
  const confirm = useConfirm()
  const toast = useToast()
  const [editing, setEditing] = useState<Lesson | null | 'new'>(null)
  const [closing, setClosing] = useState<Lesson | null>(null)

  const mine = (l: Lesson) => me.isAdmin || l.instructor_id === me.instructor_id || (l.status === 'requested' && !l.instructor_id)

  async function cancel(l: Lesson) {
    const rejecting = l.status === 'requested'
    if (!(await confirm({
      title: rejecting ? 'Rechazar el pedido' : 'Cancelar la clase',
      message: `${rejecting ? '¿Rechazás el pedido' : '¿Cancelás la clase'} de ${l.student_name} del ${longDay(l.lesson_date)} a las ${shortTime(l.start_time)}? El alumno lo ve en su app.`,
      confirmLabel: rejecting ? 'Rechazar' : 'Cancelar clase',
      danger: true,
    }))) return
    try {
      await api.cancelLesson(l.id, '')
      notifyChange()
      toast(rejecting ? 'Pedido rechazado' : 'Clase cancelada')
    } catch (err) {
      toast(friendlyError(err), 'error')
    }
  }

  function actions(l: Lesson) {
    if (!mine(l)) return undefined
    const small = 'min-h-10 px-4 py-2 text-sm'
    if (l.status === 'requested') {
      return <>
        <button type="button" className={`btn-primary ${small}`} onClick={() => setEditing(l)}><Icon name="check" className="h-4 w-4" /> Confirmar</button>
        <button type="button" className={`btn-ghost ${small}`} onClick={() => void cancel(l)}>Rechazar</button>
      </>
    }
    if (l.status === 'confirmed') {
      return <>
        {l.lesson_date <= today() && (l.price_pending
          ? <span className="flex min-h-10 items-center text-sm text-ink-mute">Para cerrarla, la escuela tiene que poner el precio en la gestión.</span>
          : <button type="button" className={`btn-primary ${small}`} onClick={() => setClosing(l)}><Icon name="check" className="h-4 w-4" /> Clase dada</button>
        )}
        <button type="button" className={`btn-ghost ${small}`} onClick={() => setEditing(l)}>Cambiar</button>
        <button type="button" className={`btn-ghost ${small}`} onClick={() => void cancel(l)}>Cancelar</button>
      </>
    }
    return undefined
  }

  const modals = <>
    <ScheduleModal open={editing !== null} lesson={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
      myInstructorId={me.instructor_id} isAdmin={me.isAdmin} />
    <CompleteModal lesson={closing} onClose={() => setClosing(null)} />
  </>

  return { actions, modals, newLesson: () => setEditing('new') }
}

// ------------------------------------------------------------------ today

export function StaffToday() {
  const me = useMe()
  const { data, error, loading, reload } = useLoad(() => api.agenda(addDays(today(), -7), addDays(today(), 60)))
  const wind = useWind()
  const { actions, modals, newLesson } = useLessonActions()

  const lessons = data ?? []
  const requests = lessons.filter((l) => l.status === 'requested' && l.lesson_date >= today()
    && (me.isAdmin || !l.instructor_id || l.instructor_id === me.instructor_id))
  const mineToday = lessons.filter((l) => l.lesson_date === today() && l.status !== 'cancelled'
    && (me.isAdmin || l.instructor_id === me.instructor_id))
  // classes from past days still waiting to be closed
  const toClose = lessons.filter((l) => l.status === 'confirmed' && l.lesson_date < today()
    && (me.isAdmin || l.instructor_id === me.instructor_id))
  const todayWind = wind.data?.days.find((d) => d.date === today())

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-heading">Hola, {firstName(me.full_name)}</h1>
          <p className="text-ink-mute">{longDay(today(), true)}</p>
        </div>
        <button type="button" className="btn-primary" onClick={newLesson}><Icon name="plus" /> Agendar</button>
      </div>

      {todayWind && <Link to="/viento" className="card block p-4"><WindSummary day={todayWind} /></Link>}

      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} /> : <>
        {requests.length > 0 && (
          <section>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-coral-ink">
              <span className="grid h-6 min-w-6 place-items-center rounded-full bg-coral px-1.5 text-xs text-white">{requests.length}</span>
              Pedidos para confirmar
            </h2>
            <div className="space-y-3">{requests.map((l) => <LessonCard key={l.id} lesson={l} show="both" actions={actions(l)} />)}</div>
          </section>
        )}
        {toClose.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Clases pasadas sin cerrar</h2>
            <div className="space-y-3">{toClose.map((l) => <LessonCard key={l.id} lesson={l} show="both" actions={actions(l)} />)}</div>
          </section>
        )}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">{me.isAdmin ? 'Clases de hoy' : 'Tus clases de hoy'}</h2>
          {mineToday.length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">No hay clases para hoy.</p>
            : <div className="space-y-3">{mineToday.map((l) => <LessonCard key={l.id} lesson={l} show={me.isAdmin ? 'both' : 'student'} actions={actions(l)} />)}</div>}
        </section>
      </>}
      {modals}
    </div>
  )
}

// ------------------------------------------------------------------ agenda

export function StaffAgenda() {
  const me = useMe()
  const [start, setStart] = useState(today())
  const [onlyMine, setOnlyMine] = useState(!me.isAdmin)
  const end = addDays(start, 6)
  const { data, error, loading, reload } = useLoad(() => api.agenda(start, end), [start])
  const { actions, modals, newLesson } = useLessonActions()

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start])
  const lessons = (data ?? []).filter((l) => !onlyMine || l.instructor_id === me.instructor_id || (l.status === 'requested' && !l.instructor_id))

  return (
    <div>
      <PageHeader title="Agenda" action={<button type="button" className="btn-primary" onClick={newLesson}><Icon name="plus" /> Agendar</button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-line bg-surface">
          <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Semana anterior" onClick={() => setStart(addDays(start, -7))}><Icon name="chevronLeft" /></button>
          <span className="min-w-36 text-center text-sm font-semibold text-heading">{dayLabel(start)} – {dayLabel(end)}</span>
          <button type="button" className="grid h-11 w-11 place-items-center" aria-label="Semana siguiente" onClick={() => setStart(addDays(start, 7))}><Icon name="chevronRight" /></button>
        </div>
        {start !== today() && <button type="button" className="chip" onClick={() => setStart(today())}>Hoy</button>}
        {me.instructor_id && (
          <div className="ml-auto flex gap-1">
            <button type="button" aria-pressed={onlyMine} className={onlyMine ? 'chip-on' : 'chip'} onClick={() => setOnlyMine(true)}>Mías</button>
            <button type="button" aria-pressed={!onlyMine} className={!onlyMine ? 'chip-on' : 'chip'} onClick={() => setOnlyMine(false)}>Toda la escuela</button>
          </div>
        )}
      </div>
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} /> : (
        <div className="space-y-5">
          {days.map((d) => {
            const list = lessons.filter((l) => l.lesson_date === d)
            return (
              <section key={d}>
                <h2 className="mb-2 text-sm font-bold text-heading">{dayLabel(d)} <span className="font-normal normal-case text-ink-mute">· {longDay(d)}</span></h2>
                {list.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-mute">Sin clases</p>
                  : <div className="space-y-3">{list.map((l) => <LessonCard key={l.id} lesson={l} show="both" actions={actions(l)} />)}</div>}
              </section>
            )
          })}
        </div>
      )}
      {modals}
    </div>
  )
}

// ------------------------------------------------------------------ students

export function StaffStudents() {
  const { data, error, loading, reload } = useLoad(api.listStudents)
  const [q, setQ] = useState('')
  const list = (data ?? []).filter((s) => s.full_name.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <div>
      <PageHeader title="Alumnos" subtitle="Progreso y comentarios de cada alumno" />
      <div className="relative mb-4">
        <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
        <input className="input pl-12" type="search" placeholder="Buscar alumno" aria-label="Buscar alumno" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {loading && !data ? <Loading /> : error ? <ErrorBox message={error} onRetry={() => void reload()} />
        : list.length === 0 ? <EmptyState title={q ? 'Sin resultados' : 'Todavía no hay alumnos'} text={q ? undefined : 'Los alumnos se cargan desde la app de gestión de la escuela.'} />
          : (
            <ul className="card divide-y divide-line overflow-hidden">
              {list.map((s) => (
                <li key={s.id}>
                  <Link to={`/alumnos/${s.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand-deep">{s.full_name.charAt(0).toUpperCase()}</span>
                    <span className="flex-1 font-medium text-heading">{s.full_name}</span>
                    <Icon name="chevronRight" className="h-5 w-5 text-ink-mute" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
    </div>
  )
}

export function StaffStudentDetail() {
  const { id = '' } = useParams()
  const me = useMe()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(async () => {
    const [students, skills, progress, notes, people, lessons] = await Promise.all([
      api.listStudents(), api.listSkills(), api.studentSkills(id), api.lessonNotes(id), api.instructorDirectory(),
      api.agenda(today(), addDays(today(), 60)),
    ])
    return {
      student: students.find((s) => s.id === id) ?? null,
      skills, progress, notes,
      names: new Map(people.map((p) => [p.id, p.full_name])),
      upcoming: lessons.filter((l) => l.student_id === id && (l.status === 'confirmed' || l.status === 'requested')),
    }
  }, [id])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote(e: FormEvent) {
    e.preventDefault()
    if (!note.trim()) return
    setSaving(true)
    try {
      await api.addLessonNote(id, me.instructor_id, note.trim())
      setNote('')
      toast('Comentario guardado')
      void reload()
    } catch (err) {
      toast(friendlyError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !data) return <Loading />
  if (error || !data) return <ErrorBox message={error ?? 'No se pudo cargar.'} onRetry={() => void reload()} />
  if (!data.student) return <EmptyState title="Alumno no encontrado" action={<Link to="/alumnos" className="btn-ghost">Volver</Link>} />

  return (
    <div className="space-y-6">
      <div>
        <Link to="/alumnos" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-deep"><Icon name="chevronLeft" className="h-4 w-4" /> Alumnos</Link>
        <h1 className="text-2xl font-bold text-heading">{data.student.full_name}</h1>
      </div>
      {data.upcoming.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Próximas clases</h2>
          <div className="space-y-3">{data.upcoming.map((l) => <LessonCard key={l.id} lesson={l} show="instructor" />)}</div>
        </section>
      )}
      <ProgressPath skills={data.skills} progress={data.progress} studentId={id} editable onChanged={() => void reload()} />
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Comentarios</h2>
        <form onSubmit={addNote} className="card mb-3 space-y-3 p-4">
          <Field label="Nuevo comentario (lo ve el alumno)">
            {(fid) => <textarea id={fid} className="input min-h-20" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: para la próxima, practicá la posición del cuerpo en el waterstart" />}
          </Field>
          <button type="submit" className="btn-dark w-full" disabled={saving || !note.trim()}>{saving && <Spinner />} Guardar comentario</button>
        </form>
        <NotesList notes={data.notes} instructorNames={data.names} />
      </section>
    </div>
  )
}

// ------------------------------------------------------------------ announcements

export function StaffAnnouncements() {
  const me = useMe()
  const toast = useToast()
  const confirm = useConfirm()
  const news = useLoad(api.listAnnouncements)
  const students = useLoad(api.listStudents)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const names = new Map((students.data ?? []).map((s) => [s.id, s.full_name]))

  async function post(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Escribí un título.')
    setBusy(true)
    setError(null)
    try {
      await api.createAnnouncement(title.trim(), body.trim(), to || null)
      setTitle('')
      setBody('')
      setTo('')
      notifyChange()
      toast('Aviso publicado')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const QUICK = ['Hoy no hay viento: se suspenden las clases', 'Buen viento esta tarde: ¡los esperamos!', 'Mañana arrancamos más temprano']

  return (
    <div className="space-y-6">
      <PageHeader title="Avisos" subtitle="Los alumnos los ven al abrir la app" />
      <form onSubmit={post} className="card space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => <button key={q} type="button" className="chip text-left" onClick={() => setTitle(q)}>{q}</button>)}
        </div>
        <Field label="Título">
          {(id) => <input id={id} className="input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Mañana sin viento" />}
        </Field>
        <Field label="Detalle (opcional)">
          {(id) => <textarea id={id} className="input min-h-20" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />}
        </Field>
        <Field label="Para">
          {(id) => (
            <select id={id} className="input" value={to} onChange={(e) => setTo(e.target.value)}>
              <option value="">Todos los alumnos</option>
              {(students.data ?? []).map((s) => <option key={s.id} value={s.id}>Solo {s.full_name}</option>)}
            </select>
          )}
        </Field>
        {error && <ErrorBox message={error} />}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy && <Spinner />} <Icon name="megaphone" /> Publicar aviso</button>
      </form>
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-mute">Publicados</h2>
        {news.loading && !news.data ? <Loading /> : news.error ? <ErrorBox message={news.error} />
          : (news.data ?? []).length === 0 ? <p className="card px-4 py-6 text-center text-sm text-ink-mute">Todavía no hay avisos.</p>
            : (
              <div className="space-y-3">
                {news.data!.map((a) => (
                  <AnnouncementCard key={a.id} a={a} studentName={a.student_id ? names.get(a.student_id) : null}
                    onDelete={me.isAdmin || a.created_by === me.user_id ? async () => {
                      if (!(await confirm({ title: 'Borrar aviso', message: `¿Borrás “${a.title}”?`, confirmLabel: 'Borrar', danger: true }))) return
                      try {
                        await api.deleteAnnouncement(a.id)
                        notifyChange()
                      } catch (err) {
                        toast(friendlyError(err), 'error')
                      }
                    } : undefined} />
                ))}
              </div>
            )}
      </section>
    </div>
  )
}
