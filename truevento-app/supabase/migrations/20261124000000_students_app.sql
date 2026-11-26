-- TRUEVENTO: app for students and instructors.
-- Adds student logins (by invite code), the class agenda, progress by level,
-- notes after each class and announcements. Money stays visible to the school
-- only: students read their own data through functions that return no prices.

-- ---------------------------------------------------------------- profiles

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('admin', 'instructor', 'student'));

alter table public.profiles
  add column student_id uuid unique references public.students (id) on delete set null;
alter table public.profiles add constraint profiles_student_link_check
  check (role is distinct from 'student' or student_id is not null);

-- an instructor login is one per instructor; owners may have several admin
-- logins (the school's own account and their personal one)
alter table public.profiles drop constraint if exists profiles_instructor_id_key;
create unique index profiles_instructor_login_idx on public.profiles (instructor_id)
  where role = 'instructor';

-- "access" means school staff: students get their own functions and policies
create or replace function public.has_access() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('admin', 'instructor'), false)
$$;

create or replace function public.my_student_id() returns uuid
language sql stable security definer set search_path = public as $$
  select student_id from public.profiles where id = auth.uid() and active and role = 'student'
$$;

-- ---------------------------------------------------------------- students

-- students can sign up by themselves in the app: their record exists before
-- the school sets their price, and carries the data they give
alter table public.students alter column hourly_rate drop not null;
alter table public.students
  add column weight_kg      smallint check (weight_kg is null or weight_kg between 20 and 200),
  add column experience     text check (experience in ('none', 'some', 'independent')),
  add column self_registered boolean not null default false,
  -- when the student accepted the privacy policy in the app (LGPD)
  add column privacy_accepted_at timestamptz;

-- ---------------------------------------------------------------- tables

-- one-time codes the school sends to a student or instructor to join the app
create table public.app_invites (
  code          text primary key check (code ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}$'),
  kind          text not null check (kind in ('student', 'instructor')),
  student_id    uuid references public.students (id) on delete cascade,
  instructor_id uuid references public.instructors (id) on delete cascade,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default now() + interval '30 days',
  used_by       uuid references auth.users (id) on delete set null,
  used_at       timestamptz,
  check ((kind = 'student' and student_id is not null and instructor_id is null)
      or (kind = 'instructor' and instructor_id is not null and student_id is null))
);

-- the learning path: skills grouped by level
create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  level       smallint not null check (level between 1 and 9),
  position    smallint not null default 0,
  name        text not null check (length(trim(name)) between 1 and 80),
  description text check (description is null or length(description) <= 300),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.student_skills (
  student_id  uuid not null references public.students (id) on delete cascade,
  skill_id    uuid not null references public.skills (id) on delete cascade,
  status      text not null check (status in ('learning', 'done')),
  updated_by  uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (student_id, skill_id)
);

