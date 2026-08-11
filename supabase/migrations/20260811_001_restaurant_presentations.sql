-- Versioned, private DINEVIO sales sheets for published restaurant demos.
-- Run this migration in the Supabase SQL Editor after the existing migrations.

create table if not exists public.restaurant_presentations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  demo_page_id uuid not null references public.demo_pages (id) on delete restrict,
  presentation_type text not null default 'a4_sales_sheet'
    check (presentation_type in ('a4_sales_sheet')),
  version integer not null default 1 check (version > 0),
  pdf_storage_path text not null,
  demo_url text not null,
  qr_target_url text not null,
  theme_snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid not null references public.profiles (id),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, presentation_type, version)
);

create index if not exists restaurant_presentations_restaurant_generated_idx
  on public.restaurant_presentations (restaurant_id, generated_at desc);
create index if not exists restaurant_presentations_demo_idx
  on public.restaurant_presentations (demo_page_id, version desc);

create or replace function public.set_restaurant_presentation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists restaurant_presentations_set_updated_at on public.restaurant_presentations;
create trigger restaurant_presentations_set_updated_at
  before update on public.restaurant_presentations
  for each row execute function public.set_restaurant_presentation_updated_at();

alter table public.restaurant_presentations enable row level security;

drop policy if exists "Authenticated users can read restaurant presentations" on public.restaurant_presentations;
create policy "Authenticated users can read restaurant presentations"
  on public.restaurant_presentations for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can create restaurant presentations" on public.restaurant_presentations;
create policy "Authenticated users can create restaurant presentations"
  on public.restaurant_presentations for insert
  to authenticated
  with check (generated_by = auth.uid());

drop policy if exists "Creators and admins can update restaurant presentations" on public.restaurant_presentations;
create policy "Creators and admins can update restaurant presentations"
  on public.restaurant_presentations for update
  to authenticated
  using (generated_by = auth.uid() or public.is_sales_admin())
  with check (generated_by = auth.uid() or public.is_sales_admin());

drop policy if exists "Admins can delete restaurant presentations" on public.restaurant_presentations;
create policy "Admins can delete restaurant presentations"
  on public.restaurant_presentations for delete
  to authenticated
  using (public.is_sales_admin());

insert into storage.buckets (id, name, public)
values ('presentations', 'presentations', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can read presentation files" on storage.objects;
create policy "Authenticated users can read presentation files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'presentations');

drop policy if exists "Authenticated users can upload presentation files" on storage.objects;
create policy "Authenticated users can upload presentation files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'presentations');

drop policy if exists "Authenticated users can update presentation files" on storage.objects;
create policy "Authenticated users can update presentation files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'presentations')
  with check (bucket_id = 'presentations');

drop policy if exists "Admins can delete presentation files" on storage.objects;
create policy "Admins can delete presentation files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'presentations' and public.is_sales_admin());
