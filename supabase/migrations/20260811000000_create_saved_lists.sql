create table if not exists public.saved_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null unique,
  share_slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_buildings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.saved_users(id) on delete cascade,
  building_id text not null references public.buildings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, building_id)
);

alter table public.saved_users enable row level security;
alter table public.saved_buildings enable row level security;
revoke all on public.saved_users from anon, authenticated;
revoke all on public.saved_buildings from anon, authenticated;
