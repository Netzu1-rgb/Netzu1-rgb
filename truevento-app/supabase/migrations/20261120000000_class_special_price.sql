-- Special prices per class: offers, packages, discounts or a trial class.
-- A class can be charged per hour (hours x price per hour) or with a fixed total
-- agreed with the student. The instructor is always paid per hour.

alter table public.classes
  add column fixed_total numeric(14, 2) check (fixed_total is null or (fixed_total >= 0 and fixed_total < 100000000)),
  add column price_note  text check (price_note is null or length(price_note) <= 120);

-- the totals now depend on the price mode; generated columns are rebuilt
alter table public.classes drop column school_profit, drop column total_amount;
alter table public.classes
  add column total_amount numeric(14, 2)
    generated always as (coalesce(fixed_total, round(hours * student_rate, 2))) stored,
  add column school_profit numeric(14, 2)
    generated always as (coalesce(fixed_total, round(hours * student_rate, 2)) - round(hours * instructor_rate, 2)) stored;

comment on column public.classes.fixed_total is 'Total agreed for this class (offer, package, discount). Null = hours x student_rate.';
comment on column public.classes.price_note  is 'Why the price differs: offer, package, discount, trial class...';

-- with a fixed total, student_rate keeps the resulting price per hour for reports
create or replace function public.classes_price_rules() returns trigger
language plpgsql as $$
begin
  if current_setting('truevento.settling', true) = 'on' then
    return new;
  end if;
  new.price_note := nullif(trim(new.price_note), '');
  if new.fixed_total is not null and new.hours > 0 then
    new.student_rate := round(new.fixed_total / new.hours, 2);
  end if;
  return new;
end $$;

-- runs after classes_before_write (triggers fire in name order)
create trigger classes_price_rules before insert or update on public.classes
  for each row execute function public.classes_price_rules();
