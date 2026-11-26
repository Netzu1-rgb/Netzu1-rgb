-- Tests: the language each class is taught in. Rolled back at the end.
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
select public.set_my_lang('pt');
reset role;
insert into private.push_config (url, secret) values ('https://g.example/api/push', 'test-secret-0123456789abcdef');

\echo '1. the student chooses the language; by default, the one of their app'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l1', public.request_lesson(current_date + 2, null, 1.5, null, null, 'en', p_accept_rules => true));
insert into tests.vars values ('l2', public.request_lesson(current_date + 3, null, 1, p_accept_rules => true));
insert into tests.vars values ('l3', public.request_lesson(current_date + 4, null, 1, null, null, 'xx', p_accept_rules => true));
do $$ begin
  assert (select class_lang from public.lessons where id = (select v::uuid from tests.vars where k = 'l1')) = 'en';
  assert (select class_lang from public.lessons where id = (select v::uuid from tests.vars where k = 'l2')) = 'pt', 'app language';
  assert (select class_lang from public.lessons where id = (select v::uuid from tests.vars where k = 'l3')) = 'pt', 'invalid -> app language';
  assert (select class_lang from public.agenda(current_date, current_date + 7) where id = (select v::uuid from tests.vars where k = 'l1')) = 'en', 'in the agenda';
end $$;
reset role;
do $$ begin
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like 'Ana Silva pidió el % · 1 h (horario a coordinar) · en portugués · alumno nuevo, falta el precio',
    tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body';
end $$;

\echo '2. the school can change it when confirming, or later'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.confirm_request((select v::uuid from tests.vars where k = 'l1'), 250, (select id from public.instructors where owner_slot = 1), '10:00', null, null, 'es');
select public.set_class_lang((select v::uuid from tests.vars where k = 'l2'), 'en');
select tests.fails($$select public.set_class_lang((select v::uuid from tests.vars where k = 'l2'), 'fr')$$) as "invalid";
reset role;
do $$ begin
  assert (select class_lang from public.lessons where id = (select v::uuid from tests.vars where k = 'l1')) = 'es';
  assert (select class_lang from public.lessons where id = (select v::uuid from tests.vars where k = 'l2')) = 'en';
end $$;

\echo '3. a student cannot change it after asking'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select tests.fails($$select public.set_class_lang((select v::uuid from tests.vars where k = 'l2'), 'pt')$$) as "student";
reset role;

\echo ''
\echo 'ALL CLASS LANGUAGE TESTS PASSED'
rollback;
