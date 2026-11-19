-- TRUEVENTO: kiteboarding school management
-- Schema, business rules, row level security and RPCs.
--
-- Money rules live in the database so every client gets the same numbers:
--   total_amount   = round(hours * student_rate, 2)
--   instructor_pay = round(hours * instructor_rate, 2)   (always 0 for owners)
--   school_profit  = total_amount - instructor_pay
-- Rates are copied onto each class when it is saved, so later price changes
-- never alter past classes.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.school_settings (
  id                 smallint primary key default 1 check (id = 1),
  school_name        text not null default 'TRUEVENTO' check (length(trim(school_name)) between 1 and 80),
  currency           text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  setup_completed_at timestamptz,
  updated_at         timestamptz not null default now()
);

create table public.instructors (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null check (length(trim(full_name)) between 1 and 120),
  phone       text check (phone is null or length(phone) <= 40),
  kind        text not null check (kind in ('owner', 'external')),
  owner_slot  smallint unique check (owner_slot in (1, 2)),
  hourly_pay  numeric(12, 2) not null default 0 check (hourly_pay >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- owners are never paid per hour; externals never take an owner slot
  check ((kind = 'owner' and owner_slot is not null and hourly_pay = 0)
      or (kind = 'external' and owner_slot is null))
);

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  username      text,
  role          text check (role in ('admin', 'instructor')),   -- null = no access yet
  instructor_id uuid unique references public.instructors (id) on delete set null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  check (role is distinct from 'instructor' or instructor_id is not null)
);

