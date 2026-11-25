-- Tests for joining instructors saved more than once with the same name
-- (migration 20261126000000_merge_instructors.sql). Rolled back at the end.
\set ON_ERROR_STOP on
\set QUIET on
begin;
insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fran@test.local');
select set_config('request.jwt.claims', json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);
select set_config('role', 'authenticated', true);
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Sebastián Comasco', 'BRL', 1::smallint);

\echo '1. "Fran" saved three times (one per class), "Lucas" once'
insert into public.instructors (id, full_name, hourly_pay, active, created_at) values
  ('00000000-0000-0000-0000-00000000f001', 'Fran', 100, false, now() - interval '3 days'),
  ('00000000-0000-0000-0000-00000000f002', 'fran ', 100, false, now() - interval '2 days'),
  ('00000000-0000-0000-0000-00000000f003', 'Frán', 120, false, now() - interval '1 day'),
  ('00000000-0000-0000-0000-00000000e001', 'Lucas Rocha', 80, true, now());
insert into public.students (id, full_name, hourly_rate, default_instructor_id) values
  ('00000000-0000-0000-0000-00000000d001', 'Ana Silva', 280, '00000000-0000-0000-0000-00000000f002');
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate) values
  ('00000000-0000-0000-0000-00000000c001', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000f001', '2026-11-03', 1.5, 280, 100),
  ('00000000-0000-0000-0000-00000000c002', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000f002', '2026-11-20', 2,   280, 100),
  ('00000000-0000-0000-0000-00000000c003', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000f003', '2026-11-21', 2.5, 280, 120),
  ('00000000-0000-0000-0000-00000000c004', '00000000-0000-0000-0000-00000000d001', '00000000-0000-0000-0000-00000000e001', '2026-11-21', 1,   280, 80);
-- the first Fran was already paid: that class is frozen
select public.pay_settlement('00000000-0000-0000-0000-00000000f001', '2026-11-01', '2026-11-10', '2026-11-10', 1, 150);
reset role;
-- the third Fran has a login
update public.profiles set instructor_id = null where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.profiles (id, full_name, role, instructor_id) values
  ('00000000-0000-0000-0000-0000000000b1', 'Fran', 'instructor', '00000000-0000-0000-0000-00000000f003')
  on conflict (id) do update set instructor_id = excluded.instructor_id, role = 'instructor';
create temp table before_classes as select * from public.classes;

\echo '2. run the migration'
\ir ../migrations/20261126000000_merge_instructors.sql

\echo '3. one Fran with all classes, payouts and links; money unchanged'
do $$
declare f public.instructors;
begin
  assert (select count(*) from public.instructors where public.instructor_key(full_name) = 'fran') = 1, 'one Fran';
  select * into f from public.instructors where public.instructor_key(full_name) = 'fran';
  assert f.active, 'a returning instructor stays in the list';
  assert f.hourly_pay = 120, 'latest pay';
  assert (select count(*) from public.classes where instructor_id = f.id) = 3, 'all of Fran''s classes';
  assert (select sum(hours) from public.classes where instructor_id = f.id) = 6, 'hours added up';
  assert (select instructor_id from public.settlements) = f.id, 'the payout follows';
  assert (select default_instructor_id from public.students) = f.id, 'the student''s usual instructor follows';
  assert (select instructor_id from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = f.id, 'the login follows';
  assert (select count(*) from public.instructors where full_name = 'Lucas Rocha') = 1, 'others untouched';
  assert (select count(*) from public.instructors where kind = 'owner') = 2, 'owners untouched';
  -- every class identical except the instructor record
  assert not exists (
    select 1 from before_classes b join public.classes c using (id)
     where (b.class_date, b.hours, b.student_rate, b.instructor_rate, b.total_amount, b.instructor_pay, b.school_profit, b.settlement_id, b.student_id)
           is distinct from (c.class_date, c.hours, c.student_rate, c.instructor_rate, c.total_amount, c.instructor_pay, c.school_profit, c.settlement_id, c.student_id)), 'money unchanged';
  assert (select count(*) from public.classes) = 4;
end $$;
-- settled classes are still frozen afterwards
do $$ begin
  begin
    update public.classes set hours = 9 where id = '00000000-0000-0000-0000-00000000c001';
    raise exception 'settled class was editable';
  exception when others then
    if sqlerrm = 'settled class was editable' then raise; end if;
  end;
end $$;

\echo '4. running it again changes nothing'
\ir ../migrations/20261126000000_merge_instructors.sql
do $$ begin assert (select count(*) from public.instructors) = 4; end $$;

\echo ''
\echo 'ALL MERGE TESTS PASSED'
rollback;
