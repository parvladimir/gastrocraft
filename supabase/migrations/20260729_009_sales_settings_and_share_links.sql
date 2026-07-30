-- CRM settings and safe offer share links.

create table if not exists public.sales_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

create table if not exists public.offer_share_links (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.sales_settings enable row level security;
alter table public.offer_share_links enable row level security;

drop policy if exists "Authenticated users can read sales settings" on public.sales_settings;
create policy "Authenticated users can read sales settings"
  on public.sales_settings for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Admins can manage sales settings" on public.sales_settings;
create policy "Admins can manage sales settings"
  on public.sales_settings for all
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

drop policy if exists "Authenticated users can read offer share links" on public.offer_share_links;
create policy "Authenticated users can read offer share links"
  on public.offer_share_links for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can create offer share links" on public.offer_share_links;
create policy "Authenticated users can create offer share links"
  on public.offer_share_links for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Admins can update offer share links" on public.offer_share_links;
create policy "Admins can update offer share links"
  on public.offer_share_links for update
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

insert into public.sales_settings (key, value)
values
  ('company_name', '"DINEVIO"'::jsonb),
  ('website', '"https://www.dinevio.de"'::jsonb),
  ('default_vat_rate', '19'::jsonb),
  ('offer_validity_days', '14'::jsonb),
  ('offer_follow_up_days', '3'::jsonb),
  ('currency', '"EUR"'::jsonb),
  ('default_country', '"Deutschland"'::jsonb),
  ('offer_number_prefix', '"DV"'::jsonb)
on conflict (key) do nothing;
