-- DINEVIO Sales Manager Supabase schema.
-- Run in Supabase SQL Editor after creating the project and Auth users.
-- Do not store passwords, API secrets or invented legal data in this schema.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'sales' check (role in ('admin', 'sales')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  latitude text,
  longitude text,
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
  responsible_user_id uuid references public.profiles (id),
  notes text,
  planned_visit_at timestamptz,
  next_contact_at timestamptz,
  next_contact_type text,
  digital_presence jsonb,
  archived boolean not null default false,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_status_idx on public.restaurants (status);
create index if not exists restaurants_next_contact_idx on public.restaurants (next_contact_at);
create index if not exists restaurants_responsible_idx on public.restaurants (responsible_user_id);
create index if not exists restaurants_archived_idx on public.restaurants (archived);
create index if not exists restaurants_lookup_idx
  on public.restaurants (lower(name), lower(coalesce(street, '')), postal_code, lower(coalesce(city, '')));

create table if not exists public.contact_history (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid references public.profiles (id),
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
  responsible_user_id uuid references public.profiles (id),
  status text not null default 'Geplant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  position integer not null,
  status text not null default 'Geplant',
  visited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_packages (
  id text primary key,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.contact_history enable row level security;
alter table public.tours enable row level security;
alter table public.tour_stops enable row level security;
alter table public.offers enable row level security;
alter table public.service_packages enable row level security;

create or replace function public.is_sales_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (auth.uid() is not null);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can manage profiles"
  on public.profiles for all
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

create policy "Authenticated users can read restaurants"
  on public.restaurants for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create restaurants"
  on public.restaurants for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update restaurants"
  on public.restaurants for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete restaurants"
  on public.restaurants for delete
  to authenticated
  using (public.is_sales_admin());

create policy "Authenticated users can read contact history"
  on public.contact_history for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create contact history"
  on public.contact_history for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update contact history"
  on public.contact_history for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete contact history"
  on public.contact_history for delete
  to authenticated
  using (public.is_sales_admin());

create policy "Authenticated users can read tours"
  on public.tours for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create tours"
  on public.tours for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update tours"
  on public.tours for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete tours"
  on public.tours for delete
  to authenticated
  using (public.is_sales_admin());

create policy "Authenticated users can read tour stops"
  on public.tour_stops for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create tour stops"
  on public.tour_stops for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update tour stops"
  on public.tour_stops for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete tour stops"
  on public.tour_stops for delete
  to authenticated
  using (public.is_sales_admin());

create policy "Authenticated users can read offers"
  on public.offers for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create offers"
  on public.offers for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update offers"
  on public.offers for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete offers"
  on public.offers for delete
  to authenticated
  using (public.is_sales_admin());

create policy "Authenticated users can read service packages"
  on public.service_packages for select
  to authenticated
  using (auth.uid() is not null);

create policy "Authenticated users can create service packages"
  on public.service_packages for insert
  to authenticated
  with check (auth.uid() is not null);

create policy "Authenticated users can update service packages"
  on public.service_packages for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Admins can delete service packages"
  on public.service_packages for delete
  to authenticated
  using (public.is_sales_admin());
