-- Tests for the students & instructors app: invites, agenda, progress, notes,
-- announcements and what a student can (not) see. Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create schema tests;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ext@test.local'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ext2@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beto@test.local'),
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner2@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nobody@test.local');

create function tests.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create function tests.fails(stmt text) returns text language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED FAILURE, but it succeeded: %', stmt;
exception when others then
  if sqlerrm like 'EXPECTED FAILURE%' then raise; end if;
  return sqlerrm;
end $$;
create table tests.vars (k text primary key, v text);
grant usage on schema tests to authenticated, anon;
grant select on tests.vars to anon;
grant all on tests.vars to authenticated;
grant execute on all functions in schema tests to authenticated;

\echo '1. school with an external instructor and two students'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
insert into public.instructors (id, full_name, hourly_pay) values
  ('00000000-0000-0000-0000-000000000e01', 'Instructor Externo', 60),
  ('00000000-0000-0000-0000-000000000e02', 'Otro Externo', 70);
insert into public.students (id, full_name, hourly_rate, notes) values
  ('00000000-0000-0000-0000-000000000d01', 'Ana', 250, 'nota interna'),
  ('00000000-0000-0000-0000-000000000d02', 'Beto', 300, null);

\echo '2. only admins create invites; a pending code is reused'
insert into tests.vars values
  ('ana', public.create_invite('student', '00000000-0000-0000-0000-000000000d01')),
  ('beto', public.create_invite('student', '00000000-0000-0000-0000-000000000d02')),
  ('ext', public.create_invite('instructor', '00000000-0000-0000-0000-000000000e01')),
  ('ext2', public.create_invite('instructor', '00000000-0000-0000-0000-000000000e02')),
  ('owner2', public.create_invite('instructor', (select id from public.instructors where owner_slot = 2)));
do $$ begin
  assert (select v from tests.vars where k = 'ana') ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$', 'code format';
  assert public.create_invite('student', '00000000-0000-0000-0000-000000000d01') = (select v from tests.vars where k = 'ana'),
    'pending code reused';
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000c1');
select tests.fails($$select public.create_invite('student', '00000000-0000-0000-0000-000000000d01')$$) as "no-role invite";
do $$ begin assert (select count(*) from public.app_invites) = 0, 'no-role user cannot read codes'; end $$;

\echo '3. students and instructors join with their codes (once)'
reset role;
set role anon;
do $$ begin
  assert (public.invite_preview((select v from tests.vars where k = 'ana')) ->> 'first_name') = 'Ana', 'preview before sign up';
  assert public.invite_preview('ZZZZ-ZZZZ') is null;
end $$;
reset role;
select tests.fails($$select public.claim_invite('ZZZZ-ZZZZ')$$) as "wrong code";
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  -- typed in lowercase and without the dash still works
  assert public.claim_invite(lower(replace((select v from tests.vars where k = 'ana'), '-', ''))) ->> 'role' = 'student';
  assert public.my_student_id() = '00000000-0000-0000-0000-000000000d01';
  assert not public.has_access(), 'a student is not school staff';
  assert (public.app_me() ->> 'full_name') = 'Ana';
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000c1');
select tests.fails($$select public.claim_invite((select v from tests.vars where k = 'ana'))$$) as "code used twice";
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.claim_invite((select v from tests.vars where k = 'beto'));
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
do $$ begin assert public.claim_invite((select v from tests.vars where k = 'ext')) ->> 'role' = 'instructor'; end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000b2');
select public.claim_invite((select v from tests.vars where k = 'ext2'));
select tests.act_as('00000000-0000-0000-0000-0000000000f1');
do $$ begin
  assert public.claim_invite((select v from tests.vars where k = 'owner2')) ->> 'role' = 'admin', 'owners join as admins';
  assert public.is_admin();
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select tests.fails($$select public.create_invite('student', '00000000-0000-0000-0000-000000000d01')$$) as "already joined";

