-- Restaurant photo metadata stored in private Supabase Storage.

create table if not exists public.restaurant_photos (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  storage_path text not null,
  file_name text,
  mime_type text,
  file_size bigint,
  photo_type text not null default 'other'
    check (photo_type in ('facade', 'interior', 'menu', 'logo', 'other')),
  caption text,
  is_primary boolean not null default false,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists restaurant_photos_restaurant_idx
  on public.restaurant_photos (restaurant_id, created_at desc);

create unique index if not exists restaurant_photos_one_primary_idx
  on public.restaurant_photos (restaurant_id)
  where is_primary = true;

alter table public.restaurant_photos enable row level security;

drop policy if exists "Authenticated users can read restaurant photos" on public.restaurant_photos;
create policy "Authenticated users can read restaurant photos"
  on public.restaurant_photos for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can create restaurant photos" on public.restaurant_photos;
create policy "Authenticated users can create restaurant photos"
  on public.restaurant_photos for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update restaurant photos" on public.restaurant_photos;
create policy "Authenticated users can update restaurant photos"
  on public.restaurant_photos for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Admins can delete restaurant photos" on public.restaurant_photos;
create policy "Admins can delete restaurant photos"
  on public.restaurant_photos for delete
  to authenticated
  using (public.is_sales_admin());

insert into storage.buckets (id, name, public)
values ('restaurant-photos', 'restaurant-photos', false)
on conflict (id) do nothing;
