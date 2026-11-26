-- TRUEVENTO: only admins change the day of a class (rain, no wind...).
--
-- Instructors confirm requests on the day the student asked for (choosing the time) and
-- can cancel; moving a class to another day or time is for admins. Admins have their own
-- function to move a confirmed class, with the reason, and the student is notified.

create or replace function public.confirm_lesson(
  p_lesson uuid, p_instructor uuid, p_date date, p_time time, p_hours numeric, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  perform public.check_lesson_hours(p_hours);
  if not public.has_access() then
    raise exception 'Solo la escuela puede confirmar clases.' using errcode = '42501';
  end if;
  select * into l from public.lessons where id = p_lesson for update;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if l.status not in ('requested', 'confirmed') then
    raise exception 'Esta clase ya no se puede cambiar.' using errcode = 'P0001';
  end if;
  if p_time is null then
    raise exception 'Elegí el horario de la clase.' using errcode = '22023';
  end if;
  if not public.is_admin() then
    if p_instructor is distinct from public.my_instructor_id() then
      raise exception 'Solo podés confirmar clases que vas a dar vos.' using errcode = '42501';
    end if;
    if l.instructor_id is not null and l.instructor_id <> public.my_instructor_id() then
      raise exception 'Esta clase es de otro instructor.' using errcode = '42501';
    end if;
    -- the day (and, once confirmed, the time) is changed only by the school's admins
    if p_date is distinct from l.lesson_date
       or (l.status = 'confirmed' and (p_time, p_hours) is distinct from (l.start_time, l.hours)) then
      raise exception 'Solo la administración puede cambiar la fecha u horario de una clase.' using errcode = '42501';
    end if;
  end if;
  if not exists (select 1 from public.instructors where id = p_instructor and active) then
    raise exception 'Elegí un instructor activo.' using errcode = 'P0001';
  end if;
  perform public.assert_slot_free(p_date, p_time, p_hours, p_lesson);
  update public.lessons
     set status = 'confirmed', instructor_id = p_instructor, lesson_date = p_date,
         start_time = p_time, hours = p_hours,
         staff_note = coalesce(nullif(trim(p_note), ''), staff_note)
   where id = p_lesson;
end $$;

-- admins move a confirmed class to another day and time; the reason goes to the student
create or replace function public.reschedule_lesson(
  p_lesson uuid, p_date date, p_time time, p_reason text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  if not public.is_admin() then
    raise exception 'Solo la administración puede cambiar la fecha u horario de una clase.' using errcode = '42501';
  end if;
  select * into l from public.lessons where id = p_lesson for update;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if l.status <> 'confirmed' then
    raise exception 'Solo se pueden cambiar clases confirmadas.' using errcode = 'P0001';
  end if;
  if p_date is null or p_time is null then
    raise exception 'Elegí el nuevo día y horario.' using errcode = '22023';
  end if;
  if p_date < (now() at time zone 'America/Fortaleza')::date then
    raise exception 'Elegí una fecha de hoy en adelante.' using errcode = '22023';
  end if;
  if (p_date, p_time) = (l.lesson_date, l.start_time) then
    raise exception 'Elegí un día u horario distinto.' using errcode = '22023';
  end if;
  perform public.assert_slot_free(p_date, p_time, l.hours, p_lesson);
  update public.lessons
     set lesson_date = p_date, start_time = p_time,
         staff_note = coalesce(nullif(left(trim(p_reason), 500), ''), staff_note)
   where id = p_lesson;
end $$;

revoke execute on function public.reschedule_lesson(uuid, date, time, text) from public, anon;
grant execute on function public.reschedule_lesson(uuid, date, time, text) to authenticated;
