-- Tests: a class can only be asked for with a WhatsApp number; the student's language
-- is saved for the school's messages. Rolled back at the end.
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
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;
create function tests.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@test.local');
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
-- a student the school created without a phone, invited to the app
insert into public.students (id, full_name, hourly_rate) values ('00000000-0000-0000-0000-00000000d001', 'Ana Silva', 250);
select set_config('test.code', public.create_invite('student', '00000000-0000-0000-0000-00000000d001'), false);
select tests.act_as('00000000-0000-0000-0000-0000000000d1');
select public.claim_invite(current_setting('test.code'));

\echo '1. without WhatsApp a class cannot be asked for'
select tests.fails($$select public.request_lesson(current_date + 2, '10:00', 1)$$) as "no phone";
do $$ begin assert (select count(*) from public.lessons) = 0; end $$;

\echo '2. after adding it, it works'
select public.update_my_details('+55 88 99999-1234', 60::smallint, 'none');
select public.request_lesson(current_date + 2, '10:00', 1);
do $$ begin assert (select count(*) from public.lessons where status = 'requested') = 1; end $$;

\echo '3. the language is saved on the student only, and only valid ones'
select public.set_my_lang('pt');
select public.set_my_lang('xx');
reset role;
do $$ begin assert (select lang from public.students where id = '00000000-0000-0000-0000-00000000d001') = 'pt'; end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.set_my_lang('en'); -- an admin: nothing happens
reset role;
do $$ begin assert (select count(*) from public.students where lang = 'en') = 0; end $$;

\echo '4. the school can still schedule a class for a student without a phone'
update public.students set phone = null;
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.schedule_lesson('00000000-0000-0000-0000-00000000d001', (select id from public.instructors where owner_slot = 1), current_date + 5, '09:00', 1, null);
reset role;
do $$ begin assert (select count(*) from public.lessons) = 2; end $$;

\echo ''
\echo 'ALL WHATSAPP TESTS PASSED'
rollback;
