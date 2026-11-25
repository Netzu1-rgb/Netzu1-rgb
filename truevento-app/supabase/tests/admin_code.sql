-- Tests for the school's admin code in the students app. Rolled back at the end.
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
grant usage on schema tests to authenticated, anon;
grant execute on all functions in schema tests to authenticated, anon;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'escuela@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juan@test.local'),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'vicky@test.local'),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'otro@test.local'),
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tarde@test.local');
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);
reset role;
-- the school's account is linked to no owner here; the code works twice
update public.profiles set instructor_id = null where id = '00000000-0000-0000-0000-0000000000a1';
insert into private.admin_codes (code_hash, uses_left, expires_at) values (public.admin_code_hash('TESTADM9'), 2, now() + interval '30 days');

\echo '1. the code is recognised (any case), nothing is revealed for a wrong one'
set role anon;
do $$ begin
  assert public.invite_preview('testadm9') ->> 'kind' = 'admin';
  assert public.invite_preview('Test Adm 9') ->> 'kind' = 'admin';
  assert public.invite_preview('TESTADM8') is null;
end $$;
select tests.fails($$select public.claim_admin_code('TESTADM9', 'Juan')$$) as "anon cannot claim";
select tests.fails($$select count(*) from private.admin_codes$$) as "codes are private";
reset role;

\echo '2. first use: an admin with their name'
select tests.act_as('00000000-0000-0000-0000-0000000000a2');
select tests.fails($$select public.claim_admin_code('TESTADM8', 'Juan Musarra')$$) as "wrong code";
select tests.fails($$select public.claim_admin_code('TESTADM9', 'J')$$) as "name required";
select public.claim_admin_code('TestAdm9', 'Juan Musarra');
do $$ begin assert (public.app_me() ->> 'role') = 'admin' and (public.app_me() ->> 'full_name') = 'Juan Musarra'; end $$;
select tests.fails($$select public.claim_admin_code('TESTADM9', 'Juan Musarra')$$) as "already linked";

\echo '3. Victoria Linde: admin linked to her owner record'
select tests.act_as('00000000-0000-0000-0000-0000000000a3');
select public.claim_admin_code('TESTADM9', '  victoria   linde ');
reset role;
do $$
declare p public.profiles;
begin
  select * into p from public.profiles where id = '00000000-0000-0000-0000-0000000000a3';
  assert p.role = 'admin' and p.full_name = 'Victoria Linde', 'admin named as the owner';
  assert p.instructor_id = (select id from public.instructors where owner_slot = 1), 'linked to her classes';
  assert (select uses_left from private.admin_codes) = 0;
end $$;

\echo '4. used up: nobody else can use it'
set role anon;
do $$ begin assert public.invite_preview('TESTADM9') is null, 'no longer valid'; end $$;
reset role;
select tests.act_as('00000000-0000-0000-0000-0000000000a4');
select tests.fails($$select public.claim_admin_code('TESTADM9', 'Otro')$$) as "used up";
reset role;
do $$ begin assert (select role from public.profiles where id = '00000000-0000-0000-0000-0000000000a4') is distinct from 'admin'; end $$;

\echo '5. an expired code does not work'
update private.admin_codes set uses_left = 5, expires_at = now() - interval '1 minute';
select tests.act_as('00000000-0000-0000-0000-0000000000a5');
select tests.fails($$select public.claim_admin_code('TESTADM9', 'Tarde')$$) as "expired";
reset role;

\echo '6. regular invitations still work'
select tests.act_as('00000000-0000-0000-0000-0000000000a2');
insert into public.students (id, full_name, hourly_rate, phone) values ('00000000-0000-0000-0000-00000000d001', 'Ana Silva', 250, '+55 88 99999-0001');
select set_config('test.code', public.create_invite('student', '00000000-0000-0000-0000-00000000d001'), false);
set role anon;
do $$ begin assert public.invite_preview(current_setting('test.code')) ->> 'first_name' = 'Ana'; end $$;
reset role;
select tests.act_as('00000000-0000-0000-0000-0000000000a4');
select public.claim_invite(current_setting('test.code'));
do $$ begin assert (public.app_me() ->> 'role') = 'student'; end $$;
reset role;

\echo ''
\echo 'ALL ADMIN CODE TESTS PASSED'
rollback;