-- the agenda: planned classes. When one is given it becomes a class in the
-- school's records (classes), which is where the money lives.
create table public.lessons (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  instructor_id uuid references public.instructors (id) on delete set null,
  lesson_date   date not null,
  start_time    time not null,
  hours         numeric(4, 2) not null check (hours > 0 and hours <= 8 and hours * 4 = trunc(hours * 4)),
  status        text not null default 'requested'
                check (status in ('requested', 'confirmed', 'cancelled', 'done')),
  student_note  text check (student_note is null or length(student_note) <= 500),
  staff_note    text check (staff_note is null or length(staff_note) <= 500),
  class_id      uuid unique references public.classes (id) on delete set null,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.lesson_notes (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.students (id) on delete cascade,
  instructor_id uuid references public.instructors (id) on delete set null,
  lesson_id     uuid references public.lessons (id) on delete set null,
  body          text not null check (length(trim(body)) between 1 and 1000),
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.announcements (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid references public.students (id) on delete cascade,  -- null = everyone
  title       text not null check (length(trim(title)) between 1 and 80),
  body        text check (body is null or length(body) <= 1000),
  author_name text,
  created_by  uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index lessons_date_idx on public.lessons (lesson_date, start_time);
create index lessons_student_idx on public.lessons (student_id, lesson_date);
create index lesson_notes_student_idx on public.lesson_notes (student_id, created_at desc);
create index announcements_created_idx on public.announcements (created_at desc);
create index skills_level_idx on public.skills (level, position);

create trigger lessons_touch before update on public.lessons
  for each row execute function public.touch_updated_at();

-- starting learning path; the school can rename, add or hide skills
-- the school's 25-step path (Spanish in the database; the app translates it)
insert into public.skills (level, position, name, description) values
  (1, 1, 'Reconocimiento del spot', 'Zonas de la playa, obstáculos, corrientes y dónde está permitido navegar'),
  (1, 2, 'Direcciones de viento navegables y no navegables', 'Onshore, side, side-on y offshore: cuándo se puede navegar y cuándo no'),
  (1, 3, 'Presentación y armado del equipo', 'Kite, barra, líneas, arnés y tabla: inflar, armar y revisar'),
  (1, 4, 'Conexiones', 'Conectar las líneas al kite y a la barra, y revisarlas antes de despegar'),
  (1, 5, 'Sistemas de seguridad y quick release', 'Quick release, safety leash y cuándo usarlos'),
  (1, 6, 'Ventana de viento', 'Zona de potencia, borde de la ventana y cenit'),
  (1, 7, 'Control del kite', 'Pilotar el kite con suavidad y mantenerlo estable en el cenit'),
  (2, 1, 'Body drag', 'Arrastrarse en el agua con el kite, sin tabla'),
  (2, 2, 'Curvas de tracción (power strokes)', 'Generar potencia moviendo el kite por la ventana'),
  (2, 3, 'Recuperación de la tabla', 'Volver hasta la tabla con body drag, contra el viento'),
  (2, 4, 'Body drag (segunda etapa)', 'Body drag con una mano y ganando barlovento'),
  (2, 5, 'Relanzamiento del kite en el agua', 'Volver a levantar el kite cuando cae al agua'),
  (2, 6, 'Quick release en el agua', 'Activar el quick release y recuperar la barra en el agua'),
  (2, 7, 'Autorrescate', 'Recoger el equipo en el agua y volver a la orilla de forma segura'),
  (3, 1, 'Board grab', 'Agarrar y colocarse la tabla en el agua con el kite en el cenit'),
  (3, 2, 'Steady pull hacia ambos lados', 'Tracción constante y controlada hacia la derecha y la izquierda'),
  (3, 3, 'Waterstart sin tabla', 'Practicar el movimiento de salida sin la tabla'),
  (3, 4, 'Waterstart con tabla', 'Salir del agua parado en la tabla'),
  (4, 1, 'Navegar hacia la derecha', 'Mantener el rumbo y la velocidad hacia la derecha'),
  (4, 2, 'Navegar hacia la izquierda', 'Mantener el rumbo y la velocidad hacia la izquierda'),
  (4, 3, 'Orzar', 'Navegar contra el viento (upwind) para no perder terreno'),
  (4, 4, 'Transiciones', 'Cambiar de dirección y seguir navegando'),
  (4, 5, 'Downwind: teoría y práctica', 'Recorrer la costa a favor del viento de forma segura'),
  (4, 6, 'Aterrizaje del kite', 'Bajar el kite en la playa con ayuda y con señas'),
  (4, 7, 'Relanzamiento y aterrizaje por el alumno', 'Despegar y aterrizar el kite de forma autónoma');

-- ---------------------------------------------------------------- invites

-- creates (or reuses) the code for a student or instructor; admins only
create or replace function public.create_invite(p_kind text, p_target uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text;
  existing text;
  rnd bytea;
  i int;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede invitar.' using errcode = '42501';
  end if;
  if p_kind = 'student' then
    if not exists (select 1 from public.students where id = p_target) then
      raise exception 'Alumno inexistente.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.profiles where student_id = p_target and role = 'student') then
      raise exception 'Este alumno ya tiene su cuenta en la app.' using errcode = 'P0001';
    end if;
    select code into existing from public.app_invites
     where student_id = p_target and used_at is null and expires_at > now() + interval '7 days'
     order by created_at desc limit 1;
  elsif p_kind = 'instructor' then
    if not exists (select 1 from public.instructors where id = p_target and active) then
      raise exception 'Instructor inexistente o inactivo.' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.profiles p join public.instructors i on i.id = p.instructor_id
                where p.instructor_id = p_target and p.role = 'instructor' and i.kind = 'external') then
      raise exception 'Este instructor ya tiene su cuenta en la app.' using errcode = 'P0001';
    end if;
    select code into existing from public.app_invites
     where instructor_id = p_target and used_at is null and expires_at > now() + interval '7 days'
     order by created_at desc limit 1;
  else
    raise exception 'Tipo de invitación inválido.' using errcode = '22023';
  end if;
  if existing is not null then
    return existing;
  end if;

  loop
    -- random bytes of a v4 uuid (skipping the version and variant bytes)
    rnd := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + (get_byte(rnd, (array[0, 1, 2, 3, 4, 5, 10, 11])[i]) % 32), 1);
      if i = 4 then new_code := new_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.app_invites where code = new_code);
  end loop;

  insert into public.app_invites (code, kind, student_id, instructor_id)
  values (new_code, p_kind,
          case when p_kind = 'student' then p_target end,
          case when p_kind = 'instructor' then p_target end);
  return new_code;
end $$;

-- the signed-in user (with no role yet) joins as the student or instructor of the code
create or replace function public.claim_invite(p_code text) returns json
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  inv public.app_invites;
  clean text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  ins public.instructors;
  st public.students;
  new_role text;
begin
  if me is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  if length(clean) = 8 then
    clean := substr(clean, 1, 4) || '-' || substr(clean, 5, 4);
  end if;
  select * into inv from public.app_invites where code = clean for update;
  if not found or inv.used_at is not null or inv.expires_at < now() then
    raise exception 'El código no es válido o ya se usó. Pedile uno nuevo a la escuela.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where id = me and role is not null) then
    raise exception 'Tu cuenta ya está vinculada.' using errcode = 'P0001';
  end if;

  if inv.kind = 'student' then
    select * into st from public.students where id = inv.student_id;
    if exists (select 1 from public.profiles where student_id = st.id) then
      raise exception 'Este alumno ya tiene su cuenta en la app.' using errcode = 'P0001';
    end if;
    update public.students set privacy_accepted_at = coalesce(privacy_accepted_at, now()) where id = st.id;
    insert into public.profiles (id, role, student_id, full_name, active)
    values (me, 'student', st.id, st.full_name, true)
    on conflict (id) do update set role = 'student', student_id = st.id,
                                   full_name = st.full_name, active = true;
    new_role := 'student';
  else
    select * into ins from public.instructors where id = inv.instructor_id;
    if not ins.active then
      raise exception 'Este instructor está inactivo.' using errcode = 'P0001';
    end if;
    -- owners run the school: they join as admins
    new_role := case when ins.kind = 'owner' then 'admin' else 'instructor' end;
    if new_role = 'instructor' and exists (
         select 1 from public.profiles where instructor_id = ins.id and role = 'instructor') then
      raise exception 'Este instructor ya tiene su cuenta en la app.' using errcode = 'P0001';
    end if;
    insert into public.profiles (id, role, instructor_id, full_name, active)
    values (me, new_role, ins.id, ins.full_name, true)
    on conflict (id) do update set role = new_role, instructor_id = ins.id,
                                   full_name = ins.full_name, active = true;
  end if;

  update public.app_invites set used_by = me, used_at = now() where code = inv.code;
  return json_build_object('role', new_role);
end $$;

-- before creating an account: whose code is this? (first name only)
create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'kind', inv.kind,
    'first_name', split_part(trim(coalesce(s.full_name, i.full_name)), ' ', 1))
  from public.app_invites inv
  left join public.students s on s.id = inv.student_id
  left join public.instructors i on i.id = inv.instructor_id
  where inv.code = (select case when length(c) = 8 then substr(c, 1, 4) || '-' || substr(c, 5, 4) else c end
                      from (select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) as c) x)
    and inv.used_at is null and inv.expires_at > now()
