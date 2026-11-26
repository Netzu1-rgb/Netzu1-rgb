-- Tests: only admins change the day of a class; the student is told why. Rolled back.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create schema tests;
create function tests.fails(stmt text) returns text language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED FAILURE, but it succeeded: %', stmt;
exception when others then
  if sqlerrm like 'EXPECTED FAILURE%' then raise; end if;
  return sqlerrm;
end $$;
create function tests.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create function tests.last_push() returns jsonb language sql security definer as $$
  select convert_from(body, 'UTF8')::jsonb from net.http_request_queue order by id desc limit 1
$$;
create table tests.vars (k text primary key, v text);
grant usage on schema tests to authenticated, anon;
grant all on tests.vars to authenticated;
grant execute on all functions in schema tests to authenticated, anon;
delete from net.http_request_queue;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucas@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
insert into public.instructors (id, full_name, hourly_pay) values ('00000000-0000-0000-0000-000000000e01', 'Lucas Rocha', 60);
insert into tests.vars values ('lucas', public.create_invite('instructor', '00000000-0000-0000-0000-000000000e01'));
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select public.claim_invite((select v from tests.vars where k = 'lucas'));
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');
select public.save_push_subscription('alumnos', 'https://push.example/ana', repeat('q', 87), repeat('b', 22), 'es');
reset role;
update public.students set hourly_rate = 250;
insert into private.push_config (url, secret) values ('https://g.example/api/push', 'test-secret-0123456789abcdef');

\echo '1. an instructor confirms a request on the requested day, not another'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l1', public.request_lesson(current_date + 2, null, 1.5, p_accept_rules => true));
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select tests.fails($$select public.confirm_lesson((select v::uuid from tests.vars where k = 'l1'),
  '00000000-0000-0000-0000-000000000e01', current_date + 3, '10:00', 1.5)$$) as "instructor moves the day";
select public.confirm_lesson((select v::uuid from tests.vars where k = 'l1'), '00000000-0000-0000-0000-000000000e01', current_date + 2, '10:00', 1.5);

\echo '2. once confirmed, an instructor cannot move it (day or time)'
select tests.fails($$select public.confirm_lesson((select v::uuid from tests.vars where k = 'l1'),
  '00000000-0000-0000-0000-000000000e01', current_date + 2, '12:00', 1.5)$$) as "instructor moves the time";
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 4, '10:00', 'Lluvia')$$) as "instructor reschedules";
-- but can still cancel their own class
reset role;

\echo '3. an admin moves it to another day because of the rain; the student is told why'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date - 1, '10:00')$$) as "past day";
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 2, '10:00')$$) as "same day and time";
select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 4, '15:00', 'Pronóstico de lluvia');
do $$
declare l public.lessons; m jsonb := tests.last_push() -> 'messages' -> 0 -> 'payload';
begin
  select * into l from public.lessons where id = (select v::uuid from tests.vars where k = 'l1');
  assert l.lesson_date = current_date + 4 and l.start_time = '15:00' and l.hours = 1.5 and l.status = 'confirmed', 'moved';
  assert l.instructor_id = '00000000-0000-0000-0000-000000000e01', 'same instructor';
  assert m ->> 'title' = 'Cambiamos tu clase', m ->> 'title';
  assert m ->> 'body' like 'Ahora: % a las 15:00 · Pronóstico de lluvia', m ->> 'body';
end $$;

\echo '4. it cannot land on a time already taken'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l2', public.request_lesson(current_date + 5, null, 2, p_accept_rules => true));
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.confirm_request((select v::uuid from tests.vars where k = 'l2'), 250, '00000000-0000-0000-0000-000000000e01', '09:00');
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 5, '10:00')$$) as "taken";
select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 5, '11:00');

\echo '5. only confirmed classes, and only admins (students cannot)'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l1'), current_date + 6, '10:00')$$) as "student";
insert into tests.vars values ('l3', public.request_lesson(current_date + 6, null, 1, p_accept_rules => true));
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select tests.fails($$select public.reschedule_lesson((select v::uuid from tests.vars where k = 'l3'), current_date + 7, '10:00')$$) as "a request";
reset role;

\echo ''
\echo 'ALL RESCHEDULE TESTS PASSED'
rollback;
