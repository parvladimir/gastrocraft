-- DINEVIO Sales Manager database foundation for Supabase.
-- Run this in a new Supabase project before replacing the localStorage adapter.
-- Do not store API secrets or legal/company details in this schema.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  street text,
  house_number text,
  postal_code text,
  city text,
  phone text,
  email text,
  website text,
  google_maps_url text,
  latitude numeric,
  longitude numeric,
  opening_hours jsonb not null default '[]'::jsonb,
  google_rating numeric,
  google_review_count integer,
  photos jsonb not null default '[]'::jsonb,
  instagram text,
  facebook text,
  tiktok text,
  contact_person text,
  contact_position text,
  status text not null default 'Neu',
  interest_level integer,
  selected_demo text not null default 'none',
  responsible_user_id uuid references public.users (id),
  notes text,
  planned_visit_at timestamptz,
  next_contact_at timestamptz,
  next_contact_type text,
  digital_presence jsonb,
  archived boolean not null default false,
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.users (id),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_status_idx on public.restaurants (status);
create index if not exists restaurants_next_contact_idx on public.restaurants (next_contact_at);
create index if not exists restaurants_responsible_idx on public.restaurants (responsible_user_id);
create index if not exists restaurants_archived_idx on public.restaurants (archived);

create table if not exists public.contact_history (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid references public.users (id),
  action_type text not null,
  old_status text,
  new_status text,
  note text,
  contact_at timestamptz,
  next_contact_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contact_history_restaurant_idx
  on public.contact_history (restaurant_id, created_at desc);

create table if not exists public.tours (
  id uuid primary key default gen_random_uuid(),
  tour_date date not null,
  responsible_user_id uuid references public.users (id),
  status text not null default 'Geplant',
  created_at timestamptz not null default now()
);

create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  position integer not null,
  status text not null default 'Geplant',
  visited_at timestamptz
);

create index if not exists tour_stops_tour_position_idx
  on public.tour_stops (tour_id, position);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  package_name text,
  setup_price text,
  monthly_price text,
  special_requests text,
  offer_date date,
  valid_until date,
  status text not null default 'Entwurf',
  created_by uuid references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_package_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.restaurants enable row level security;
alter table public.contact_history enable row level security;
alter table public.tours enable row level security;
alter table public.tour_stops enable row level security;
alter table public.offers enable row level security;
alter table public.service_package_templates enable row level security;

create policy "Authenticated users can read users"
  on public.users for select
  to authenticated
  using (true);

create policy "Authenticated users can manage restaurants"
  on public.restaurants for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage contact history"
  on public.contact_history for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage tours"
  on public.tours for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage tour stops"
  on public.tour_stops for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage offers"
  on public.offers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage package templates"
  on public.service_package_templates for all
  to authenticated
  using (true)
  with check (true);
