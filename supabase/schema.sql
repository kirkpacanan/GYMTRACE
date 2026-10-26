-- GYMTRACE schema. Run once in the Supabase SQL editor.
-- Tables start empty except the staff and admin PINs.

create table if not exists members (
  id bigint generated always as identity primary key,
  name text not null,
  contact text not null,
  status text not null check (status in ('active', 'expired', 'frozen')),
  face_tag text not null unique,
  face_descriptor text,
  fee_amount integer not null default 1500,
  months_paid integer not null default 1,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists day_passes (
  id bigint generated always as identity primary key,
  code text not null unique,
  name text not null,
  contact text not null,
  amount integer not null,
  paid_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists attendance (
  id bigint generated always as identity primary key,
  member_id bigint references members (id) on delete cascade,
  day_pass_id bigint references day_passes (id) on delete cascade,
  entry_at timestamptz not null default now(),
  source text not null check (source in ('face', 'day_pass', 'manual')),
  event text not null default 'check_in' check (event in ('check_in', 'check_out'))
);

create table if not exists staff_pins (
  role text primary key check (role in ('staff', 'admin')),
  pin text not null
);

alter table members enable row level security;
alter table day_passes enable row level security;
alter table attendance enable row level security;
alter table staff_pins enable row level security;

insert into staff_pins (role, pin)
values ('staff', '1234'), ('admin', '9999')
on conflict (role) do nothing;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.members, public.day_passes, public.attendance, public.staff_pins to service_role;
grant usage, select on all sequences in schema public to service_role;

alter table members add column if not exists months_paid integer not null default 1;
alter table members add column if not exists expires_at timestamptz;
update members
set expires_at = created_at + (months_paid || ' months')::interval
where expires_at is null;
