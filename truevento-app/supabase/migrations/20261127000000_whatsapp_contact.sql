-- TRUEVENTO: the price of a requested class is agreed on WhatsApp.
--
-- A student must have a WhatsApp number to ask for a class, so the school can write to
-- them; the school's messages go in the student's language (saved by the students app).

alter table public.students add column if not exists lang text check (lang in ('es', 'pt', 'en'));

-- no request without a way to reach the student
create or replace function public.lessons_need_phone() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'requested' and length(regexp_replace(coalesce(
       (select phone from public.students where id = new.student_id), ''), '\D', '', 'g')) < 8 then
    raise exception 'Escribí tu WhatsApp con código de área.' using errcode = '22023';
  end if;
  return new;
end $$;

drop trigger if exists lessons_need_phone on public.lessons;
create trigger lessons_need_phone before insert on public.lessons
  for each row execute function public.lessons_need_phone();

-- the student's language, for the school's messages
create or replace function public.set_my_lang(p_lang text) returns void
language sql security definer set search_path = public as $$
  update public.students s set lang = p_lang
    from public.profiles p
   where p.id = auth.uid() and p.role = 'student' and p.active and s.id = p.student_id
     and p_lang in ('es', 'pt', 'en') and s.lang is distinct from p_lang
$$;

revoke execute on function public.set_my_lang(text) from public, anon;
grant execute on function public.set_my_lang(text) to authenticated;
