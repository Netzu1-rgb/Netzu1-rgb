-- TRUEVENTO: the school can write to a student from their class.
--
-- The agenda of the students app now brings the student's WhatsApp number and language
-- to the school's staff (admins and instructors), so a request or a class has a button
-- to write to them. A student never gets anyone's number: for them both columns are empty.

drop function if exists public.agenda(date, date);
create function public.agenda(p_from date, p_to date) returns table (
  id uuid, student_id uuid, student_name text, instructor_id uuid, instructor_name text,
  lesson_date date, start_time time, hours numeric, status text,
  student_note text, staff_note text, created_at timestamptz, price_pending boolean, class_lang text,
  student_phone text, student_lang text)
language sql stable security definer set search_path = public as $$
  select l.id, l.student_id, s.full_name, l.instructor_id, i.full_name,
         l.lesson_date, l.start_time, l.hours, l.status, l.student_note, l.staff_note, l.created_at,
         public.has_access() and s.hourly_rate is null, l.class_lang,
         case when public.has_access() then s.phone end,
         case when public.has_access() then s.lang end
    from public.lessons l
    join public.students s on s.id = l.student_id
    left join public.instructors i on i.id = l.instructor_id
   where l.lesson_date between p_from and p_to
     and (public.has_access() or l.student_id = public.my_student_id())
   order by l.lesson_date, l.start_time
$$;
revoke execute on function public.agenda(date, date) from public, anon;
grant execute on function public.agenda(date, date) to authenticated;
