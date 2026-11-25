-- TRUEVENTO: notifications on the phone (Web Push).
--
-- When a student asks for a class, the school's admins get a notification; when the
-- school confirms, moves, declines or cancels a class, the student gets one; when a
-- student cancels, the admins do. The database builds the messages (in each device's
-- language) and hands them to the management app's /api/push function through pg_net;
-- that function signs them (VAPID) and delivers them to each phone's push service.
-- A failure to notify never blocks the class itself.

create extension if not exists pg_net;

-- ---------------------------------------------------------------- devices

create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  app        text not null check (app in ('gestion', 'alumnos')),
  endpoint   text not null unique check (endpoint ~ '^https://' and length(endpoint) <= 1000),
  p256dh     text not null check (length(p256dh) between 40 and 200),
  auth       text not null check (length(auth) between 10 and 100),
  lang       text not null default 'es' check (lang in ('es', 'pt', 'en')),
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id, app);

-- only reached through the functions below
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

-- where to send and the shared secret; set once at deploy, never readable by users
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.push_config (
  id     smallint primary key default 1 check (id = 1),
  url    text not null check (url ~ '^https?://'),
  secret text not null check (length(secret) >= 24)
);
revoke all on private.push_config from public, anon, authenticated;

-- this device should get notifications for the signed-in user
create or replace function public.save_push_subscription(
  p_app text, p_endpoint text, p_p256dh text, p_auth text, p_lang text default 'es')
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Tenés que iniciar sesión.' using errcode = '42501';
  end if;
  -- a device that changed account belongs to the new one
  delete from public.push_subscriptions where endpoint = p_endpoint;
  insert into public.push_subscriptions (user_id, app, endpoint, p256dh, auth, lang)
  values (auth.uid(), p_app, p_endpoint, p_p256dh, p_auth, coalesce(p_lang, 'es'));
end $$;

create or replace function public.delete_push_subscription(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id = auth.uid()
$$;

-- the push function removes devices the push service no longer knows (needs the secret)
create or replace function public.prune_push_subscriptions(p_secret text, p_endpoints text[]) returns integer
language plpgsql security definer set search_path = public as $$
declare
  n integer;
begin
  if not exists (select 1 from private.push_config where id = 1 and secret = p_secret) then
    raise exception 'No autorizado.' using errcode = '42501';
  end if;
  delete from public.push_subscriptions where endpoint = any(p_endpoints);
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- sending

/**
 * Queues one notification for each device of the given users in one app.
 * p_msg: {"es": {"title", "body"}, "pt": {...}, "en": {...}, "url": "/...", "tag": "..."}
 */
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
             'url', p_msg ->> 'url', 'tag', p_msg ->> 'tag', 'app', p_app))), '[]'::jsonb)
    into items
    from public.push_subscriptions s
   where s.user_id = any(p_users) and s.app = p_app;
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

create or replace function public.lessons_notify() returns trigger
language plpgsql security definer set search_path = public, private as $$
declare
  st      public.students;
  who     text;
  day     text := to_char(new.lesson_date, 'DD/MM');
  hhmm    text := to_char(new.start_time, 'HH24:MI');
  admins  uuid[];
  owners  uuid[]; -- the student's own logins
  by_student boolean;
