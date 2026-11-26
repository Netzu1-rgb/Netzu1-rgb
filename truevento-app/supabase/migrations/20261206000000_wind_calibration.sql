-- TRUEVENTO: the wind forecast, calibrated with the wind the school measures on the beach.
--
-- Global weather models make the same kind of error at a given place (on the Ceará coast
-- they often fall short in the afternoon). The school's staff can note the wind they measure
-- (with an anemometer) next to what the app forecast for that hour; the app then corrects
-- every forecast by how the two usually compare. It needs 3 measurements of the last 45
-- days with real wind (forecast of 6 kn or more); the correction stays between ×0.7 and ×1.5.

create table if not exists public.wind_observations (
  id          uuid primary key default gen_random_uuid(),
  observed_at timestamptz not null default now(),
  measured_kn numeric(4, 1) not null check (measured_kn between 0 and 60),
  forecast_kn numeric(4, 1) not null check (forecast_kn between 0 and 60),
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);
alter table public.wind_observations enable row level security;
revoke all on public.wind_observations from anon;
grant select on public.wind_observations to authenticated;
drop policy if exists wind_observations_staff_read on public.wind_observations;
create policy wind_observations_staff_read on public.wind_observations for select to authenticated using (public.has_access());

-- the staff notes a measurement (the app sends the forecast it showed for this hour)
create or replace function public.add_wind_observation(p_measured numeric, p_forecast numeric) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  if not public.has_access() then
    raise exception 'Solo la escuela puede cargar mediciones.' using errcode = '42501';
  end if;
  if p_measured is null or p_measured < 0 or p_measured > 60 then
    raise exception 'Escribí el viento medido en nudos (0 a 60).' using errcode = '22023';
  end if;
  if p_forecast is null or p_forecast < 0 or p_forecast > 60 then
    raise exception 'Falta el pronóstico de esta hora.' using errcode = '22023';
  end if;
  insert into public.wind_observations (measured_kn, forecast_kn) values (round(p_measured, 1), round(p_forecast, 1))
  returning id into new_id;
  return new_id;
end $$;
revoke execute on function public.add_wind_observation(numeric, numeric) from public, anon;
grant execute on function public.add_wind_observation(numeric, numeric) to authenticated;

-- a wrong measurement can be removed by the school
create or replace function public.delete_wind_observation(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_access() then
    raise exception 'Solo la escuela puede borrar mediciones.' using errcode = '42501';
  end if;
  delete from public.wind_observations where id = p_id;
end $$;
revoke execute on function public.delete_wind_observation(uuid) from public, anon;
grant execute on function public.delete_wind_observation(uuid) to authenticated;

-- the correction every app applies: median of measured ÷ forecast (everyone signed in reads it)
create or replace function public.wind_calibration() returns table (factor numeric, count integer)
language sql stable security definer set search_path = public as $$
  with recent as (
    select measured_kn / forecast_kn as ratio
      from public.wind_observations
     where observed_at > now() - interval '45 days' and forecast_kn >= 6
  )
  select case when count(*) >= 3
              then round(least(1.5, greatest(0.7, percentile_cont(0.5) within group (order by ratio)))::numeric, 3)
              else 1 end,
         count(*)::int
    from recent
$$;
revoke execute on function public.wind_calibration() from public, anon;
grant execute on function public.wind_calibration() to authenticated;
