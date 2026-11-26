-- TRUEVENTO: the school's rules (arrive 20 minutes early, wind, cancellations...).
--
-- Students read them when booking and must accept them to send each request; the
-- moment they accepted is kept on the class. The text of the rules lives in the
-- students app (Spanish, Portuguese and English).

alter table public.lessons add column if not exists rules_accepted_at timestamptz;

drop function if exists public.request_lesson(date, time, numeric, uuid, text, text);
create or replace function public.request_lesson(
  p_date date, p_time time, p_hours numeric, p_instructor uuid default null, p_note text default null,
  p_lang text default null, p_accept_rules boolean default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := public.my_student_id();
  new_id uuid;
begin
  perform public.check_lesson_hours(p_hours);
  -- every booking needs the school's rules accepted
  if p_accept_rules is not true then
    raise exception 'Tenés que aceptar las normas de la escuela para reservar.' using errcode = '22023';
  end if;
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
  insert into public.lessons (student_id, instructor_id, lesson_date, start_time, hours, status, student_note, class_lang, rules_accepted_at)
  values (sid, p_instructor, p_date, p_time, p_hours, 'requested', nullif(trim(p_note), ''),
          coalesce(public.valid_class_lang(p_lang), (select lang from public.students where id = sid), 'es'), now())
  returning id into new_id;
  return new_id;
end $$;
revoke execute on function public.request_lesson(date, time, numeric, uuid, text, text, boolean) from public, anon;
grant execute on function public.request_lesson(date, time, numeric, uuid, text, text, boolean) to authenticated;