\echo '4. a student sees no prices, no other students and no school records'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  assert (select count(*) from public.students) = 0, 'students table hidden';
  assert (select count(*) from public.classes) = 0, 'classes hidden';
  assert (select count(*) from public.instructors) = 0, 'instructor pay hidden';
  assert (select count(*) from public.settlements) = 0;
  assert (select count(*) from public.school_settings) = 0;
  assert (select count(*) from public.profiles) = 1, 'only own profile';
  assert (select count(*) from public.instructor_directory()) = 4, 'instructor names available';
  assert (public.my_student_summary() ->> 'full_name') = 'Ana';
  assert public.my_student_summary()::text not like '%250%', 'no price in the summary';
  assert (select count(*) from public.skills) > 0, 'learning path visible';
end $$;
select tests.fails($$insert into public.students (full_name, hourly_rate) values ('x', 1)$$) as "student adds student";
select tests.fails($$insert into public.classes (student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000e01', current_date, 1, 1)$$) as "student adds class";
select tests.fails($$select public.schedule_lesson('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000e01', current_date, '10:00', 1)$$) as "student schedules";
select tests.fails($$select public.set_student_skill('00000000-0000-0000-0000-000000000d01', (select id from public.skills limit 1), 'done')$$) as "student marks own skill";
select tests.fails($$insert into public.announcements (title) values ('hola')$$) as "student posts";

\echo '5. a student asks for classes; past dates are refused'
select tests.fails($$select public.request_lesson(current_date - 1, '10:00', 1)$$) as "past date";
select tests.fails($$select public.request_lesson(current_date + 1, '10:00', 1.1)$$) as "not a quarter hour";
insert into tests.vars values
  ('req1', public.request_lesson(current_date + 1, '10:00', 1.5, null, 'Primera vez')),
  ('req2', public.request_lesson(current_date + 2, '15:30', 2, '00000000-0000-0000-0000-000000000e02'));
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
insert into tests.vars values ('req3', public.request_lesson(current_date + 1, '09:00', 1));
do $$ begin
  assert (select count(*) from public.agenda(current_date, current_date + 30)) = 1, 'Beto sees only his request';
  assert (select count(*) from public.lessons) = 1;
end $$;
select tests.fails($$select public.cancel_lesson((select v::uuid from tests.vars where k = 'req1'))$$) as "cancel another's class";
-- Ana asked for 10:00–11:30 tomorrow and Beto 09:00–10:00: overlapping times are taken
select tests.fails($$select public.request_lesson(current_date + 1, '10:00', 1)$$) as "same slot";
select tests.fails($$select public.request_lesson(current_date + 1, '11:00', 1)$$) as "overlaps Ana's 1:30";
select tests.fails($$select public.request_lesson(current_date + 1, '08:30', 1)$$) as "overlaps Beto's own";
do $$ begin
  -- Beto sees Ana's slot as taken, without her name
  assert (select count(*) from public.busy_slots(current_date, current_date + 7)) = 3;
  assert exists (select 1 from public.busy_slots(current_date, current_date + 7) where start_time = '10:00' and hours = 1.5);
end $$;
-- right after another class is free
insert into tests.vars values ('req4', public.request_lesson(current_date + 1, '11:30', 1));
select public.cancel_lesson((select v::uuid from tests.vars where k = 'req4'));

\echo '6. instructors confirm their own classes only'
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
do $$ begin assert (select count(*) from public.agenda(current_date, current_date + 30)) = 4, 'staff see the whole agenda (one cancelled)'; end $$;
select tests.fails($$select public.confirm_lesson((select v::uuid from tests.vars where k = 'req1'),
  '00000000-0000-0000-0000-000000000e02', current_date + 1, '10:00', 1.5)$$) as "assign another instructor";
select tests.fails($$select public.confirm_lesson((select v::uuid from tests.vars where k = 'req2'),
  '00000000-0000-0000-0000-000000000e01', current_date + 2, '15:30', 2)$$) as "take another's request";
select tests.fails($$select public.confirm_lesson((select v::uuid from tests.vars where k = 'req1'),
  '00000000-0000-0000-0000-000000000e01', current_date + 1, '09:00', 1.5)$$) as "move onto a taken time";
select public.confirm_lesson((select v::uuid from tests.vars where k = 'req1'),
  '00000000-0000-0000-0000-000000000e01', current_date + 1, '11:00', 1.5, 'Traé protector solar');
do $$ begin
  assert (select status = 'confirmed' and start_time = '11:00' and staff_note = 'Traé protector solar'
            from public.lessons where id = (select v::uuid from tests.vars where k = 'req1'));
end $$;
select tests.fails($$select public.complete_lesson((select v::uuid from tests.vars where k = 'req3'), 1)$$) as "close unconfirmed";

\echo '7. closing a class records it for the school with the right money'
select tests.act_as('00000000-0000-0000-0000-0000000000b2');
select tests.fails($$select public.complete_lesson((select v::uuid from tests.vars where k = 'req1'), 1.5)$$) as "close another's class";
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
insert into tests.vars values ('class1', public.complete_lesson(
  (select v::uuid from tests.vars where k = 'req1'), 2, 'Muy bien el body drag',
  array(select id from public.skills where level = 2 and position = 2),
  array(select id from public.skills where level = 1)));
do $$
declare c public.classes;
begin
  select * into c from public.classes where id = (select v::uuid from tests.vars where k = 'class1');
  assert c.student_rate = 250 and c.instructor_rate = 60 and c.hours = 2, 'prices from the records';
  assert c.total_amount = 500 and c.instructor_pay = 120 and c.school_profit = 380, 'totals';
  assert (select status = 'done' and hours = 2 from public.lessons where id = (select v::uuid from tests.vars where k = 'req1'));
  assert (select count(*) from public.student_skills where student_id = '00000000-0000-0000-0000-000000000d01' and status = 'done') = 5;
end $$;
select tests.fails($$select public.complete_lesson((select v::uuid from tests.vars where k = 'req1'), 1)$$) as "close twice";
-- marking a learned skill as "learning" later never downgrades it
select public.set_student_skill('00000000-0000-0000-0000-000000000d01',
  (select id from public.skills where level = 2 and position = 2), 'done');

\echo '8. the student sees their progress and the note, not the money'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  assert (select count(*) from public.student_skills) = 6;
  assert (select body from public.lesson_notes) = 'Muy bien el body drag';
  assert (public.my_student_summary() ->> 'hours')::numeric = 2;
  assert (public.my_student_summary() ->> 'classes')::int = 1;
  assert (select count(*) from public.classes) = 0, 'still no class rows';
end $$;
select tests.fails($$select public.cancel_lesson((select v::uuid from tests.vars where k = 'req1'))$$) as "cancel a given class";
select public.cancel_lesson((select v::uuid from tests.vars where k = 'req2'), 'No puedo ese día');
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
do $$ begin
  assert (select count(*) from public.student_skills) = 0, 'other student progress hidden';
  assert (select count(*) from public.lesson_notes) = 0, 'other student notes hidden';
end $$;

\echo '9. announcements: for everyone or for one student'
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
insert into public.announcements (title, body, author_name) values ('Mañana sin viento', 'Pasamos las clases al jueves', 'Falso');
insert into public.announcements (title, student_id) values ('Ana: traé tu traje', '00000000-0000-0000-0000-000000000d01');
do $$ begin
  assert (select author_name from public.announcements where title = 'Mañana sin viento') = 'Instructor Externo',
    'author comes from the profile';
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
do $$ begin assert (select count(*) from public.announcements) = 1, 'Beto sees only the general one'; end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin assert (select count(*) from public.announcements) = 2, 'Ana sees hers too'; end $$;

\echo '10. a deactivated student loses access'
reset role;
update public.profiles set active = false where id = '00000000-0000-0000-0000-0000000000d1';
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  assert public.my_student_id() is null;
  assert (select count(*) from public.student_skills) = 0;
  assert (select count(*) from public.announcements) = 0;
end $$;
select tests.fails($$select public.request_lesson(current_date + 3, '10:00', 1)$$) as "inactive student asks";

reset role;
\echo ''
\echo 'ALL STUDENT APP TESTS PASSED'
rollback;