$$;

-- who the signed-in user is, for the app (no prices)
create or replace function public.app_me() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'role', p.role,
    'full_name', coalesce(p.full_name, s.full_name, i.full_name),
    'student_id', p.student_id,
    'instructor_id', p.instructor_id,
    'school_name', coalesce((select school_name from public.school_settings), 'TRUEVENTO'))
  from public.profiles p
  left join public.students s on s.id = p.student_id
  left join public.instructors i on i.id = p.instructor_id
  where p.id = auth.uid() and p.active
$$;

-- ---------------------------------------------------------------- directory

-- names of the active instructors (students choose one when they ask for a class)
create or replace function public.instructor_directory() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select i.id, i.full_name from public.instructors i
   where i.active and (public.has_access() or public.my_student_id() is not null)
   order by i.kind desc, i.owner_slot nulls last, i.full_name
$$;

-- the student's own summary: hours taken, no prices
create or replace function public.my_student_summary() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'full_name', s.full_name,
    'phone', s.phone,
    'weight_kg', s.weight_kg,
    'experience', s.experience,
    'start_date', s.start_date,
    'hours', coalesce((select sum(c.hours) from public.classes c where c.student_id = s.id), 0),
    'classes', (select count(*) from public.classes c where c.student_id = s.id),
    'last_class', (select max(c.class_date) from public.classes c where c.student_id = s.id))
  from public.students s
  where s.id = public.my_student_id()
