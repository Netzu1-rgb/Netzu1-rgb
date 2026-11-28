-- Push to the student when a request can't be confirmed: neutral Spanish ("Pide", not "Pedí"),
-- like the rest of the students app. Only that sentence changes; the function stays as it is.
do $$
declare
  def text := pg_get_functiondef('public.lessons_notify'::regproc);
begin
  if position('Pedí otro día en la app.' in def) > 0 then
    execute replace(def, 'Pedí otro día en la app.', 'Pide otro día en la app.');
  end if;
end $$;
