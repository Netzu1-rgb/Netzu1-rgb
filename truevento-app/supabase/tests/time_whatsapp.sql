-- Tests: students ask for a day and hours; the time is agreed on WhatsApp and set
-- by the school when confirming. Rolled back at the end.
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
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
select public.save_push_subscription('gestion', 'https://push.example/admin', repeat('p', 87), repeat('a', 22), 'es');
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');
select public.save_push_subscription('alumnos', 'https://push.example/ana', repeat('q', 87), repeat('b', 22), 'pt');
reset role;
insert into private.push_config (url, secret) values ('https://g.example/api/push', 'test-secret-0123456789abcdef');

\echo '1. a request with a day and hours only'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l1', public.request_lesson(current_date + 2, null, 2));
do $$ begin
  assert (select start_time from public.lessons where id = (select v::uuid from tests.vars where k = 'l1')) is null;
  assert (select count(*) from public.busy_slots(current_date, current_date + 7)) = 0, 'takes no slot';
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like 'Ana Silva pidió el % · 2 h (horario a coordinar) · alumno nuevo, falta el precio',
    tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body';
end $$;
-- two requests the same day are fine (they are agreed on WhatsApp)
insert into tests.vars values ('l2', public.request_lesson(current_date + 2, null, 1.5));
reset role;

\echo '2. a confirmed class always has a time'
select tests.fails($$update public.lessons set status = 'confirmed' where id = (select v::uuid from tests.vars where k = 'l1')$$) as "no time";

\echo '3. the school sets the agreed time (and may change hours) when confirming'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select tests.fails($$select public.confirm_request((select v::uuid from tests.vars where k = 'l1'), 250,
  (select id from public.instructors where owner_slot = 1))$$) as "time required";
select public.confirm_request((select v::uuid from tests.vars where k = 'l1'), 250,
  (select id from public.instructors where owner_slot = 1), '14:00', null, 1.5);
do $$
declare l public.lessons;
begin
  select * into l from public.lessons where id = (select v::uuid from tests.vars where k = 'l1');
  assert l.status = 'confirmed' and l.start_time = '14:00' and l.hours = 1.5, 'time and hours saved';
  assert (select hourly_rate from public.students where full_name = 'Ana Silva') = 250;
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like '% às 14:00 com Victoria Linde', 'Ana hears the time';
  assert (select count(*) from public.busy_slots(current_date, current_date + 7)) = 1, 'now it takes its slot';
end $$;
-- the second request of that day cannot take an overlapping time
select tests.fails($$select public.confirm_request((select v::uuid from tests.vars where k = 'l2'), 250,
  (select id from public.instructors where owner_slot = 1), '15:00')$$) as "overlap";
select public.confirm_request((select v::uuid from tests.vars where k = 'l2'), 250,
  (select id from public.instructors where owner_slot = 1), '16:00', current_date + 3);
do $$ begin
  assert (select lesson_date from public.lessons where id = (select v::uuid from tests.vars where k = 'l2')) = current_date + 3, 'day changed';
end $$;

\echo '4. cancelling a request without a time notifies with a full text'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l3', public.request_lesson(current_date + 5, null, 1));
select public.cancel_lesson((select v::uuid from tests.vars where k = 'l3'));
do $$ begin
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like 'Ana Silva canceló la clase del % (horario a coordinar)',
    tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body';
end $$;
reset role;

\echo ''
\echo 'ALL TIME-BY-WHATSAPP TESTS PASSED'
rollback;
