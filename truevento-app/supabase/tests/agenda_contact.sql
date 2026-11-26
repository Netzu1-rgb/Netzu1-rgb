-- Tests: the school sees the student's WhatsApp in the agenda; a student sees nobody's. Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create function pg_temp.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bia@test.local');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');
select public.set_my_lang('pt');
select public.request_lesson(current_date + 2, null, 1.5, p_accept_rules => true);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select public.register_student('Bia Costa', '+55 88 99999-0002', 55::smallint, 'none');
select public.request_lesson(current_date + 3, null, 1, p_accept_rules => true);

\echo '1. the admin sees each student''s WhatsApp and language'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select count(*) from public.agenda(current_date, current_date + 7)) = 2, 'both requests';
  assert (select student_phone from public.agenda(current_date, current_date + 7) where student_name = 'Ana Silva') = '+55 88 99999-0001', 'phone';
  assert (select student_lang from public.agenda(current_date, current_date + 7) where student_name = 'Ana Silva') = 'pt', 'language';
end $$;

\echo '2. a student sees only their own classes, and no number at all'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
do $$ begin
  assert (select count(*) from public.agenda(current_date, current_date + 7)) = 1, 'only her class';
  assert (select student_phone is null and student_lang is null from public.agenda(current_date, current_date + 7)), 'no number for a student';
end $$;

\echo 'OK: agenda_contact'
rollback;