$$;

-- a new student signs up in the app: their record is created with their data
-- and no price; the school sets the price when it confirms their first class
create or replace function public.register_student(
  p_full_name text, p_phone text, p_weight smallint default null, p_experience text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = me and role is not null) then
    raise exception 'Tu cuenta ya está vinculada.' using errcode = 'P0001';
  end if;
  if length(trim(coalesce(p_full_name, ''))) < 3 then
    raise exception 'Escribí tu nombre y apellido.' using errcode = '22023';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    raise exception 'Escribí tu WhatsApp con código de área.' using errcode = '22023';
  end if;
  insert into public.students (full_name, phone, hourly_rate, weight_kg, experience, self_registered, privacy_accepted_at, created_by)
  values (trim(p_full_name), trim(p_phone), null, p_weight, p_experience, true, now(), me)
  returning id into new_id;
  insert into public.profiles (id, role, student_id, full_name, active)
  values (me, 'student', new_id, trim(p_full_name), true)
  on conflict (id) do update set role = 'student', student_id = new_id, full_name = trim(p_full_name), active = true;
  return new_id;
end $$;

-- a student keeps their contact data up to date
create or replace function public.update_my_details(p_phone text, p_weight smallint, p_experience text) returns void
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := public.my_student_id();
begin
  if sid is null then
    raise exception 'Solo los alumnos pueden cambiar sus datos acá.' using errcode = '42501';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    raise exception 'Escribí tu WhatsApp con código de área.' using errcode = '22023';
  end if;
  update public.students set phone = trim(p_phone), weight_kg = p_weight, experience = p_experience where id = sid;
end $$;

-- ---------------------------------------------------------------- agenda

create or replace function public.check_lesson_hours(p_hours numeric) returns void
language plpgsql immutable as $$
begin
  if p_hours is null or p_hours <= 0 or p_hours > 8 or p_hours * 4 <> trunc(p_hours * 4) then
    raise exception 'Duración inválida: usá cuartos de hora (1:00, 1:30...), hasta 8 horas.' using errcode = '22023';
  end if;
end $$;

