-- Business rule and permission tests. Runs inside a transaction that is rolled back,
-- so it never leaves data behind. Usage: npm run db:test (needs `supabase start`).
\set ON_ERROR_STOP on
\set QUIET on
begin;
create schema tests;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner1@test.local'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ext@test.local'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'nobody@test.local');

create function tests.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  select set_config('role', 'authenticated', true);
$$;
-- runs a statement that must fail and returns the error message
create function tests.fails(stmt text) returns text language plpgsql as $$
begin
  execute stmt;
  raise exception 'EXPECTED FAILURE, but it succeeded: %', stmt;
exception when others then
  if sqlerrm like 'EXPECTED FAILURE%' then raise; end if;
  return sqlerrm;
end $$;
-- runs a statement and returns how many rows it touched
create function tests.affected(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;
grant usage on schema tests to authenticated;
grant execute on all functions in schema tests to authenticated;

\echo '1. first-run setup makes the caller admin, only once'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
do $$ begin assert (public.setup_status() ->> 'completed')::boolean = false; end $$;
select public.setup_school('TRUEVENTO', 'Victoria Linde', 'Socio Dos', 'BRL', 1::smallint);
do $$ begin
  assert (public.setup_status() ->> 'completed')::boolean, 'setup marked complete';
  assert public.is_admin(), 'setup caller is admin';
  assert (select count(*) from public.instructors where kind = 'owner') = 2, 'two owners created';
end $$;
select tests.fails($$select public.setup_school('X', 'a', 'b', 'BRL', 1::smallint)$$) as "second setup";

\echo '2. a login without a role sees and writes nothing'
select tests.act_as('00000000-0000-0000-0000-0000000000c1');
do $$ begin
  assert (select count(*) from public.students) = 0;
  assert (select count(*) from public.instructors) = 0;
  assert (select count(*) from public.school_settings) = 0;
end $$;
select tests.fails($$insert into public.students (full_name, hourly_rate) values ('x', 1)$$) as "no-role insert";

\echo '3. admin adds an external instructor (cannot fake an owner) and a student'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
insert into public.instructors (id, full_name, hourly_pay, kind, owner_slot)
values ('00000000-0000-0000-0000-000000000e01', 'Sebastian Comasco', 50, 'owner', 2);
do $$ begin
  assert (select kind = 'external' and owner_slot is null from public.instructors
           where id = '00000000-0000-0000-0000-000000000e01'), 'new instructors are always external';
end $$;
insert into public.students (id, full_name, hourly_rate) values ('00000000-0000-0000-0000-000000000d01', 'Alumno Uno', 200);
update public.instructors set hourly_pay = 80 where owner_slot = 1;
do $$ begin assert (select hourly_pay from public.instructors where owner_slot = 1) = 0, 'owner pay stays 0'; end $$;

reset role;
-- the user API links a login to an instructor with the service role
update public.profiles set role = 'instructor', instructor_id = '00000000-0000-0000-0000-000000000e01'
 where id = '00000000-0000-0000-0000-0000000000b1';

\echo '4. instructor logs a class: their pay comes from their record, totals are computed'
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate)
values ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-000000000d01',
        '00000000-0000-0000-0000-000000000e01', '2026-11-03', 1.5, 200, 999);
do $$
declare c public.classes;
begin
  select * into c from public.classes where id = '00000000-0000-0000-0000-000000000c01';
  assert c.instructor_rate = 50, 'instructor cannot choose their own pay';
  assert c.total_amount = 300.00 and c.instructor_pay = 75.00 and c.school_profit = 225.00, 'totals';
  assert c.instructor_kind = 'external';
  assert c.settlement_id is null;
