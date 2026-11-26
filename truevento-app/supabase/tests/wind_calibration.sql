-- Tests: the school's wind measurements calibrate the forecast. Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
create function pg_temp.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
create function pg_temp.fails(stmt text) returns text language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED FAILURE, but it succeeded: %', stmt;
exception when others then
  if sqlerrm like 'EXPECTED FAILURE%' then raise; end if;
  return sqlerrm;
end $$;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');

\echo '1. without measurements, no correction'
do $$ begin assert (select factor = 1 and count = 0 from public.wind_calibration()); end $$;

\echo '2. a student cannot add measurements'
select pg_temp.fails($$select public.add_wind_observation(20, 16)$$) as "student";

\echo '3. two measurements are not enough; the third one sets the correction (median)'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select public.add_wind_observation(20, 16);   -- 1.25
select public.add_wind_observation(18, 15);   -- 1.20
do $$ begin assert (select factor = 1 and count = 2 from public.wind_calibration()), 'needs 3'; end $$;
select public.add_wind_observation(26, 20);   -- 1.30
do $$ begin assert (select factor = 1.25 and count = 3 from public.wind_calibration()), 'median of 1.20, 1.25, 1.30'; end $$;

\echo '4. calm hours do not count; the correction is capped; bad values are refused'
select public.add_wind_observation(10, 3);    -- forecast under 6 kn: left out
do $$ begin assert (select count = 3 from public.wind_calibration()); end $$;
select pg_temp.fails($$select public.add_wind_observation(80, 20)$$) as "out of range";
select public.add_wind_observation(60, 20);
select public.add_wind_observation(60, 20);
select public.add_wind_observation(60, 20);
do $$ begin assert (select factor = 1.5 from public.wind_calibration()), 'capped at 1.5'; end $$;

\echo '5. old measurements stop counting; a wrong one can be deleted'
reset role;
update public.wind_observations set observed_at = now() - interval '60 days' where measured_kn = 60;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
do $$ begin assert (select factor = 1.25 and count = 3 from public.wind_calibration()), 'old ones out'; end $$;
select public.delete_wind_observation((select id from public.wind_observations where measured_kn = 26));
do $$ begin assert (select factor = 1 and count = 2 from public.wind_calibration()), 'after deleting'; end $$;

\echo '6. a student reads the correction but not the measurements'
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
do $$ begin
  assert (select count = 2 from public.wind_calibration());
  assert (select count(*) from public.wind_observations) = 0, 'no rows for a student';
end $$;

\echo 'OK: wind_calibration'
rollback;
