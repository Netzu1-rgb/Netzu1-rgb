-- TRUEVENTO: the school's notices also reach admins who work from the students app.
--
-- Until now the notices for admins (a new request, a student who cancels) went only to the
-- devices where they turned notifications on in the management app. An admin can now work
-- only from the students app (e.g. the account made for it), so those notices also go to
-- the admins' devices in the students app, opening its home screen (where requests are).

create or replace function private.notify(p_users uuid[], p_app text, p_msg jsonb) returns void
language plpgsql security definer set search_path = public, private as $$
declare
  cfg private.push_config;
  items jsonb;
begin
  select * into cfg from private.push_config where id = 1;
  if not found or p_users is null or cardinality(p_users) = 0 then
    return;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'subscription', jsonb_build_object('endpoint', s.endpoint,
                             'keys', jsonb_build_object('p256dh', s.p256dh, 'auth', s.auth)),
           'payload', jsonb_build_object(
             'title', coalesce(p_msg -> s.lang ->> 'title', p_msg -> 'es' ->> 'title'),
             'body',  coalesce(p_msg -> s.lang ->> 'body',  p_msg -> 'es' ->> 'body'),
             -- a management notice opened in the students app goes to its home screen
             'url', case when s.app = p_app then p_msg ->> 'url' else '/' end,
             'tag', p_msg ->> 'tag', 'app', s.app))), '[]'::jsonb)
    into items
    from public.push_subscriptions s
   where s.user_id = any(p_users)
     and (s.app = p_app
          or (p_app = 'gestion' and s.app = 'alumnos'
              and exists (select 1 from public.profiles p where p.id = s.user_id and p.role = 'admin' and p.active)));
  if jsonb_array_length(items) = 0 then
    return;
  end if;
  perform net.http_post(
    url := cfg.url,
    body := jsonb_build_object('messages', items),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', cfg.secret),
    timeout_milliseconds := 8000);
exception when others then
  -- notifying is a bonus: the class must be saved even if this fails
  raise warning 'push notification not queued: %', sqlerrm;
end $$;

revoke all on function private.notify(uuid[], text, jsonb) from public, anon, authenticated;
