-- Load test data for the LOCAL database only: thousands of students, lessons and classes.
\set ON_ERROR_STOP on
set session_replication_role = replica; -- no triggers: just data

insert into public.students (id, full_name, phone, hourly_rate, start_date, active)
select gen_random_uuid(), 'Alumno ' || g, '+55 88 9' || lpad(g::text, 8, '0'), 200 + (g % 5) * 10, current_date - (g % 300), true
  from generate_series(1, 3000) g;

-- lessons from the students app: past and future, all states
insert into public.lessons (id, student_id, instructor_id, lesson_date, start_time, hours, status, class_lang)
select gen_random_uuid(), s.id, (select id from public.instructors order by id limit 1),
       current_date + ((random() * 200)::int - 150), make_time(8 + (random() * 9)::int, 0, 0), 1 + (random() * 2)::int,
       (array['requested','confirmed','done','cancelled'])[1 + (random() * 3)::int], 'es'
  from public.students s, generate_series(1, 20) g
 where s.full_name like 'Alumno %';

-- classes of the management app (with their money)
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate, instructor_kind)
select gen_random_uuid(), s.id, i.id, current_date - (random() * 400)::int, 1 + (random() * 2)::int, 250, 0, 'owner'
  from (select id, row_number() over () rn from public.students where full_name like 'Alumno %') s
  cross join generate_series(1, 13) g
  cross join lateral (select id from public.instructors where kind = 'owner' order by id limit 1) i;

set session_replication_role = origin;
analyze;
select (select count(*) from public.students) students, (select count(*) from public.lessons) lessons, (select count(*) from public.classes) classes;
