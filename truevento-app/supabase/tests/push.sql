-- Tests for notifications: who gets what, in which language, and that a failure to
-- notify never blocks a class. Requests are queued in pg_net inside this
-- transaction, which is rolled back: nothing is sent.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create schema tests;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ext@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruno@test.local');

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
-- the last request queued for the push function, as JSON
create function tests.last_push() returns jsonb language sql security definer as $$
  select convert_from(body, 'UTF8')::jsonb from net.http_request_queue order by id desc limit 1
$$;
create function tests.pushes() returns bigint language sql security definer as $$
  select count(*) from net.http_request_queue
$$;
create table tests.vars (k text primary key, v text);
grant usage on schema tests to authenticated, anon;
grant all on tests.vars to authenticated;
grant execute on all functions in schema tests to authenticated, anon;
delete from net.http_request_queue;

\echo '1. school, an instructor and two students with logins'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
insert into public.instructors (id, full_name, hourly_pay) values ('00000000-0000-0000-0000-000000000e01', 'Lucas Rocha', 60);
insert into public.students (id, full_name, hourly_rate, phone) values ('00000000-0000-0000-0000-000000000d01', 'Ana Silva', 250, '+55 88 99999-0001');
insert into tests.vars values
  ('ana', public.create_invite('student', '00000000-0000-0000-0000-000000000d01')),
  ('lucas', public.create_invite('instructor', '00000000-0000-0000-0000-000000000e01'));
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.claim_invite((select v from tests.vars where k = 'ana'));
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select public.claim_invite((select v from tests.vars where k = 'lucas'));
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.register_student('Bruno Díaz', '+54 9 11 5555-2222', 80::smallint, 'some');

\echo '2. without configuration nothing is queued and nothing breaks'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l0', public.request_lesson(current_date + 1, '08:00', 1, p_accept_rules => true));
do $$ begin assert tests.pushes() = 0, 'nothing queued without config'; end $$;
reset role;
insert into private.push_config (url, secret) values ('https://gestion.example/api/push', 'test-secret-0123456789abcdef');

\echo '3. devices are saved per user and app; users cannot read them'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.save_push_subscription('gestion', 'https://push.example/admin-phone', repeat('p', 87), repeat('a', 22), 'es');
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.save_push_subscription('alumnos', 'https://push.example/ana-phone', repeat('q', 87), repeat('b', 22), 'pt');
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.save_push_subscription('alumnos', 'https://push.example/bruno-phone', repeat('r', 87), repeat('c', 22), 'en');
select tests.fails($$select count(*) from public.push_subscriptions$$) as "read devices";
select tests.fails($$select public.save_push_subscription('alumnos', 'http://insecure.example/x', repeat('r', 87), repeat('c', 22), 'es')$$) as "http endpoint";
select tests.fails($$select public.save_push_subscription('otra', 'https://push.example/x', repeat('r', 87), repeat('c', 22), 'es')$$) as "unknown app";

\echo '4. a new request notifies the admins (management app), not students'
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
insert into tests.vars values ('l1', public.request_lesson(current_date + 2, '10:00', 1.5, p_accept_rules => true));
do $$
declare p jsonb := tests.last_push(); m jsonb;
begin
  assert tests.pushes() = 1, 'one request to the push function';
  assert jsonb_array_length(p -> 'messages') = 1, 'one device: the admin';
  m := p -> 'messages' -> 0;
  assert m -> 'subscription' ->> 'endpoint' = 'https://push.example/admin-phone';
  assert m -> 'subscription' -> 'keys' ->> 'auth' = repeat('a', 22);
  assert m -> 'payload' ->> 'title' = 'Nueva solicitud de clase';
  assert m -> 'payload' ->> 'body' like 'Bruno Díaz pidió el % a las 10:00 · alumno nuevo, falta el precio', m -> 'payload' ->> 'body';
  assert m -> 'payload' ->> 'url' = '/solicitudes';
  assert m -> 'payload' ->> 'app' = 'gestion';
end $$;
reset role;
do $$ begin
  assert (select url from net.http_request_queue order by id desc limit 1) = 'https://gestion.example/api/push';
  assert (select headers ->> 'x-push-secret' from net.http_request_queue order by id desc limit 1) = 'test-secret-0123456789abcdef';
end $$;