begin
  select * into st from public.students where id = new.student_id;
  select array_agg(id) into admins from public.profiles where role = 'admin' and active;
  select array_agg(id) into owners from public.profiles where student_id = new.student_id and active;
  by_student := auth.uid() is not null and auth.uid() = any(coalesce(owners, '{}'));
  select full_name into who from public.instructors where id = new.instructor_id;

  if tg_op = 'INSERT' and new.status = 'requested' then
    perform private.notify(admins, 'gestion', jsonb_build_object(
      'url', '/solicitudes', 'tag', 'request-' || new.id,
      'es', jsonb_build_object('title', 'Nueva solicitud de clase',
              'body', st.full_name || ' pidió el ' || day || ' a las ' || hhmm || case when st.hourly_rate is null then ' · alumno nuevo, falta el precio' else '' end),
      'pt', jsonb_build_object('title', 'Nova solicitação de aula', 'body', st.full_name || ' pediu ' || day || ' às ' || hhmm),
      'en', jsonb_build_object('title', 'New lesson request', 'body', st.full_name || ' asked for ' || day || ' at ' || hhmm)));

  elsif tg_op = 'UPDATE' and old.status = 'requested' and new.status = 'confirmed' then
    perform private.notify(owners, 'alumnos', jsonb_build_object(
      'url', '/agenda', 'tag', 'lesson-' || new.id,
      'es', jsonb_build_object('title', '¡Clase confirmada!', 'body', day || ' a las ' || hhmm || coalesce(' con ' || who, '')),
      'pt', jsonb_build_object('title', 'Aula confirmada!', 'body', day || ' às ' || hhmm || coalesce(' com ' || who, '')),
      'en', jsonb_build_object('title', 'Lesson confirmed!', 'body', day || ' at ' || hhmm || coalesce(' with ' || who, ''))));

  elsif tg_op = 'UPDATE' and old.status = 'confirmed' and new.status = 'confirmed'
        and (old.lesson_date, old.start_time, old.hours) is distinct from (new.lesson_date, new.start_time, new.hours) then
    perform private.notify(owners, 'alumnos', jsonb_build_object(
      'url', '/agenda', 'tag', 'lesson-' || new.id,
      'es', jsonb_build_object('title', 'Tu clase cambió de horario', 'body', 'Ahora: ' || day || ' a las ' || hhmm),
      'pt', jsonb_build_object('title', 'Sua aula mudou de horário', 'body', 'Agora: ' || day || ' às ' || hhmm),
      'en', jsonb_build_object('title', 'Your lesson was moved', 'body', 'Now: ' || day || ' at ' || hhmm)));

  elsif tg_op = 'UPDATE' and new.status = 'cancelled' and old.status in ('requested', 'confirmed') then
    if by_student then
      perform private.notify(admins, 'gestion', jsonb_build_object(
        'url', '/', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'Un alumno canceló', 'body', st.full_name || ' canceló la clase del ' || day || ' a las ' || hhmm),
        'pt', jsonb_build_object('title', 'Um aluno cancelou', 'body', st.full_name || ' cancelou a aula de ' || day || ' às ' || hhmm),
        'en', jsonb_build_object('title', 'A student cancelled', 'body', st.full_name || ' cancelled the lesson on ' || day || ' at ' || hhmm)));
    elsif old.status = 'requested' then
      perform private.notify(owners, 'alumnos', jsonb_build_object(
        'url', '/agenda', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'No pudimos confirmar tu clase', 'body', day || ' a las ' || hhmm || '. Pedí otro horario en la app.'),
        'pt', jsonb_build_object('title', 'Não conseguimos confirmar sua aula', 'body', day || ' às ' || hhmm || '. Peça outro horário no app.'),
        'en', jsonb_build_object('title', 'We could not confirm your lesson', 'body', day || ' at ' || hhmm || '. Book another time in the app.')));
    else
      perform private.notify(owners, 'alumnos', jsonb_build_object(
        'url', '/agenda', 'tag', 'lesson-' || new.id,
        'es', jsonb_build_object('title', 'Clase cancelada', 'body', 'La escuela canceló la clase del ' || day || ' a las ' || hhmm),
        'pt', jsonb_build_object('title', 'Aula cancelada', 'body', 'A escola cancelou a aula de ' || day || ' às ' || hhmm),
        'en', jsonb_build_object('title', 'Lesson cancelled', 'body', 'The school cancelled the lesson on ' || day || ' at ' || hhmm)));
    end if;
  end if;
  return null;
exception when others then
  raise warning 'push notification skipped: %', sqlerrm;
  return null;
end $$;

create trigger lessons_notify after insert or update on public.lessons
  for each row execute function public.lessons_notify();

revoke execute on function public.save_push_subscription(text, text, text, text, text) from public, anon;
revoke execute on function public.delete_push_subscription(text) from public, anon;
revoke execute on function public.prune_push_subscriptions(text, text[]) from public;
grant execute on function public.save_push_subscription(text, text, text, text, text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;
-- called by the push function with the shared secret and the public key
grant execute on function public.prune_push_subscriptions(text, text[]) to anon, authenticated;
