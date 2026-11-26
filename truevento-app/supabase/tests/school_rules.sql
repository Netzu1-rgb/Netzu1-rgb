-- Tests: a class can only be booked accepting the school's rules. Rolled back.
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
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.register_student('Ana Silva', '+55 88 99999-0001', 60::smallint, 'none');

\echo '1. without accepting the rules, no booking'
select tests.fails($$select public.request_lesson(current_date + 2, null, 1.5)$$) as "not accepted";
select tests.fails($$select public.request_lesson(current_date + 2, null, 1.5, p_accept_rules => false)$$) as "declined";
reset role;
do $$ begin assert (select count(*) from public.lessons) = 0; end $$;

\echo '2. accepting them books the class and keeps when they were accepted'
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.request_lesson(current_date + 2, null, 1.5, p_accept_rules => true);
reset role;
do $$ begin
  assert (select rules_accepted_at from public.lessons) between now() - interval '1 minute' and now() + interval '1 minute';
end $$;

\echo '3. classes the school schedules do not need it'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.schedule_lesson((select id from public.students), (select id from public.instructors where owner_slot = 1), current_date + 5, '10:00', 1);
reset role;
do $$ begin assert (select count(*) from public.lessons) = 2; end $$;

\echo ''
\echo 'ALL SCHOOL RULES TESTS PASSED'
rollback;
