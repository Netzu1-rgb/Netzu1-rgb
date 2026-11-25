-- TRUEVENTO: a short access code for the school's admins in the students app.
--
-- The school's admins (the owner, Victoria Linde, and whoever runs the system) join the
-- students app with a code instead of an invitation: they create their user and password
-- and type the code. Each code works a limited number of times and expires, so a code
-- that gets around cannot be used again. Codes are stored only as a hash and are set at
-- deploy, never in this file:
--
--   insert into private.admin_codes (code_hash, uses_left, expires_at)
--   values (public.admin_code_hash('THE-CODE'), 2, now() + interval '30 days');
--
-- Someone who joins with the name of a school owner is linked to that owner, so their
-- classes are theirs in both apps.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.admin_codes (
  code_hash  text primary key,
  uses_left  integer not null check (uses_left >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
revoke all on private.admin_codes from public, anon, authenticated;

-- letters and digits only, in capitals: "admin 7" = "ADMIN7"
create or replace function public.admin_code_hash(p_code text) returns text
language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex')
$$;
revoke execute on function public.admin_code_hash(text) from public, anon, authenticated;

create or replace function private.valid_admin_code(p_code text) returns boolean
language sql stable security definer set search_path = public, private as $$
  select exists (select 1 from private.admin_codes
                  where code_hash = public.admin_code_hash(p_code) and uses_left > 0 and expires_at > now())
$$;
revoke execute on function private.valid_admin_code(text) from public, anon, authenticated;

-- before creating an account: what is this code? (an admin code says only that)
create or replace function public.invite_preview(p_code text) returns json
language sql stable security definer set search_path = public, private as $$
  select coalesce(
    (select json_build_object(
              'kind', inv.kind,
              'first_name', split_part(trim(coalesce(s.full_name, i.full_name)), ' ', 1))
       from public.app_invites inv
       left join public.students s on s.id = inv.student_id
       left join public.instructors i on i.id = inv.instructor_id
      where inv.code = (select case when length(c) = 8 then substr(c, 1, 4) || '-' || substr(c, 5, 4) else c end
                          from (select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')) as c) x)
        and inv.used_at is null and inv.expires_at > now()),
    case when private.valid_admin_code(p_code) then json_build_object('kind', 'admin', 'first_name', null) end)
$$;

-- an admin code: the signed-in account becomes an admin (named, linked to an owner by name)
create or replace function public.claim_admin_code(p_code text, p_name text) returns json
language plpgsql security definer set search_path = public, private as $$
declare
  me uuid := auth.uid();
  owner_row public.instructors;
  name text := regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g');
begin
  if me is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  if length(name) < 3 then
    raise exception 'Escribí tu nombre y apellido.' using errcode = '22023';
  end if;
  update private.admin_codes set uses_left = uses_left - 1
   where code_hash = public.admin_code_hash(p_code) and uses_left > 0 and expires_at > now();
  if not found then
    raise exception 'El código no es válido o ya se usó. Pedile uno nuevo a la escuela.' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles where id = me and role is not null) then
    raise exception 'Tu cuenta ya está vinculada.' using errcode = 'P0001';
  end if;

  -- an owner (e.g. Victoria Linde) is linked to her instructor record, if it is free
  select * into owner_row from public.instructors i
   where i.kind = 'owner' and public.instructor_key(i.full_name) = public.instructor_key(name)
     and not exists (select 1 from public.profiles p where p.instructor_id = i.id)
   limit 1;

  insert into public.profiles (id, role, instructor_id, full_name, active)
  values (me, 'admin', owner_row.id, coalesce(owner_row.full_name, name), true)
  on conflict (id) do update set role = 'admin', instructor_id = owner_row.id,
                                 full_name = coalesce(owner_row.full_name, name), active = true;
  return json_build_object('role', 'admin');
end $$;

revoke execute on function public.claim_admin_code(text, text) from public, anon;
grant execute on function public.claim_admin_code(text, text) to authenticated;