create table public.students (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null check (length(trim(full_name)) between 1 and 120),
  phone                 text check (phone is null or length(phone) <= 40),
  start_date            date not null default current_date,
  hourly_rate           numeric(12, 2) not null check (hourly_rate >= 0 and hourly_rate < 1000000),
  default_instructor_id uuid references public.instructors (id) on delete set null,
  notes                 text check (notes is null or length(notes) <= 2000),
  active                boolean not null default true,
  created_by            uuid default auth.uid() references auth.users (id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table public.settlements (
  id             uuid primary key default gen_random_uuid(),
  instructor_id  uuid not null references public.instructors (id) on delete restrict,
  period_start   date not null,
  period_end     date not null check (period_end >= period_start),
  classes_count  integer not null check (classes_count > 0),
  total_hours    numeric(10, 2) not null,
  amount         numeric(14, 2) not null check (amount >= 0),
  paid_at        date not null,
  notes          text check (notes is null or length(notes) <= 2000),
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table public.classes (
  -- the id is generated on the device, so a class saved offline and sent twice
  -- is stored once
  id              uuid primary key default gen_random_uuid(),
  student_id      uuid not null references public.students (id) on delete restrict,
  instructor_id   uuid not null references public.instructors (id) on delete restrict,
  class_date      date not null,
  hours           numeric(5, 2) not null check (hours > 0 and hours <= 24),
  student_rate    numeric(12, 2) not null check (student_rate >= 0 and student_rate < 1000000),
  -- left empty, it is filled from the instructor record by the trigger below
  instructor_rate numeric(12, 2) not null check (instructor_rate >= 0 and instructor_rate < 1000000),
  instructor_kind text not null default 'external' check (instructor_kind in ('owner', 'external')),
  total_amount    numeric(14, 2) generated always as (round(hours * student_rate, 2)) stored,
  instructor_pay  numeric(14, 2) generated always as (round(hours * instructor_rate, 2)) stored,
  school_profit   numeric(14, 2) generated always as (round(hours * student_rate, 2) - round(hours * instructor_rate, 2)) stored,
  notes           text check (notes is null or length(notes) <= 2000),
  settlement_id   uuid references public.settlements (id) on delete set null,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index classes_date_idx on public.classes (class_date);
create index classes_instructor_date_idx on public.classes (instructor_id, class_date);
create index classes_student_idx on public.classes (student_id, class_date);
create index classes_unsettled_idx on public.classes (instructor_id, class_date) where settlement_id is null;
create index settlements_instructor_idx on public.settlements (instructor_id, period_start);
create index students_name_idx on public.students (lower(full_name));

-- ---------------------------------------------------------------- helpers

create or replace function public.current_role_name() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_role_name() is not null
$$;

create or replace function public.my_instructor_id() returns uuid
language sql stable security definer set search_path = public as $$
  select instructor_id from public.profiles where id = auth.uid() and active
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger school_settings_touch before update on public.school_settings
  for each row execute function public.touch_updated_at();
create trigger instructors_touch before update on public.instructors
  for each row execute function public.touch_updated_at();
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- every new auth user gets a profile without access; an admin grants the role
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username)
  values (new.id,
          nullif(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.raw_user_meta_data ->> 'username', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- class rules

create or replace function public.classes_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ins public.instructors;
  admin boolean := public.is_admin();
begin
  -- settled classes are frozen: their money was already paid out
  if tg_op = 'UPDATE' and old.settlement_id is not null
     and current_setting('truevento.settling', true) is distinct from 'on' then
    raise exception 'Esta clase ya está incluida en una liquidación pagada y no se puede modificar.'
      using errcode = 'P0001';
  end if;

  -- settlement_id is only written by the settlement functions
  if current_setting('truevento.settling', true) is distinct from 'on' then
    if tg_op = 'INSERT' then
      new.settlement_id := null;
    else
      new.settlement_id := old.settlement_id;
    end if;
  end if;

  if tg_op = 'UPDATE' and current_setting('truevento.settling', true) = 'on' then
    return new;   -- linking to a settlement changes nothing else
  end if;

  select * into ins from public.instructors where id = new.instructor_id;
  if not found then
    raise exception 'Instructor inexistente.' using errcode = 'P0001';
  end if;
  new.instructor_kind := ins.kind;
  if not ins.active and not admin then
    raise exception 'Tu usuario de instructor está inactivo. Hablá con la escuela.' using errcode = 'P0001';
  end if;

  if ins.kind = 'owner' then
    new.instructor_rate := 0;
  elsif not admin then
    -- instructors cannot set their own pay: it comes from their instructor record
    if tg_op = 'INSERT' then
      new.instructor_rate := ins.hourly_pay;
    else
      new.instructor_rate := old.instructor_rate;
    end if;
  elsif new.instructor_rate is null then
    new.instructor_rate := ins.hourly_pay;
  end if;

  if tg_op = 'INSERT' then
    new.created_by := coalesce(auth.uid(), new.created_by);
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger classes_before_write before insert or update on public.classes
  for each row execute function public.classes_before_write();

create or replace function public.classes_before_delete() returns trigger
language plpgsql as $$
begin
  if old.settlement_id is not null then
    raise exception 'Esta clase ya está incluida en una liquidación pagada y no se puede eliminar.'
      using errcode = 'P0001';
  end if;
  return old;
end $$;

create trigger classes_before_delete before delete on public.classes
  for each row execute function public.classes_before_delete();

-- owners keep their slot and kind; nobody turns an external into an owner
create or replace function public.instructors_before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('truevento.setup', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.kind := 'external';
    new.owner_slot := null;
  else
    new.kind := old.kind;
    new.owner_slot := old.owner_slot;
    if old.kind = 'owner' then
      new.hourly_pay := 0;
      new.active := true;
    end if;
  end if;
  return new;
end $$;

create trigger instructors_before_write before insert or update on public.instructors
  for each row execute function public.instructors_before_write();

-- ---------------------------------------------------------------- RPCs

-- whether the first-run setup is done (callable before login)
create or replace function public.setup_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'completed', exists (select 1 from public.school_settings where setup_completed_at is not null),
    'school_name', coalesce((select school_name from public.school_settings), 'TRUEVENTO'))
$$;

-- first-run setup: creates the school, the two owners and makes the caller admin
create or replace function public.setup_school(
  p_school_name text, p_owner1 text, p_owner2 text, p_currency text default 'BRL', p_me smallint default 1)
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  owner_id uuid;
begin
  if me is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  if p_me not in (1, 2) then
    raise exception 'Elegí cuál de los dos dueños sos.' using errcode = '22023';
  end if;
  if coalesce(trim(p_owner1), '') = '' or coalesce(trim(p_owner2), '') = '' then
    raise exception 'Completá el nombre de los dos dueños.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('truevento.setup'));
  if exists (select 1 from public.school_settings where setup_completed_at is not null) then
    raise exception 'La escuela ya está configurada.' using errcode = 'P0001';
  end if;

  perform set_config('truevento.setup', 'on', true);
  insert into public.school_settings (id, school_name, currency, setup_completed_at)
  values (1, coalesce(nullif(trim(p_school_name), ''), 'TRUEVENTO'), upper(coalesce(p_currency, 'BRL')), now())
  on conflict (id) do update set school_name = excluded.school_name, currency = excluded.currency,
                                 setup_completed_at = excluded.setup_completed_at;

  insert into public.instructors (full_name, kind, owner_slot, hourly_pay)
  values (trim(p_owner1), 'owner', 1, 0), (trim(p_owner2), 'owner', 2, 0);

  select id into owner_id from public.instructors where owner_slot = p_me;
  insert into public.profiles (id, role, instructor_id, full_name)
  values (me, 'admin', owner_id, case p_me when 1 then trim(p_owner1) else trim(p_owner2) end)
  on conflict (id) do update set role = 'admin', instructor_id = excluded.instructor_id,
                                 full_name = coalesce(public.profiles.full_name, excluded.full_name), active = true;
  perform set_config('truevento.setup', 'off', true);
end $$;

-- edit school name, currency and owner names after setup (admins only)
create or replace function public.update_school_settings(
  p_school_name text, p_currency text, p_owner1 text, p_owner2 text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar la configuración.' using errcode = '42501';
  end if;
  if coalesce(trim(p_owner1), '') = '' or coalesce(trim(p_owner2), '') = '' or coalesce(trim(p_school_name), '') = '' then
    raise exception 'Completá todos los campos.' using errcode = '22023';
  end if;
  update public.school_settings
     set school_name = trim(p_school_name), currency = upper(p_currency)
   where id = 1;
  update public.instructors set full_name = trim(p_owner1) where owner_slot = 1;
  update public.instructors set full_name = trim(p_owner2) where owner_slot = 2;
end $$;

-- pay an external instructor for every unsettled class in a period.
-- p_expected_* are the numbers the admin saw; if classes changed meanwhile
-- the call fails instead of paying a different amount.
create or replace function public.pay_settlement(
  p_instructor_id uuid, p_from date, p_to date, p_paid_at date,
  p_expected_count integer, p_expected_amount numeric, p_notes text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  ins public.instructors;
  n integer;
  hrs numeric;
  amt numeric;
  sid uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar pagos.' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'Período inválido.' using errcode = '22023';
  end if;

  select * into ins from public.instructors where id = p_instructor_id for update;
  if not found then
    raise exception 'Instructor inexistente.' using errcode = 'P0001';
  end if;
  if ins.kind = 'owner' then
    raise exception 'Los dueños no generan pagos de instructor.' using errcode = 'P0001';
  end if;

  -- lock the classes so two payments cannot take the same ones
  perform 1 from public.classes
   where instructor_id = p_instructor_id and settlement_id is null
     and class_date between p_from and p_to
   for update;

  select count(*), coalesce(sum(hours), 0), coalesce(sum(instructor_pay), 0)
    into n, hrs, amt
    from public.classes
   where instructor_id = p_instructor_id and settlement_id is null
     and class_date between p_from and p_to;

  if n = 0 then
    raise exception 'No hay clases pendientes de pago en ese período.' using errcode = 'P0001';
  end if;
  if n <> p_expected_count or amt <> p_expected_amount then
    raise exception 'Las clases del período cambiaron mientras revisabas. Volvé a calcular la liquidación.'
      using errcode = 'P0001';
  end if;

  insert into public.settlements (instructor_id, period_start, period_end, classes_count, total_hours,
                                  amount, paid_at, notes)
  values (p_instructor_id, p_from, p_to, n, hrs, amt, coalesce(p_paid_at, current_date), nullif(trim(p_notes), ''))
  returning id into sid;

  perform set_config('truevento.settling', 'on', true);
  update public.classes set settlement_id = sid
   where instructor_id = p_instructor_id and settlement_id is null
     and class_date between p_from and p_to;
  perform set_config('truevento.settling', 'off', true);
  return sid;
end $$;

-- undo a payment registered by mistake: its classes become pending again
create or replace function public.cancel_settlement(p_settlement_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede anular pagos.' using errcode = '42501';
  end if;
  perform set_config('truevento.settling', 'on', true);
  update public.classes set settlement_id = null where settlement_id = p_settlement_id;
  perform set_config('truevento.settling', 'off', true);
  delete from public.settlements where id = p_settlement_id;
  if not found then
    raise exception 'Liquidación inexistente.' using errcode = 'P0001';
  end if;
end $$;

-- ---------------------------------------------------------------- row level security

alter table public.school_settings enable row level security;
alter table public.instructors     enable row level security;
alter table public.profiles        enable row level security;
alter table public.students        enable row level security;
alter table public.classes         enable row level security;
alter table public.settlements     enable row level security;

create policy settings_read on public.school_settings for select to authenticated
  using (public.has_access());

-- instructors only see their own record (and with it, only their own pay)
create policy instructors_read on public.instructors for select to authenticated
  using (public.is_admin() or id = public.my_instructor_id());
create policy instructors_insert on public.instructors for insert to authenticated
  with check (public.is_admin());
create policy instructors_update on public.instructors for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy students_read on public.students for select to authenticated
  using (public.has_access());
create policy students_insert on public.students for insert to authenticated
  with check (public.has_access());
create policy students_update on public.students for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy students_delete on public.students for delete to authenticated
  using (public.is_admin());

create policy classes_read on public.classes for select to authenticated
  using (public.is_admin() or instructor_id = public.my_instructor_id());
create policy classes_insert on public.classes for insert to authenticated
  with check (public.is_admin() or (public.has_access() and instructor_id = public.my_instructor_id()));
create policy classes_update on public.classes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy classes_delete on public.classes for delete to authenticated
  using (public.is_admin());

create policy settlements_read on public.settlements for select to authenticated
  using (public.is_admin() or instructor_id = public.my_instructor_id());

-- table privileges: settings, profiles and settlements change only through RPCs
-- or the service role
revoke all on public.school_settings, public.instructors, public.profiles, public.students,
              public.classes, public.settlements from anon, authenticated;
grant select on public.school_settings, public.profiles, public.settlements to authenticated;
grant select, insert, update on public.instructors to authenticated;
grant select, insert, update, delete on public.students, public.classes to authenticated;

revoke execute on function public.setup_school(text, text, text, text, smallint) from public, anon;
revoke execute on function public.update_school_settings(text, text, text, text) from public, anon;
revoke execute on function public.pay_settlement(uuid, date, date, date, integer, numeric, text) from public, anon;
revoke execute on function public.cancel_settlement(uuid) from public, anon;
grant execute on function public.setup_school(text, text, text, text, smallint) to authenticated;
grant execute on function public.update_school_settings(text, text, text, text) to authenticated;
grant execute on function public.pay_settlement(uuid, date, date, date, integer, numeric, text) to authenticated;
grant execute on function public.cancel_settlement(uuid) to authenticated;
grant execute on function public.setup_status() to anon, authenticated;