-- one class at a time in the school: a time is taken when it overlaps another
-- requested or confirmed class. The lock makes two people choosing the same
-- slot at once queue up, so only the first one gets it.
create or replace function public.assert_slot_free(p_date date, p_time time, p_hours numeric, p_exclude uuid default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('truevento.slot.' || p_date::text));
  if exists (
    select 1 from public.lessons l
     where l.lesson_date = p_date
       and l.status in ('requested', 'confirmed')
       and l.id is distinct from p_exclude
       and l.start_time < p_time + make_interval(mins => (p_hours * 60)::int)
       and p_time < l.start_time + make_interval(mins => (l.hours * 60)::int)) then
    raise exception 'Ese horario ya está reservado. Elegí otro.' using errcode = 'P0001';
  end if;
end $$;

-- taken times between two dates, without names (for the calendar of every user)
create or replace function public.busy_slots(p_from date, p_to date, p_exclude uuid default null)
returns table (lesson_date date, start_time time, hours numeric)
language sql stable security definer set search_path = public as $$
  select l.lesson_date, l.start_time, l.hours
    from public.lessons l
   where l.lesson_date between p_from and p_to
     and l.status in ('requested', 'confirmed')
     and l.id is distinct from p_exclude
     and (public.has_access() or public.my_student_id() is not null)
   order by l.lesson_date, l.start_time
$$;

