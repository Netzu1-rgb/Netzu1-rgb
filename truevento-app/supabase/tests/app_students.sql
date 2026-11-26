-- Tests: the students app lists only students with an account. Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create function pg_temp.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
reset role;
-- a student the school already had (management app only, no account)
insert into public.students (full_name, hourly_rate, phone) values ('Carla Antigua', 200, '+55 88 99999-0009');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');

\echo '1. the students app lists only Ana (with an account); Carla stays in the management app'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
do $$ begin
  assert (select array_agg(full_name) from public.app_students()) = array['Ana Silva'], 'only students with an account';
  assert (select count(*) from public.students where full_name = 'Carla Antigua') = 1, 'nothing deleted';
end $$;

\echo '2. a student does not get the list'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin assert (select count(*) from public.app_students()) = 0; end $$;

\echo 'OK: app_students'
rollback;