end $$;
select tests.fails($$insert into public.classes (student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000d01', (select id from public.instructors limit 0), '2026-11-03', 1, 200)$$)
  as "class without instructor";
select tests.fails($$insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000c01', '00000000-0000-0000-0000-000000000d01',
          '00000000-0000-0000-0000-000000000e01', '2026-11-03', 1.5, 200)$$) as "same offline id twice";
select tests.fails($$insert into public.classes (student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000e01', '2026-11-03', 0, 200)$$)
  as "zero hours";
select tests.fails($$select public.pay_settlement('00000000-0000-0000-0000-000000000e01', '2026-11-01', '2026-11-30',
  '2026-11-30', 1, 75)$$) as "instructor cannot pay";
select tests.fails($$select public.update_school_settings('X', 'USD', 'a', 'b')$$) as "instructor cannot change settings";
do $$ begin
  assert (select count(*) from public.instructors) = 1, 'instructors only see their own record';
  assert tests.affected($q$update public.classes set hours = 10$q$) = 0, 'instructors cannot edit classes';
  assert tests.affected($q$update public.students set hourly_rate = 1$q$) = 0, 'instructors cannot change prices';
  assert tests.affected($q$delete from public.classes$q$) = 0, 'instructors cannot delete classes';
end $$;

\echo '5. instructors cannot log classes for someone else'
reset role;
select set_config('test.owner1', (select id::text from public.instructors where owner_slot = 1), false);
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select tests.fails(format($$insert into public.classes (student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000d01', %L, '2026-11-03', 1, 200)$$, current_setting('test.owner1')))
  as "class for an owner";

\echo '5b. an inactive instructor cannot log classes'
reset role;
update public.instructors set active = false where id = '00000000-0000-0000-0000-000000000e01';
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
select tests.fails($$insert into public.classes (student_id, instructor_id, class_date, hours, student_rate)
  values ('00000000-0000-0000-0000-000000000d01', '00000000-0000-0000-0000-000000000e01', '2026-11-03', 1, 200)$$)
  as "inactive instructor";
reset role;
update public.instructors set active = true where id = '00000000-0000-0000-0000-000000000e01';

\echo '6. admin: owner classes never carry instructor pay; rounding matches money rules'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate)
values ('00000000-0000-0000-0000-000000000c02', '00000000-0000-0000-0000-000000000d01',
        current_setting('test.owner1')::uuid, '2026-11-04', 1.5, 33.33, 100);
do $$
declare c public.classes;
begin
  select * into c from public.classes where id = '00000000-0000-0000-0000-000000000c02';
  assert c.instructor_rate = 0 and c.instructor_pay = 0, 'owners are not paid per class';
  assert c.total_amount = 50.00, '1.5 x 33.33 = 49.995 rounds to 50.00';
  assert c.school_profit = 50.00;
end $$;
-- admin may set a one-off pay for an external class
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, instructor_rate)
values ('00000000-0000-0000-0000-000000000c03', '00000000-0000-0000-0000-000000000d01',
        '00000000-0000-0000-0000-000000000e01', '2026-11-20', 2, 180, 60);
-- an external class without a pay takes the instructor's rate
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate)
values ('00000000-0000-0000-0000-000000000c04', '00000000-0000-0000-0000-000000000d01',
        '00000000-0000-0000-0000-000000000e01', '2026-12-02', 1, 200);
do $$ begin
  assert (select instructor_pay from public.classes where id = '00000000-0000-0000-0000-000000000c03') = 120;
  assert (select instructor_rate from public.classes where id = '00000000-0000-0000-0000-000000000c04') = 50;
end $$;

\echo '7. price changes do not touch past classes'
update public.students set hourly_rate = 999 where id = '00000000-0000-0000-0000-000000000d01';
update public.instructors set hourly_pay = 999 where id = '00000000-0000-0000-0000-000000000e01';
do $$ begin
  assert (select total_amount from public.classes where id = '00000000-0000-0000-0000-000000000c01') = 300;
  assert (select instructor_pay from public.classes where id = '00000000-0000-0000-0000-000000000c01') = 75;
end $$;

\echo '8. settlements: exact amounts, no double payment, settled classes frozen'
select tests.fails($$select public.pay_settlement('00000000-0000-0000-0000-000000000e01', '2026-11-01', '2026-11-30',
  '2026-11-30', 2, 100)$$) as "stale amount";
select tests.fails(format($$select public.pay_settlement(%L, '2026-11-01', '2026-11-30', '2026-11-30', 1, 0)$$,
  current_setting('test.owner1'))) as "owner payment";
select set_config('test.s1', public.pay_settlement('00000000-0000-0000-0000-000000000e01', '2026-11-01', '2026-11-30',
  '2026-11-30', 2, 195, 'pix')::text, false);
do $$
declare s public.settlements;
begin
  select * into s from public.settlements where id = current_setting('test.s1')::uuid;
  assert s.classes_count = 2 and s.total_hours = 3.5 and s.amount = 195, 'settlement totals';
  assert (select count(*) from public.classes where settlement_id = s.id) = 2;
  assert (select settlement_id from public.classes where id = '00000000-0000-0000-0000-000000000c04') is null,
    'class outside the period stays pending';
end $$;
select tests.fails($$select public.pay_settlement('00000000-0000-0000-0000-000000000e01', '2026-11-01', '2026-11-30',
  '2026-11-30', 2, 195)$$) as "pay same classes twice";
select tests.fails($$update public.classes set hours = 3 where id = '00000000-0000-0000-0000-000000000c01'$$) as "edit settled class";
select tests.fails($$delete from public.classes where id = '00000000-0000-0000-0000-000000000c01'$$) as "delete settled class";
-- settlement links are only written by pay/cancel; direct writes are ignored
update public.classes set settlement_id = current_setting('test.s1')::uuid
 where id = '00000000-0000-0000-0000-000000000c04';
do $$ begin
  assert (select settlement_id from public.classes where id = '00000000-0000-0000-0000-000000000c04') is null,
    'direct settlement link ignored';
end $$;

\echo '9. the instructor sees their own settlement'
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
do $$ begin assert (select count(*) from public.settlements) = 1; end $$;

\echo '10. cancelling a settlement makes its classes pending again'
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
select public.cancel_settlement(current_setting('test.s1')::uuid);
do $$ begin
  assert (select count(*) from public.classes where settlement_id is not null) = 0;
  assert (select count(*) from public.settlements) = 0;
end $$;
update public.classes set hours = 2 where id = '00000000-0000-0000-0000-000000000c01';
do $$ begin
  assert (select total_amount from public.classes where id = '00000000-0000-0000-0000-000000000c01') = 400,
    'editing keeps the stored rate: 2 x 200';
end $$;

\echo '11. settings editable by admins'
select public.update_school_settings('Truevento Kiteschool', 'ARS', 'Victoria L.', 'Socio 2');
do $$ begin
  assert (select currency from public.school_settings) = 'ARS';
  assert (select full_name from public.instructors where owner_slot = 2) = 'Socio 2';
end $$;

\echo '12. special price: a fixed total per class (offers, packages)'
reset role;
update public.instructors set hourly_pay = 50 where id = '00000000-0000-0000-0000-000000000e01';
select tests.act_as('00000000-0000-0000-0000-0000000000b1');
insert into public.classes (id, student_id, instructor_id, class_date, hours, student_rate, fixed_total, price_note)
values ('00000000-0000-0000-0000-000000000c05', '00000000-0000-0000-0000-000000000d01',
        '00000000-0000-0000-0000-000000000e01', '2026-12-05', 3, 200, 100, '  Oferta 3x1  ');
do $$
declare c public.classes;
begin
  select * into c from public.classes where id = '00000000-0000-0000-0000-000000000c05';
  assert c.total_amount = 100, 'fixed total is what the student pays';
  assert c.student_rate = 33.33, 'price per hour kept for reports';
  assert c.instructor_pay = 150, 'instructor still paid per hour: 3 x 50';
  assert c.school_profit = -50, 'profit can be negative on an offer';
  assert c.price_note = 'Oferta 3x1', 'note trimmed';
end $$;
select tests.act_as('00000000-0000-0000-0000-0000000000a1');
update public.classes set fixed_total = null, student_rate = 200 where id = '00000000-0000-0000-0000-000000000c05';
do $$ begin
  assert (select total_amount from public.classes where id = '00000000-0000-0000-0000-000000000c05') = 600,
    'back to hourly: 3 x 200';
end $$;

\echo 'ALL TESTS PASSED'
rollback;