-- a student asks for a class
create or replace function public.request_lesson(
  p_date date, p_time time, p_hours numeric, p_instructor uuid default null, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  sid uuid := public.my_student_id();
  new_id uuid;
begin
  perform public.check_lesson_hours(p_hours);
  if sid is null then
    raise exception 'Solo los alumnos pueden pedir clases desde acá.' using errcode = '42501';
  end if;
  if p_date < (now() at time zone 'America/Fortaleza')::date then
    raise exception 'Elegí una fecha de hoy en adelante.' using errcode = '22023';
  end if;
  if p_date > (now() at time zone 'America/Fortaleza')::date + 180 then
    raise exception 'Elegí una fecha dentro de los próximos 6 meses.' using errcode = '22023';
  end if;
  if p_instructor is not null and not exists (select 1 from public.instructors where id = p_instructor and active) then
    raise exception 'Ese instructor no está disponible.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.lessons where student_id = sid and status = 'requested') >= 10 then
    raise exception 'Ya tenés muchas solicitudes pendientes. Esperá a que la escuela responda.' using errcode = 'P0001';
  end if;
  perform public.assert_slot_free(p_date, p_time, p_hours);
  insert into public.lessons (student_id, instructor_id, lesson_date, start_time, hours, status, student_note)
  values (sid, p_instructor, p_date, p_time, p_hours, 'requested', nullif(trim(p_note), ''))
  returning id into new_id;
  return new_id;
end $$;

-- staff schedule a class directly (already confirmed)
create or replace function public.schedule_lesson(
  p_student uuid, p_instructor uuid, p_date date, p_time time, p_hours numeric, p_note text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  new_id uuid;
begin
  perform public.check_lesson_hours(p_hours);
  if not public.has_access() then
    raise exception 'Solo la escuela puede agendar clases.' using errcode = '42501';
  end if;
  if not public.is_admin() and p_instructor is distinct from public.my_instructor_id() then
    raise exception 'Solo podés agendar clases tuyas.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.instructors where id = p_instructor and active) then
    raise exception 'Elegí un instructor activo.' using errcode = 'P0001';
  end if;
  perform public.assert_slot_free(p_date, p_time, p_hours);
  insert into public.lessons (student_id, instructor_id, lesson_date, start_time, hours, status, staff_note)
  values (p_student, p_instructor, p_date, p_time, p_hours, 'confirmed', nullif(trim(p_note), ''))
  returning id into new_id;
  return new_id;
end $$;

-- staff confirm a request (and may move it or assign the instructor)
create or replace function public.confirm_lesson(
  p_lesson uuid, p_instructor uuid, p_date date, p_time time, p_hours numeric, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  perform public.check_lesson_hours(p_hours);
  if not public.has_access() then
    raise exception 'Solo la escuela puede confirmar clases.' using errcode = '42501';
  end if;
  select * into l from public.lessons where id = p_lesson for update;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if l.status not in ('requested', 'confirmed') then
    raise exception 'Esta clase ya no se puede cambiar.' using errcode = 'P0001';
  end if;
  if not public.is_admin() then
    if p_instructor is distinct from public.my_instructor_id() then
      raise exception 'Solo podés confirmar clases que vas a dar vos.' using errcode = '42501';
    end if;
    if l.instructor_id is not null and l.instructor_id <> public.my_instructor_id() then
      raise exception 'Esta clase es de otro instructor.' using errcode = '42501';
    end if;
  end if;
  if not exists (select 1 from public.instructors where id = p_instructor and active) then
    raise exception 'Elegí un instructor activo.' using errcode = 'P0001';
  end if;
  perform public.assert_slot_free(p_date, p_time, p_hours, p_lesson);
  update public.lessons
     set status = 'confirmed', instructor_id = p_instructor, lesson_date = p_date,
         start_time = p_time, hours = p_hours,
         staff_note = coalesce(nullif(trim(p_note), ''), staff_note)
   where id = p_lesson;
end $$;

-- the student cancels their own class, or staff cancel/reject one
create or replace function public.cancel_lesson(p_lesson uuid, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  select * into l from public.lessons where id = p_lesson for update;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if not (public.is_admin()
          or (public.has_access() and (l.instructor_id is null or l.instructor_id = public.my_instructor_id()))
          or l.student_id = public.my_student_id()) then
    raise exception 'No podés cancelar esta clase.' using errcode = '42501';
  end if;
  if l.status not in ('requested', 'confirmed') then
    raise exception 'Esta clase ya no se puede cancelar.' using errcode = 'P0001';
  end if;
  update public.lessons
     set status = 'cancelled',
         staff_note = case when public.has_access() then coalesce(nullif(trim(p_note), ''), staff_note) else staff_note end,
         student_note = case when public.has_access() then student_note else coalesce(nullif(trim(p_note), ''), student_note) end
   where id = p_lesson;
end $$;

-- the class was given: it becomes a class in the school's records (with the
-- student's price and the instructor's pay), and the note and skills are saved
create or replace function public.complete_lesson(
  p_lesson uuid, p_hours numeric, p_note text default null,
  p_learning uuid[] default '{}', p_done uuid[] default '{}')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
  st public.students;
  class_uuid uuid;
  sk uuid;
begin
  if not public.has_access() then
    raise exception 'Solo la escuela puede cerrar clases.' using errcode = '42501';
  end if;
  select * into l from public.lessons where id = p_lesson for update;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  if l.status <> 'confirmed' then
    raise exception 'Solo se puede cerrar una clase confirmada.' using errcode = 'P0001';
  end if;
  if l.instructor_id is null then
    raise exception 'La clase no tiene instructor.' using errcode = 'P0001';
  end if;
  if not public.is_admin() and l.instructor_id <> public.my_instructor_id() then
    raise exception 'Solo el instructor de la clase puede cerrarla.' using errcode = '42501';
  end if;
  perform public.check_lesson_hours(p_hours);
  select * into st from public.students where id = l.student_id;
  if st.hourly_rate is null then
    raise exception 'Falta el precio por hora de %: lo pone la escuela en la app de gestión (Solicitudes).', st.full_name using errcode = 'P0001';
  end if;

  insert into public.classes (student_id, instructor_id, class_date, hours, student_rate, instructor_rate, notes)
  values (l.student_id, l.instructor_id, l.lesson_date, p_hours, st.hourly_rate, null,
          'Desde la agenda' || coalesce(': ' || nullif(trim(p_note), ''), ''))
  returning id into class_uuid;

  update public.lessons set status = 'done', hours = p_hours, class_id = class_uuid where id = p_lesson;

  if nullif(trim(p_note), '') is not null then
    insert into public.lesson_notes (student_id, instructor_id, lesson_id, body)
    values (l.student_id, l.instructor_id, l.id, trim(p_note));
  end if;

  foreach sk in array coalesce(p_learning, '{}') loop
    insert into public.student_skills (student_id, skill_id, status)
    values (l.student_id, sk, 'learning')
    on conflict (student_id, skill_id) do nothing;   -- never downgrade a learned skill
  end loop;
  foreach sk in array coalesce(p_done, '{}') loop
    insert into public.student_skills (student_id, skill_id, status)
    values (l.student_id, sk, 'done')
    on conflict (student_id, skill_id) do update set status = 'done', updated_by = auth.uid(), updated_at = now();
  end loop;
  return class_uuid;
end $$;

-- staff set one skill for a student (null removes it)
create or replace function public.set_student_skill(p_student uuid, p_skill uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_access() then
    raise exception 'Solo la escuela puede marcar el progreso.' using errcode = '42501';
  end if;
  if p_status is null then
    delete from public.student_skills where student_id = p_student and skill_id = p_skill;
  elsif p_status in ('learning', 'done') then
    insert into public.student_skills (student_id, skill_id, status)
    values (p_student, p_skill, p_status)
    on conflict (student_id, skill_id) do update
      set status = excluded.status, updated_by = auth.uid(), updated_at = now();
  else
    raise exception 'Estado inválido.' using errcode = '22023';
  end if;
end $$;

-- the school's inbox: the admin sets the student's price per hour (when it
-- changes or is still missing) and confirms the requested class in one step
create or replace function public.confirm_request(p_lesson uuid, p_rate numeric, p_instructor uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  l public.lessons;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede poner precios.' using errcode = '42501';
  end if;
  if p_rate is null or p_rate < 0 or p_rate >= 1000000 or p_rate * 100 <> trunc(p_rate * 100) then
    raise exception 'Escribí el precio por hora.' using errcode = '22023';
  end if;
  select * into l from public.lessons where id = p_lesson;
  if not found then
    raise exception 'Clase inexistente.' using errcode = 'P0001';
  end if;
  update public.students set hourly_rate = p_rate where id = l.student_id;
  perform public.confirm_lesson(p_lesson, p_instructor, l.lesson_date, l.start_time, l.hours, null);
end $$;

-- lessons with names, for the agenda (students only get their own).
-- price_pending tells staff the school has not set this student's price yet.
create or replace function public.agenda(p_from date, p_to date) returns table (
  id uuid, student_id uuid, student_name text, instructor_id uuid, instructor_name text,
  lesson_date date, start_time time, hours numeric, status text,
  student_note text, staff_note text, created_at timestamptz, price_pending boolean)
language sql stable security definer set search_path = public as $$
  select l.id, l.student_id, s.full_name, l.instructor_id, i.full_name,
         l.lesson_date, l.start_time, l.hours, l.status, l.student_note, l.staff_note, l.created_at,
         public.has_access() and s.hourly_rate is null
    from public.lessons l
    join public.students s on s.id = l.student_id
    left join public.instructors i on i.id = l.instructor_id
   where l.lesson_date between p_from and p_to
     and (public.has_access() or l.student_id = public.my_student_id())
   order by l.lesson_date, l.start_time
$$;

-- ---------------------------------------------------------------- row level security

alter table public.app_invites    enable row level security;
alter table public.skills         enable row level security;
alter table public.student_skills enable row level security;
alter table public.lessons        enable row level security;
alter table public.lesson_notes   enable row level security;
alter table public.announcements  enable row level security;

create policy invites_read on public.app_invites for select to authenticated
  using (public.is_admin());

create policy skills_read on public.skills for select to authenticated
  using (public.has_access() or public.my_student_id() is not null);
create policy skills_insert on public.skills for insert to authenticated
  with check (public.is_admin());
create policy skills_update on public.skills for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy student_skills_read on public.student_skills for select to authenticated
  using (public.has_access() or student_id = public.my_student_id());

create policy lessons_read on public.lessons for select to authenticated
  using (public.has_access() or student_id = public.my_student_id());

create policy lesson_notes_read on public.lesson_notes for select to authenticated
  using (public.has_access() or student_id = public.my_student_id());
create policy lesson_notes_insert on public.lesson_notes for insert to authenticated
  with check (public.is_admin()
              or (public.has_access() and instructor_id = public.my_instructor_id()));
create policy lesson_notes_delete on public.lesson_notes for delete to authenticated
  using (public.is_admin() or (public.has_access() and created_by = auth.uid()));

create policy announcements_read on public.announcements for select to authenticated
  using (public.has_access()
         or (public.my_student_id() is not null and (student_id is null or student_id = public.my_student_id())));
create policy announcements_insert on public.announcements for insert to authenticated
  with check (public.has_access() and created_by = auth.uid());
create policy announcements_delete on public.announcements for delete to authenticated
  using (public.is_admin() or (public.has_access() and created_by = auth.uid()));

-- the author name is taken from the profile, never from the client
create or replace function public.announcements_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_by := auth.uid();
  new.created_at := now();
  new.author_name := (select full_name from public.profiles where id = auth.uid());
  return new;
end $$;
create trigger announcements_before_insert before insert on public.announcements
  for each row execute function public.announcements_before_insert();

revoke all on public.app_invites, public.skills, public.student_skills, public.lessons,
              public.lesson_notes, public.announcements from anon, authenticated;
grant select on public.app_invites, public.student_skills, public.lessons to authenticated;
grant select, insert, update on public.skills to authenticated;
grant select, insert, delete on public.lesson_notes, public.announcements to authenticated;

revoke execute on function public.create_invite(text, uuid) from public, anon;
revoke execute on function public.claim_invite(text) from public, anon;
revoke execute on function public.app_me() from public, anon;
revoke execute on function public.invite_preview(text) from public;
revoke execute on function public.instructor_directory() from public, anon;
revoke execute on function public.my_student_summary() from public, anon;
revoke execute on function public.register_student(text, text, smallint, text) from public, anon;
revoke execute on function public.update_my_details(text, smallint, text) from public, anon;
revoke execute on function public.confirm_request(uuid, numeric, uuid) from public, anon;
revoke execute on function public.request_lesson(date, time, numeric, uuid, text) from public, anon;
revoke execute on function public.schedule_lesson(uuid, uuid, date, time, numeric, text) from public, anon;
revoke execute on function public.confirm_lesson(uuid, uuid, date, time, numeric, text) from public, anon;
revoke execute on function public.cancel_lesson(uuid, text) from public, anon;
revoke execute on function public.complete_lesson(uuid, numeric, text, uuid[], uuid[]) from public, anon;
revoke execute on function public.set_student_skill(uuid, uuid, text) from public, anon;
revoke execute on function public.agenda(date, date) from public, anon;
revoke execute on function public.busy_slots(date, date, uuid) from public, anon;
revoke execute on function public.assert_slot_free(date, time, numeric, uuid) from public, anon, authenticated;
grant execute on function public.create_invite(text, uuid) to authenticated;
grant execute on function public.claim_invite(text) to authenticated;
grant execute on function public.app_me() to authenticated;
grant execute on function public.invite_preview(text) to anon, authenticated;
grant execute on function public.instructor_directory() to authenticated;
grant execute on function public.my_student_summary() to authenticated;
grant execute on function public.register_student(text, text, smallint, text) to authenticated;
grant execute on function public.update_my_details(text, smallint, text) to authenticated;
grant execute on function public.confirm_request(uuid, numeric, uuid) to authenticated;
grant execute on function public.request_lesson(date, time, numeric, uuid, text) to authenticated;
grant execute on function public.schedule_lesson(uuid, uuid, date, time, numeric, text) to authenticated;
grant execute on function public.confirm_lesson(uuid, uuid, date, time, numeric, text) to authenticated;
grant execute on function public.cancel_lesson(uuid, text) to authenticated;
grant execute on function public.complete_lesson(uuid, numeric, text, uuid[], uuid[]) to authenticated;
grant execute on function public.set_student_skill(uuid, uuid, text) to authenticated;
grant execute on function public.agenda(date, date) to authenticated;
grant execute on function public.busy_slots(date, date, uuid) to authenticated;
