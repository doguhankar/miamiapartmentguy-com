-- Create saved_lists table for storing apartment search lists
create table saved_lists (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique,
  buildings jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  
  constraint slug_length check (length(slug) >= 8 and length(slug) <= 16),
  constraint buildings_not_empty check (jsonb_array_length(buildings) > 0)
);

-- Create index on slug for fast lookups
create index saved_lists_slug_idx on saved_lists(slug);
