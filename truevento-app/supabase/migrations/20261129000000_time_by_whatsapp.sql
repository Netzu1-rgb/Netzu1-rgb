-- TRUEVENTO: the time of a requested class is agreed on WhatsApp.
--
-- Students ask only for a day and how many hours; the school agrees the time (and the
-- price) with them on WhatsApp and writes it when confirming. A request without a time
-- does not take any slot of the calendar; a confirmed or finished class always has one.

alter table public.lessons alter column start_time drop not null;
alter table public.lessons drop constraint if exists lessons_time_when_confirmed;
alter table public.lessons add constraint lessons_time_when_confirmed
  check (start_time is not null or status in ('requested', 'cancelled'));

-- taken times: only classes that have one
create or replace function public.busy_slots(p_from date, p_to date, p_exclude uuid default null)
returns table (lesson_date date, start_time time, hours numeric)
language sql stable security definer set search_path = public as $$
  select l.lesson_date, l.start_time, l.hours
    from public.lessons l
   where l.lesson_date between p_from and p_to
     and l.status in ('requested', 'confirmed')
     and l.start_time is not null
     and l.id is distinct from p_exclude
     and (public.has_access() or public.my_student_id() is not null)
   order by l.lesson_date, l.start_time
$$;

-- a student asks for a day and a duration; p_time stays empty (it is agreed on WhatsApp)
create or replace function public.request_lesson(
  p_date date, p_time time, p_hours numeric, p_instructor uuid default null, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := public.my_student_id();
  new_id uuid;
begin
  perform public.check_lesson_hours(p_hours);
  if sid is null then
    raise exception 'Solo los alumnos pueden pedir clases desde acá.' using errcode = '42501';
  end if;
  if p_date < (now() at time zone 'America/Fortaleza')::date then
    raise exception 'Elegí una fecha de hoy en adelante.' using errcode = '22023';
  end if;
  if p_date > (now() at time zone 'America/Fortaleza')::date + 180 then
    raise exception 'Elegí una fecha dentro de los próximos 6 meses.' using errcode = '22023';
  end if;
  if p_instructor is not null and not exists (select 1 from public.instructors where id = p_instructor and active) then
    raise exception 'Ese instructor no está disponible.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.lessons where student_id = sid and status = 'requested') >= 10 then
    raise exception 'Ya tenés muchas solicitudes pendientes. Esperá a que la escuela responda.' using errcode = 'P0001';
  end if;
  if p_time is not null then
    perform public.assert_slot_free(p_date, p_time, p_hours);
  end if;
  insert into public.lessons (student_id, instructor_id, lesson_date, start_time, hours, status, student_note)
  values (sid, p_instructor, p_date, p_time, p_hours, 'requested', nullif(trim(p_note), ''))
  returning id into new_id;
  return new_id;
end $$;

-- the school's inbox: price per hour and the time agreed on WhatsApp (the day and the
-- duration may change too), then the class is confirmed in one step
drop function if exists public.confirm_request(uuid, numeric, uuid);
create or replace function public.confirm_request(
  p_lesson uuid, p_rate numeric, p_instructor uuid,
  p_time time default null, p_date date default null, p_hours numeric default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede poner precios.' using errcode = '42501';
  end if;
  if p_rate is null or p_rate < 0 or p_rate >= 1000000 or p_rate * 100 <> trunc(p_rate * 100) then
    raise exception 'Escribí el precio por hora.' using errcode = '22023';
  end if;
  select * into l from public.lessons where id = p_lesson;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if coalesce(p_time, l.start_time) is null then
    raise exception 'Elegí el horario acordado con el alumno.' using errcode = '22023';
  end if;
  update public.students set hourly_rate = p_rate where id = l.student_id;
  perform public.confirm_lesson(p_lesson, p_instructor, coalesce(p_date, l.lesson_date),
                                coalesce(p_time, l.start_time), coalesce(p_hours, l.hours), null);
end $$;
revoke execute on function public.confirm_request(uuid, numeric, uuid, time, date, numeric) from public, anon;
grant execute on function public.confirm_request(uuid, numeric, uuid, time, date, numeric) to authenticated;

-- notifications: a request without a time says it is to be agreed
create or replace function public.lessons_notify() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare
  st      public.students;
  who     text;
  day     text := to_char(new.lesson_date, 'DD/MM');
  hhmm    text := to_char(new.start_time, 'HH24:MI');
  -- a request has no time yet: it is agreed on WhatsApp
  at_es   text := coalesce(' a las ' || to_char(new.start_time, 'HH24:MI'), ' (horario a coordinar)');
  at_pt   text := coalesce(' às ' || to_char(new.start_time, 'HH24:MI'), ' (horário a combinar)');
  at_en   text := coalesce(' at ' || to_char(new.start_time, 'HH24:MI'), ' (time to be agreed)');
  -- the school's reason when it moves a class (rain, no wind...)
  why     text := case when tg_op = 'UPDATE' and new.staff_note is distinct from old.staff_note
                        then coalesce(' · ' || new.staff_note, '') else '' end;
  dur     text := floor(new.hours)::int
                  || coalesce(nullif(':' || lpad(round((new.hours - floor(new.hours)) * 60)::int::text, 2, '0'), ':00'), '') || ' h';
  admins  uuid[];
  owners  uuid[]; -- the student's own logins
  by_student boolean;
begin
  select * into st from public.students where id = new.student_id;
  select array_agg(id) into admins from public.profiles where role = 'admin' and active;
  select array_agg(id) into owners from public.profiles where student_id = new.student_id and active;
  by_student := auth.uid() is not null and auth.uid() = any(coalesce(owners, '{}'));
  select full_name into who from public.instructors where id = new.instructor_id;

  if tg_op = 'INSERT' and new.status = 'requested' then
    perform private.notify(admins, 'gestion', jsonb_build_object(
      'url', '/solicitudes', 'tag', 'request-' || new.id,
      'es', jsonb_build_object('title', 'Nueva solicitud de clase',
              'body', st.full_name || ' pidió el ' || day || ' · ' || dur || at_es || case when st.hourly_rate is null then ' · alumno nuevo, falta el precio' else '' end),
      'pt', jsonb_build_object('title', 'Nova solicitação de aula', 'body', st.full_name || ' pediu ' || day || ' · ' || dur || at_pt),
      'en', jsonb_build_object('title', 'New lesson request', 'body', st.full_name || ' asked for ' || day || ' · ' || dur || at_en)));

  elsif tg_op = 'UPDATE' and old.status = 'requested' and new.status = 'confirmed' then
    perform private.notify(owners, 'alumnos', jsonb_build_object(
      'url', '/agenda', 'tag', 'lesson-' || new.id,
      'es', jsonb_build_object('title', '¡Clase confirmada!', 'body', day || ' a las ' || hhmm || coalesce(' con ' || who, '')),
      'pt', jsonb_build_object('title', 'Aula confirmada!', 'body', day || ' às ' || hhmm || coalesce(' com ' || who, '')),
      'en', jsonb_build_object('title', 'Lesson confirmed!', 'body', day || ' at ' || hhmm || coalesce(' with ' || who, ''))));

  elsif tg_op = 'UPDATE' and old.status = 'confirmed' and new.status = 'confirmed'
        and (old.lesson_date, old.start_time, old.hours) is distinct from (new.lesson_date, new.start_time, new.hours) then
    perform private.notify(owners, 'alumnos', jsonb_build_object(
      'url', '/agenda', 'tag', 'lesson-' || new.id,
      'es', jsonb_build_object('title', 'Cambiamos tu clase', 'body', 'Ahora: ' || day || ' a las ' || hhmm || why),
      'pt', jsonb_build_object('title', 'Mudamos sua aula', 'body', 'Agora: ' || day || ' às ' || hhmm || why),
      'en', jsonb_build_object('title', 'Your lesson was moved', 'body', 'Now: ' || day || ' at ' || hhmm || why)));

  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status in ('requested', 'confirmed') then
    if by_student then
      perform private.notify(admins, 'gestion', jsonb_build_object(
        'url', '/', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'Un alumno canceló', 'body', st.full_name || ' canceló la clase del ' || day || at_es),
        'pt', jsonb_build_object('title', 'Um aluno cancelou', 'body', st.full_name || ' cancelou a aula de ' || day || at_pt),
        'en', jsonb_build_object('title', 'A student cancelled', 'body', st.full_name || ' cancelled the lesson on ' || day || at_en)));
    elsif old.status = 'requested' then
      perform private.notify(owners, 'alumnos', jsonb_build_object(
        'url', '/agenda', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'No pudimos confirmar tu clase', 'body', day || at_es || '. Pedí otro día en la app.'),
        'pt', jsonb_build_object('title', 'Não conseguimos confirmar sua aula', 'body', day || at_pt || '. Peça outro dia no app.'),
        'en', jsonb_build_object('title', 'We could not confirm your lesson', 'body', day || at_en || '. Book another day in the app.')));
    else
      perform private.notify(owners, 'alumnos', jsonb_build_object(
        'url', '/agenda', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'Clase cancelada', 'body', 'La escuela canceló la clase del ' || day || ' a las ' || hhmm),
        'pt', jsonb_build_object('title', 'Aula cancelada', 'body', 'A escola cancelou a aula de ' || day || ' às ' || hhmm),
        'en', jsonb_build_object('title', 'Lesson cancelled', 'body', 'The school cancelled the lesson on ' || day || ' at ' || hhmm)));
    end if;
  end if;
  return null;
exception when others then
  raise warning 'push notification skipped: %', sqlerrm;
  return null;
end $$;
