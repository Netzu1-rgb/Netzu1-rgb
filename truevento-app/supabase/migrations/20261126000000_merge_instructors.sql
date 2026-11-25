-- TRUEVENTO: one record per instructor.
--
-- Each time a class was registered with "a new instructor, only for this class", a new
-- record was created, so the same person (e.g. "Fran") appeared many times, each with
-- the hours of one class. This joins external instructors with the same name into one
-- record that keeps all their classes, payouts and links; the app now reuses an
-- existing instructor when the same name is typed again.
--
-- Money does not change: every class keeps its own price, pay and totals.

-- the same name, written in any case, with or without accents or extra spaces
create or replace function public.instructor_key(p_name text) returns text
language sql immutable as $$
  select translate(lower(regexp_replace(btrim(coalesce(p_name, '')), '\s+', ' ', 'g')),
                   'áàâãäéèêëíìîïóòôõöúùûüñç', 'aaaaaeeeeiiiiooooouuuunc')
$$;

do $$
declare
  grp record;
  fk record;
  keeper uuid;
  dups uuid[];
begin
  -- moving a class to another instructor record changes nothing else in it
  perform set_config('truevento.settling', 'on', true);

  for grp in
    select public.instructor_key(full_name) as key,
           -- keep the active one, else the one with most classes, else the oldest
           (array_agg(i.id order by i.active desc,
                      (select count(*) from public.classes c where c.instructor_id = i.id) desc,
                      i.created_at))                                   as ids,
           (array_agg(i.hourly_pay order by i.created_at desc))[1]     as last_pay,
           (array_agg(i.phone order by i.created_at desc) filter (where i.phone is not null))[1] as phone
      from public.instructors i
     where i.kind = 'external'
     group by 1
    having count(*) > 1
  loop
    keeper := grp.ids[1];
    dups := grp.ids[2:];

    -- every table that points to an instructor now points to the kept record
    for fk in
      select c.conrelid::regclass as tbl, a.attname as col
        from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
       where c.contype = 'f' and c.confrelid = 'public.instructors'::regclass
    loop
      if fk.tbl = 'public.profiles'::regclass then
        -- one login per instructor: move a login only if the kept record has none
        if not exists (select 1 from public.profiles where instructor_id = keeper) then
          update public.profiles set instructor_id = keeper
           where id = (select id from public.profiles where instructor_id = any(dups) order by created_at limit 1);
        end if;
        continue;
      end if;
      execute format('update %s set %I = $1 where %I = any($2)', fk.tbl, fk.col, fk.col) using keeper, dups;
    end loop;

    -- someone registered more than once works with the school regularly: keep them
    -- in the list (active) with their latest pay
    update public.instructors
       set active = true, hourly_pay = grp.last_pay, phone = coalesce(phone, grp.phone), updated_at = now()
     where id = keeper;
    delete from public.instructors where id = any(dups);
    raise notice 'instructor "%": % records joined into one', grp.key, cardinality(grp.ids);
  end loop;

  perform set_config('truevento.settling', '', true);
end $$;