\echo '5. confirming notifies the student, in the language of the device'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.confirm_request((select v::uuid from tests.vars where k = 'l1'), 220, '00000000-0000-0000-0000-000000000e01');
do $$
declare m jsonb := tests.last_push() -> 'messages' -> 0;
begin
  assert tests.pushes() = 2;
  assert m -> 'subscription' ->> 'endpoint' = 'https://push.example/bruno-phone', 'to Bruno only';
  assert m -> 'payload' ->> 'title' = 'Lesson confirmed!', 'Bruno''s phone is in English';
  assert m -> 'payload' ->> 'body' like '% at 10:00 with Lucas Rocha';
  assert m -> 'payload' ->> 'app' = 'alumnos';
end $$;

\echo '6. moving a confirmed class notifies the student'
select public.confirm_lesson((select v::uuid from tests.vars where k = 'l1'), '00000000-0000-0000-0000-000000000e01', current_date + 2, '13:00', 1.5);
do $$ begin
  assert tests.pushes() = 3;
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'title' = 'Your lesson was moved';
  assert tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like 'Now: % at 13:00';
end $$;
-- confirming again without changes sends nothing
select public.confirm_lesson((select v::uuid from tests.vars where k = 'l1'), '00000000-0000-0000-0000-000000000e01', current_date + 2, '13:00', 1.5);
do $$ begin assert tests.pushes() = 3, 'no change, no notification'; end $$;

\echo '7. a declined request notifies the student (Portuguese)'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
insert into tests.vars values ('l2', public.request_lesson(current_date + 3, '15:00', 1, p_accept_rules => true));
do $$ begin assert tests.pushes() = 4 and tests.last_push() -> 'messages' -> 0 -> 'payload' ->> 'body' like 'Ana Silva pidió el % a las 15:00', 'admins hear of Ana''s request (she has a price: no note)'; end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select public.cancel_lesson((select v::uuid from tests.vars where k = 'l2'), 'Sin viento');
do $$
declare m jsonb := tests.last_push() -> 'messages' -> 0;
begin
  assert tests.pushes() = 5;
  assert m -> 'subscription' ->> 'endpoint' = 'https://push.example/ana-phone';
  assert m -> 'payload' ->> 'title' = 'Não conseguimos confirmar sua aula';
end $$;

\echo '8. a student cancelling notifies the admins, not the student'
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.cancel_lesson((select v::uuid from tests.vars where k = 'l1'));
do $$
declare m jsonb := tests.last_push() -> 'messages' -> 0;
begin
  assert tests.pushes() = 6;
  assert m -> 'subscription' ->> 'endpoint' = 'https://push.example/admin-phone';
  assert m -> 'payload' ->> 'title' = 'Un alumno canceló';
  assert m -> 'payload' ->> 'body' like 'Bruno Díaz canceló la clase del % a las 13:00';
end $$;

\echo '9. a device moves to the account that signs in on it; removing works'
select public.save_push_subscription('alumnos', 'https://push.example/ana-phone', repeat('q', 87), repeat('b', 22), 'es');
reset role;
do $$ begin
  assert (select user_id from public.push_subscriptions where endpoint = 'https://push.example/ana-phone') = '00000000-0000-0000-0000-0000000000d2';
  assert (select count(*) from public.push_subscriptions) = 3, 'one row per device';
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.delete_push_subscription('https://push.example/ana-phone');
reset role;
do $$ begin assert (select count(*) from public.push_subscriptions) = 2; end $$;

\echo '10. gone devices are pruned only with the secret'
set role anon;
select tests.fails($$select public.prune_push_subscriptions('wrong', array['https://push.example/admin-phone'])$$) as "wrong secret";
do $$ begin assert public.prune_push_subscriptions('test-secret-0123456789abcdef', array['https://push.example/admin-phone']) = 1; end $$;
reset role;
do $$ begin assert (select count(*) from public.push_subscriptions) = 1; end $$;

\echo '11. a broken configuration never blocks a class'
update private.push_config set url = 'https://gestion.example/api/push';
-- make pg_net fail: remove its permission for a moment
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
select public.save_push_subscription('alumnos', 'https://push.example/bruno-phone', repeat('r', 87), repeat('c', 22), 'en');
reset role;
-- make notifying fail for real: replace the sender with one that always errors
create or replace function private.notify(p_users uuid[], p_app text, p_msg jsonb) returns void
language plpgsql as $$ begin raise exception 'push service down'; end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000d2');
insert into tests.vars values ('l3', public.request_lesson(current_date + 4, '09:00', 1, p_accept_rules => true));
do $$ begin assert exists (select 1 from public.lessons where id = (select v::uuid from tests.vars where k = 'l3')), 'the class was saved'; end $$;

reset role;
\echo ''
\echo 'ALL PUSH TESTS PASSED'
rollback;
