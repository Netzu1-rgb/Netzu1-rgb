-- TRUEVENTO: the database answers fast with many students and classes.
--
-- The security rules (row level security) called functions like is_admin() or has_access()
-- for every row they checked, and each call reads the profiles table. With a few rows it
-- did not show; with tens of thousands a student waited seconds for their own classes.
-- Wrapped in (select ...), Postgres works each one out once per query. Who can see what does
-- not change at all: the rules are the same, written so they run once.
--
-- Measured on a copy with 3,000 students, 60,000 lessons and 39,000 classes (supabase/load/README.md): a student's own classes went from 4.2 s to milliseconds.

alter policy announcements_delete on public.announcements
  using (((select public.is_admin()) OR ((select public.has_access()) AND (created_by = (select auth.uid())))));
alter policy announcements_insert on public.announcements
  with check (((select public.has_access()) AND (created_by = (select auth.uid()))));
alter policy announcements_read on public.announcements
  using (((select public.has_access()) OR (((select public.my_student_id()) IS NOT NULL) AND ((student_id IS NULL) OR (student_id = (select public.my_student_id()))))));
alter policy invites_read on public.app_invites
  using ((select public.is_admin()));
alter policy classes_delete on public.classes
  using ((select public.is_admin()));
alter policy classes_insert on public.classes
  with check (((select public.is_admin()) OR ((select public.has_access()) AND (instructor_id = (select public.my_instructor_id())))));
alter policy classes_read on public.classes
  using (((select public.is_admin()) OR (instructor_id = (select public.my_instructor_id()))));
alter policy classes_update on public.classes
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
alter policy instructors_insert on public.instructors
  with check ((select public.is_admin()));
alter policy instructors_read on public.instructors
  using (((select public.is_admin()) OR (id = (select public.my_instructor_id()))));
alter policy instructors_update on public.instructors
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
alter policy lesson_notes_delete on public.lesson_notes
  using (((select public.is_admin()) OR ((select public.has_access()) AND (created_by = (select auth.uid())))));
alter policy lesson_notes_insert on public.lesson_notes
  with check (((select public.is_admin()) OR ((select public.has_access()) AND (instructor_id = (select public.my_instructor_id())))));
alter policy lesson_notes_read on public.lesson_notes
  using (((select public.has_access()) OR (student_id = (select public.my_student_id()))));
alter policy lessons_read on public.lessons
  using (((select public.has_access()) OR (student_id = (select public.my_student_id()))));
alter policy profiles_read on public.profiles
  using (((id = (select auth.uid())) OR (select public.is_admin())));
alter policy settings_read on public.school_settings
  using ((select public.has_access()));
alter policy settlements_read on public.settlements
  using (((select public.is_admin()) OR (instructor_id = (select public.my_instructor_id()))));
alter policy skills_insert on public.skills
  with check ((select public.is_admin()));
alter policy skills_read on public.skills
  using (((select public.has_access()) OR ((select public.my_student_id()) IS NOT NULL)));
alter policy skills_update on public.skills
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
alter policy student_skills_read on public.student_skills
  using (((select public.has_access()) OR (student_id = (select public.my_student_id()))));
alter policy students_delete on public.students
  using ((select public.is_admin()));
alter policy students_insert on public.students
  with check ((select public.has_access()));
alter policy students_read on public.students
  using ((select public.has_access()));
alter policy students_update on public.students
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
alter policy wind_observations_staff_read on public.wind_observations
  using ((select public.has_access()));

-- the agenda: who is asking is worked out once, not for every lesson
create or replace function public.agenda(p_from date, p_to date) returns table (
  id uuid, student_id uuid, student_name text, instructor_id uuid, instructor_name text,
  lesson_date date, start_time time, hours numeric, status text,
  student_note text, staff_note text, created_at timestamptz, price_pending boolean, class_lang text,
  student_phone text, student_lang text)
language sql stable security definer set search_path = public as $$
  select l.id, l.student_id, s.full_name, l.instructor_id, i.full_name,
         l.lesson_date, l.start_time, l.hours, l.status, l.student_note, l.staff_note, l.created_at,
         (select public.has_access()) and s.hourly_rate is null, l.class_lang,
         case when (select public.has_access()) then s.phone end,
         case when (select public.has_access()) then s.lang end
    from public.lessons l
    join public.students s on s.id = l.student_id
    left join public.instructors i on i.id = l.instructor_id
   where l.lesson_date between p_from and p_to
     and ((select public.has_access()) or l.student_id = (select public.my_student_id()))
   order by l.lesson_date, l.start_time
$$;

-- requests waiting for the school are looked up often: an index just for them
create index if not exists lessons_requested_idx on public.lessons (lesson_date) where status = 'requested';

-- taken times (every student picking a time asks for them): who is asking, once
create or replace function public.busy_slots(p_from date, p_to date, p_exclude uuid default null)
returns table (lesson_date date, start_time time, hours numeric)
language sql stable security definer set search_path = public as $$
  select l.lesson_date, l.start_time, l.hours
    from public.lessons l
   where l.lesson_date between p_from and p_to
     and l.status in ('requested', 'confirmed')
     and l.start_time is not null
     and l.id is distinct from p_exclude
     and ((select public.has_access()) or (select public.my_student_id()) is not null)
   order by l.lesson_date, l.start_time
$$;

create or replace function public.instructor_directory() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select i.id, i.full_name from public.instructors i
   where i.active and ((select public.has_access()) or (select public.my_student_id()) is not null)
   order by i.kind desc, i.owner_slot nulls last, i.full_name
$$;

create or replace function public.app_students() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select s.id, s.full_name
    from public.students s
   where s.active
     and (select public.has_access())
     and exists (select 1 from public.profiles p where p.student_id = s.id and p.role = 'student')
   order by s.full_name
$$;
