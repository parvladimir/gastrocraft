-- Transactional restaurant creation and versioned public demo snapshots.

create or replace function public.create_restaurant_with_history(p_restaurant jsonb)
returns public.restaurants
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_restaurant public.restaurants;
  v_name text := nullif(trim(coalesce(p_restaurant->>'name', '')), '');
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if v_name is null then
    raise exception 'Restaurant name is required';
  end if;

  insert into public.restaurants (
    name,
    category,
    street,
    house_number,
    postal_code,
    city,
    phone,
    email,
    website,
    google_maps_url,
    google_place_id,
    latitude,
    longitude,
    location_accuracy,
    location_updated_at,
    opening_hours,
    google_rating,
    google_review_count,
    photos,
    instagram,
    facebook,
    tiktok,
    contact_person,
    contact_position,
    status,
    interest_level,
    selected_demo,
    responsible_user_id,
    notes,
    planned_visit_at,
    next_contact_at,
    next_contact_type,
    digital_presence,
    archived,
    custom_demo_slug,
    custom_demo_url,
    generated_demo_at,
    rejection_reason,
    created_by,
    created_at,
    updated_by,
    updated_at
  )
  values (
    v_name,
    nullif(p_restaurant->>'category', ''),
    nullif(p_restaurant->>'street', ''),
    nullif(p_restaurant->>'house_number', ''),
    nullif(p_restaurant->>'postal_code', ''),
    nullif(p_restaurant->>'city', ''),
    nullif(p_restaurant->>'phone', ''),
    nullif(p_restaurant->>'email', ''),
    nullif(p_restaurant->>'website', ''),
    nullif(p_restaurant->>'google_maps_url', ''),
    nullif(p_restaurant->>'google_place_id', ''),
    nullif(p_restaurant->>'latitude', '')::double precision,
    nullif(p_restaurant->>'longitude', '')::double precision,
    nullif(p_restaurant->>'location_accuracy', ''),
    nullif(p_restaurant->>'location_updated_at', '')::timestamptz,
    case
      when jsonb_typeof(p_restaurant->'opening_hours') = 'array' then p_restaurant->'opening_hours'
      else '[]'::jsonb
    end,
    nullif(p_restaurant->>'google_rating', '')::numeric,
    nullif(p_restaurant->>'google_review_count', '')::integer,
    case
      when jsonb_typeof(p_restaurant->'photos') = 'array' then p_restaurant->'photos'
      else '[]'::jsonb
    end,
    nullif(p_restaurant->>'instagram', ''),
    nullif(p_restaurant->>'facebook', ''),
    nullif(p_restaurant->>'tiktok', ''),
    nullif(p_restaurant->>'contact_person', ''),
    nullif(p_restaurant->>'contact_position', ''),
    coalesce(nullif(p_restaurant->>'status', ''), 'Neu'),
    nullif(p_restaurant->>'interest_level', '')::integer,
    coalesce(nullif(p_restaurant->>'selected_demo', ''), 'none'),
    coalesce(nullif(p_restaurant->>'responsible_user_id', '')::uuid, v_user_id),
    nullif(p_restaurant->>'notes', ''),
    nullif(p_restaurant->>'planned_visit_at', '')::timestamptz,
    nullif(p_restaurant->>'next_contact_at', '')::timestamptz,
    nullif(p_restaurant->>'next_contact_type', ''),
    case
      when jsonb_typeof(p_restaurant->'digital_presence') = 'object' then p_restaurant->'digital_presence'
      else null
    end,
    coalesce((p_restaurant->>'archived')::boolean, false),
    nullif(p_restaurant->>'custom_demo_slug', ''),
    nullif(p_restaurant->>'custom_demo_url', ''),
    nullif(p_restaurant->>'generated_demo_at', '')::timestamptz,
    nullif(p_restaurant->>'rejection_reason', ''),
    v_user_id,
    now(),
    v_user_id,
    now()
  )
  returning * into v_restaurant;

  insert into public.contact_history (
    restaurant_id,
    user_id,
    action_type,
    new_status,
    note,
    contact_at,
    created_at,
    metadata
  )
  values (
    v_restaurant.id,
    v_user_id,
    'restaurant_created',
    v_restaurant.status,
    'Restaurant wurde angelegt.',
    now(),
    now(),
    '{}'::jsonb
  );

  return v_restaurant;
end;
$$;

grant execute on function public.create_restaurant_with_history(jsonb) to authenticated;

alter table public.demo_pages
  add column if not exists status text not null default 'published',
  add column if not exists template_key text,
  add column if not exists restaurant_name text,
  add column if not exists category text,
  add column if not exists address text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists google_maps_url text,
  add column if not exists opening_hours jsonb not null default '[]'::jsonb,
  add column if not exists hero_photo_path text,
  add column if not exists gallery_photo_paths jsonb not null default '[]'::jsonb,
  add column if not exists logo_photo_path text,
  add column if not exists content jsonb not null default '{}'::jsonb,
  add column if not exists version integer not null default 1,
  add column if not exists published_at timestamptz;

update public.demo_pages
set
  status = case when published then 'published' else 'draft' end,
  template_key = coalesce(template_key, template),
  restaurant_name = coalesce(restaurant_name, snapshot->>'name'),
  category = coalesce(category, snapshot->>'category'),
  address = coalesce(address, snapshot->>'address'),
  postal_code = coalesce(postal_code, snapshot->>'postalCode'),
  city = coalesce(city, snapshot->>'city'),
  phone = coalesce(phone, snapshot->>'phone'),
  website = coalesce(website, snapshot->>'website'),
  instagram = coalesce(instagram, snapshot->>'instagram'),
  google_maps_url = coalesce(google_maps_url, snapshot->>'googleMapsUrl'),
  opening_hours = case
    when jsonb_typeof(snapshot->'openingHours') = 'array' then snapshot->'openingHours'
    else opening_hours
  end,
  content = case
    when jsonb_typeof(snapshot) = 'object' then snapshot
    else content
  end,
  published_at = coalesce(published_at, created_at)
where restaurant_name is null;

alter table public.demo_pages
  drop constraint if exists demo_pages_status_check;

alter table public.demo_pages
  add constraint demo_pages_status_check
  check (status in ('draft', 'published', 'archived'));

create index if not exists demo_pages_status_slug_idx on public.demo_pages (status, slug);
create index if not exists demo_pages_restaurant_version_idx on public.demo_pages (restaurant_id, version desc);

insert into storage.buckets (id, name, public)
values ('demo-assets', 'demo-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read demo asset files" on storage.objects;
create policy "Public can read demo asset files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'demo-assets');

drop policy if exists "Authenticated users can upload demo asset files" on storage.objects;
create policy "Authenticated users can upload demo asset files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'demo-assets');

drop policy if exists "Authenticated users can update demo asset files" on storage.objects;
create policy "Authenticated users can update demo asset files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'demo-assets')
  with check (bucket_id = 'demo-assets');

drop policy if exists "Admins can delete demo asset files" on storage.objects;
create policy "Admins can delete demo asset files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'demo-assets' and public.is_sales_admin());

drop policy if exists "Public can read published demo pages" on public.demo_pages;
create policy "Public can read published demo pages"
  on public.demo_pages for select
  to anon, authenticated
  using (status = 'published');

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
