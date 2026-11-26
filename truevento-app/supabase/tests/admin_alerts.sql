-- Tests: notices for admins also reach an admin's devices in the students app. Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create function pg_temp.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create function pg_temp.last_push() returns jsonb language sql security definer as $$
  select convert_from(body, 'UTF8')::jsonb from net.http_request_queue order by id desc limit 1
$$;
delete from net.http_request_queue;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin2@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local'),
  ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bia@test.local');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
reset role;
-- a second admin who works only from the students app
insert into public.profiles (id, role, full_name, username, active) values ('00000000-0000-0000-0000-0000000000a2', 'admin', 'Administración', 'adm', true)
  on conflict (id) do update set role = 'admin', active = true;
insert into private.push_config (url, secret) values ('https://g.example/api/push', 'test-secret-0123456789abcdef');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select public.save_push_subscription('alumnos', 'https://push.example/admin2-alumnos', repeat('p', 87), repeat('a', 22), 'es');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.save_push_subscription('gestion', 'https://push.example/admin1-gestion', repeat('p', 87), repeat('a', 22), 'es');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d2');
select public.register_student('Bia Costa', '+55 88 99999-0002', 55::smallint, 'none');
select public.save_push_subscription('alumnos', 'https://push.example/bia-phone', repeat('q', 87), repeat('b', 22), 'pt');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');

\echo '1. a new request reaches the admin in the management app and the admin in the students app'
select public.request_lesson(current_date + 2, null, 1.5, p_accept_rules => true);
reset role;
do $$
declare m jsonb := pg_temp.last_push() -> 'messages';
begin
  assert jsonb_array_length(m) = 2, 'two admin devices, got ' || m::text;
  assert (select count(*) from jsonb_array_elements(m) e where e -> 'subscription' ->> 'endpoint' = 'https://push.example/admin1-gestion'
          and e -> 'payload' ->> 'url' = '/solicitudes' and e -> 'payload' ->> 'app' = 'gestion') = 1, 'management device';
  assert (select count(*) from jsonb_array_elements(m) e where e -> 'subscription' ->> 'endpoint' = 'https://push.example/admin2-alumnos'
          and e -> 'payload' ->> 'url' = '/' and e -> 'payload' ->> 'app' = 'alumnos') = 1, 'students-app device opens home';
  assert not exists (select 1 from jsonb_array_elements(m) e where e -> 'subscription' ->> 'endpoint' = 'https://push.example/bia-phone'), 'no student gets it';
end $$;

\echo 'OK: admin_alerts'
rollback;
