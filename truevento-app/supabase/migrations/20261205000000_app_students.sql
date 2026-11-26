-- TRUEVENTO: the students app lists only the students who use it.
--
-- The students the school already had in the management app (with their classes and
-- payments) have no account in the students app. Listing them there made them look like
-- app users, and each would appear twice once they sign up themselves. The students app
-- now lists only students with an account; the management app keeps all of them.
-- Nothing is deleted.

create or replace function public.app_students() returns table (id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select s.id, s.full_name
    from public.students s
   where s.active
     and public.has_access()
     and exists (select 1 from public.profiles p where p.student_id = s.id and p.role = 'student')
   order by s.full_name
$$;
revoke execute on function public.app_students() from public, anon;
grant execute on function public.app_students() to authenticated;
