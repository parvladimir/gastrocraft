-- Public demo pages generated from approved restaurant snapshots.

alter table public.restaurants
  add column if not exists custom_demo_slug text,
  add column if not exists custom_demo_url text,
  add column if not exists generated_demo_at timestamptz;

create unique index if not exists restaurants_custom_demo_slug_idx
  on public.restaurants (custom_demo_slug)
  where custom_demo_slug is not null;

create table if not exists public.demo_pages (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  slug text not null unique,
  template text not null default 'restaurant',
  snapshot jsonb not null,
  published boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists demo_pages_restaurant_idx on public.demo_pages (restaurant_id);
create index if not exists demo_pages_published_idx on public.demo_pages (published);

alter table public.demo_pages enable row level security;

drop policy if exists "Public can read published demo pages" on public.demo_pages;
create policy "Public can read published demo pages"
  on public.demo_pages for select
  to anon, authenticated
  using (published = true);

drop policy if exists "Authenticated users can create demo pages" on public.demo_pages;
create policy "Authenticated users can create demo pages"
  on public.demo_pages for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update demo pages" on public.demo_pages;
create policy "Authenticated users can update demo pages"
  on public.demo_pages for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Admins can delete demo pages" on public.demo_pages;
create policy "Admins can delete demo pages"
  on public.demo_pages for delete
  to authenticated
  using (public.is_sales_admin());
