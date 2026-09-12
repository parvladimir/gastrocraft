-- Secure Restaurant Scout bot integration.
-- Extends roles/provenance, adds agent audit tables, helper functions,
-- restrictive scout RLS, and SECURITY DEFINER duplicate/lead RPCs.
-- Non-destructive: ADD COLUMN IF NOT EXISTS, CREATE IF NOT EXISTS, DROP POLICY IF EXISTS.

-- ---------------------------------------------------------------------------
-- 1) Profiles: role + kill switch
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'sales', 'restaurant_scout_bot'));

alter table public.profiles
  add column if not exists bot_enabled boolean not null default true;

comment on column public.profiles.bot_enabled is
  'Kill switch for restaurant_scout_bot users. When false, scout write APIs must reject.';

-- ---------------------------------------------------------------------------
-- 2) Restaurant provenance / scout fields
-- ---------------------------------------------------------------------------
alter table public.restaurants
  add column if not exists source_type text,
  add column if not exists created_by_agent boolean not null default false,
  add column if not exists agent_run_id uuid,
  add column if not exists discovered_at timestamptz,
  add column if not exists source_url text,
  add column if not exists source_name text,
  add column if not exists website_status text,
  add column if not exists lead_score integer,
  add column if not exists selection_reason text,
  add column if not exists lead_status text,
  add column if not exists visit_status text;

alter table public.restaurants
  drop constraint if exists restaurants_source_type_check;
alter table public.restaurants
  add constraint restaurants_source_type_check
  check (
    source_type is null
    or source_type in ('agent_discovery', 'manual', 'import', 'lookup')
  );

alter table public.restaurants
  drop constraint if exists restaurants_lead_score_check;
alter table public.restaurants
  add constraint restaurants_lead_score_check
  check (lead_score is null or (lead_score >= 0 and lead_score <= 100));

alter table public.restaurants
  drop constraint if exists restaurants_lead_status_check;
alter table public.restaurants
  add constraint restaurants_lead_status_check
  check (
    lead_status is null
    or lead_status in ('new', 'qualified', 'rejected', 'converted', 'duplicate')
  );

alter table public.restaurants
  drop constraint if exists restaurants_visit_status_check;
alter table public.restaurants
  add constraint restaurants_visit_status_check
  check (
    visit_status is null
    or visit_status in ('none', 'to_plan', 'planned', 'done', 'skipped')
  );

alter table public.restaurants
  drop constraint if exists restaurants_website_status_check;
alter table public.restaurants
  add constraint restaurants_website_status_check
  check (
    website_status is null
    or website_status in ('unknown', 'ok', 'broken', 'missing', 'redirect')
  );

create index if not exists restaurants_agent_run_id_idx
  on public.restaurants (agent_run_id);
create index if not exists restaurants_created_by_agent_idx
  on public.restaurants (created_by_agent, created_by);
create index if not exists restaurants_discovered_at_idx
  on public.restaurants (discovered_at desc);
create index if not exists restaurants_lead_status_idx
  on public.restaurants (lead_status);
create index if not exists restaurants_visit_status_idx
  on public.restaurants (visit_status);

-- ---------------------------------------------------------------------------
-- 3) Agent run / audit / idempotency tables
-- ---------------------------------------------------------------------------
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'running'
    check (status in ('running', 'finished', 'failed', 'cancelled')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  leads_created integer not null default 0
    check (leads_created >= 0),
  max_leads integer not null default 3
    check (max_leads > 0 and max_leads <= 20),
  city text,
  region text,
  notes text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_agent_user_id_idx
  on public.agent_runs (agent_user_id, started_at desc);
create index if not exists agent_runs_status_idx
  on public.agent_runs (status);

alter table public.restaurants
  drop constraint if exists restaurants_agent_run_id_fkey;
alter table public.restaurants
  add constraint restaurants_agent_run_id_fkey
  foreign key (agent_run_id) references public.agent_runs (id);

create table if not exists public.agent_audit_log (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.profiles (id) on delete cascade,
  agent_run_id uuid references public.agent_runs (id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  success boolean not null default true,
  details jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists agent_audit_log_agent_user_id_idx
  on public.agent_audit_log (agent_user_id, created_at desc);
create index if not exists agent_audit_log_action_idx
  on public.agent_audit_log (action, created_at desc);
create index if not exists agent_audit_log_run_idx
  on public.agent_audit_log (agent_run_id);

create table if not exists public.agent_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  agent_user_id uuid not null references public.profiles (id) on delete cascade,
  idempotency_key text not null,
  request_path text not null,
  request_hash text,
  response_status integer not null,
  response_body jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (agent_user_id, idempotency_key)
);

create index if not exists agent_idempotency_keys_created_at_idx
  on public.agent_idempotency_keys (created_at);

-- ---------------------------------------------------------------------------
-- 4) Helper functions
-- ---------------------------------------------------------------------------
create or replace function public.is_sales_staff()
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
      and role in ('admin', 'sales')
  );
$$;

create or replace function public.is_restaurant_scout_bot()
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
      and role = 'restaurant_scout_bot'
  );
$$;

create or replace function public.is_bot_enabled()
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
      and role = 'restaurant_scout_bot'
      and bot_enabled = true
  );
$$;

revoke all on function public.is_sales_staff() from public;
revoke all on function public.is_restaurant_scout_bot() from public;
revoke all on function public.is_bot_enabled() from public;
grant execute on function public.is_sales_staff() to authenticated;
grant execute on function public.is_restaurant_scout_bot() to authenticated;
grant execute on function public.is_bot_enabled() to authenticated;

-- ---------------------------------------------------------------------------
-- 5) SECURITY DEFINER: minimal duplicate check for scout
-- ---------------------------------------------------------------------------
create or replace function public.scout_check_restaurant_duplicate(
  p_name text,
  p_street text default null,
  p_house_number text default null,
  p_postal_code text default null,
  p_city text default null,
  p_phone text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.restaurants%rowtype;
  v_matched_on text := null;
  v_confidence numeric := 0;
  v_norm_name text := lower(trim(coalesce(p_name, '')));
  v_norm_street text := lower(trim(coalesce(p_street, '')));
  v_norm_house text := lower(trim(coalesce(p_house_number, '')));
  v_norm_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not (public.is_sales_staff() or public.is_restaurant_scout_bot()) then
    raise exception 'Forbidden';
  end if;

  if v_norm_name = '' then
    return jsonb_build_object(
      'duplicate', false,
      'restaurant_id', null,
      'matched_on', null,
      'confidence', 0
    );
  end if;

  select r.*
  into v_row
  from public.restaurants r
  where r.archived = false
    and lower(trim(coalesce(r.name, ''))) = v_norm_name
    and (
      (
        coalesce(nullif(trim(coalesce(r.postal_code, '')), ''), '') =
          coalesce(nullif(trim(coalesce(p_postal_code, '')), ''), '')
        and lower(trim(coalesce(r.city, ''))) = lower(trim(coalesce(p_city, '')))
        and (
          (
            v_norm_street <> ''
            and lower(trim(coalesce(r.street, ''))) = v_norm_street
            and lower(trim(coalesce(r.house_number, ''))) = v_norm_house
          )
          or (
            v_norm_phone <> ''
            and regexp_replace(coalesce(r.phone, ''), '[^0-9+]', '', 'g') = v_norm_phone
          )
        )
      )
      or (
        v_norm_phone <> ''
        and regexp_replace(coalesce(r.phone, ''), '[^0-9+]', '', 'g') = v_norm_phone
        and length(v_norm_phone) >= 6
      )
    )
  order by r.created_at asc
  limit 1;

  if not found then
    return jsonb_build_object(
      'duplicate', false,
      'restaurant_id', null,
      'matched_on', null,
      'confidence', 0
    );
  end if;

  if
    v_norm_street <> ''
    and lower(trim(coalesce(v_row.street, ''))) = v_norm_street
    and lower(trim(coalesce(v_row.house_number, ''))) = v_norm_house
  then
    v_matched_on := 'name_address';
    v_confidence := 0.95;
  elsif
    v_norm_phone <> ''
    and regexp_replace(coalesce(v_row.phone, ''), '[^0-9+]', '', 'g') = v_norm_phone
  then
    v_matched_on := 'name_phone';
    v_confidence := 0.9;
  else
    v_matched_on := 'name_city';
    v_confidence := 0.7;
  end if;

  return jsonb_build_object(
    'duplicate', true,
    'restaurant_id', v_row.id,
    'matched_on', v_matched_on,
    'confidence', v_confidence
  );
end;
$$;

revoke all on function public.scout_check_restaurant_duplicate(text, text, text, text, text, text) from public;
grant execute on function public.scout_check_restaurant_duplicate(text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) SECURITY DEFINER: create scout lead with server-side allowlist
-- ---------------------------------------------------------------------------
create or replace function public.create_scout_lead(
  p_run_id uuid,
  p_lead jsonb
)
returns public.restaurants
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.agent_runs%rowtype;
  v_name text := nullif(trim(coalesce(p_lead->>'name', '')), '');
  v_dup jsonb;
  v_restaurant public.restaurants;
  v_score integer;
  v_website text;
  v_source_url text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_restaurant_scout_bot() then
    raise exception 'Forbidden: scout role required';
  end if;

  if not public.is_bot_enabled() then
    raise exception 'Bot disabled';
  end if;

  select * into v_run
  from public.agent_runs
  where id = p_run_id
    and agent_user_id = v_user_id
  for update;

  if not found then
    raise exception 'Run not found';
  end if;

  if v_run.status <> 'running' then
    raise exception 'Run is not active';
  end if;

  if v_run.leads_created >= v_run.max_leads then
    raise exception 'Lead limit for run exceeded';
  end if;

  if v_name is null then
    raise exception 'Restaurant name is required';
  end if;

  v_score := coalesce((p_lead->>'lead_score')::integer, 0);
  if v_score < 0 or v_score > 100 then
    raise exception 'lead_score out of range';
  end if;

  v_website := nullif(trim(coalesce(p_lead->>'website', '')), '');
  if v_website is not null and v_website !~* '^https?://' then
    raise exception 'website must be http(s)';
  end if;

  v_source_url := nullif(trim(coalesce(p_lead->>'source_url', '')), '');
  if v_source_url is not null and v_source_url !~* '^https?://' then
    raise exception 'source_url must be http(s)';
  end if;

  v_dup := public.scout_check_restaurant_duplicate(
    v_name,
    nullif(p_lead->>'street', ''),
    nullif(p_lead->>'house_number', ''),
    nullif(p_lead->>'postal_code', ''),
    nullif(p_lead->>'city', ''),
    nullif(p_lead->>'phone', '')
  );

  if coalesce((v_dup->>'duplicate')::boolean, false) then
    raise exception 'Duplicate restaurant: %', v_dup->>'restaurant_id';
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
    notes,
    status,
    selected_demo,
    archived,
    responsible_user_id,
    created_by,
    updated_by,
    source_type,
    created_by_agent,
    agent_run_id,
    discovered_at,
    source_url,
    source_name,
    website_status,
    lead_score,
    selection_reason,
    lead_status,
    visit_status
  )
  values (
    v_name,
    nullif(p_lead->>'category', ''),
    nullif(trim(coalesce(p_lead->>'street', '')), ''),
    nullif(trim(coalesce(p_lead->>'house_number', '')), ''),
    nullif(trim(coalesce(p_lead->>'postal_code', '')), ''),
    nullif(trim(coalesce(p_lead->>'city', '')), ''),
    nullif(trim(coalesce(p_lead->>'phone', '')), ''),
    nullif(trim(coalesce(p_lead->>'email', '')), ''),
    v_website,
    nullif(trim(coalesce(p_lead->>'google_maps_url', '')), ''),
    nullif(trim(coalesce(p_lead->>'google_place_id', '')), ''),
    nullif(trim(coalesce(p_lead->>'latitude', '')), '')::double precision,
    nullif(trim(coalesce(p_lead->>'longitude', '')), '')::double precision,
    left(nullif(trim(coalesce(p_lead->>'notes', '')), ''), 2000),
    'Neu',
    'none',
    false,
    v_user_id,
    v_user_id,
    v_user_id,
    'agent_discovery',
    true,
    p_run_id,
    coalesce(nullif(p_lead->>'discovered_at', '')::timestamptz, now()),
    v_source_url,
    left(nullif(trim(coalesce(p_lead->>'source_name', '')), ''), 200),
    coalesce(nullif(p_lead->>'website_status', ''), 'unknown'),
    v_score,
    left(nullif(trim(coalesce(p_lead->>'selection_reason', '')), ''), 1000),
    'new',
    'none'
  )
  returning * into v_restaurant;

  update public.agent_runs
  set
    leads_created = leads_created + 1,
    updated_at = now()
  where id = p_run_id;

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
    'Neu',
    'Lead via Restaurant Scout Bot.',
    now(),
    now(),
    jsonb_build_object(
      'agent_run_id', p_run_id,
      'source_type', 'agent_discovery'
    )
  );

  return v_restaurant;
end;
$$;

revoke all on function public.create_scout_lead(uuid, jsonb) from public;
grant execute on function public.create_scout_lead(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 7) RLS rewrite: sales staff only for broad CRM access + scout narrow policies
-- ---------------------------------------------------------------------------
alter table public.agent_runs enable row level security;
alter table public.agent_audit_log enable row level security;
alter table public.agent_idempotency_keys enable row level security;

-- profiles
drop policy if exists "Authenticated users can read profiles" on public.profiles;
drop policy if exists "Sales staff can read profiles" on public.profiles;
create policy "Sales staff can read profiles"
  on public.profiles for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Scout can read own profile" on public.profiles;
create policy "Scout can read own profile"
  on public.profiles for select
  to authenticated
  using (public.is_restaurant_scout_bot() and id = auth.uid());

drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can update own non-role profile fields" on public.profiles;
-- Scout and sales may update own profile row but NOT role / bot_enabled via client.
-- Role changes remain admin-only via "Admins can manage profiles".
create policy "Users can update own non-privileged profile fields"
  on public.profiles for update
  to authenticated
  using (
    id = auth.uid()
    and (public.is_sales_staff() or public.is_restaurant_scout_bot())
  )
  with check (
    id = auth.uid()
    and (public.is_sales_staff() or public.is_restaurant_scout_bot())
  );

-- restaurants
drop policy if exists "Authenticated users can read restaurants" on public.restaurants;
drop policy if exists "Sales staff can read restaurants" on public.restaurants;
create policy "Sales staff can read restaurants"
  on public.restaurants for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Scout can read own agent leads" on public.restaurants;
create policy "Scout can read own agent leads"
  on public.restaurants for select
  to authenticated
  using (
    public.is_restaurant_scout_bot()
    and created_by = auth.uid()
    and created_by_agent = true
  );

drop policy if exists "Authenticated users can create restaurants" on public.restaurants;
drop policy if exists "Sales staff can create restaurants" on public.restaurants;
create policy "Sales staff can create restaurants"
  on public.restaurants for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Scout can insert own agent leads" on public.restaurants;
create policy "Scout can insert own agent leads"
  on public.restaurants for insert
  to authenticated
  with check (
    public.is_bot_enabled()
    and created_by = auth.uid()
    and updated_by = auth.uid()
    and created_by_agent = true
    and source_type = 'agent_discovery'
    and agent_run_id is not null
    and coalesce(archived, false) = false
  );

drop policy if exists "Authenticated users can update restaurants" on public.restaurants;
drop policy if exists "Sales staff can update restaurants" on public.restaurants;
create policy "Sales staff can update restaurants"
  on public.restaurants for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

-- Scout: no UPDATE/DELETE on restaurants (visit_status via API uses sales path or RPC below)

drop policy if exists "Admins can delete restaurants" on public.restaurants;
create policy "Admins can delete restaurants"
  on public.restaurants for delete
  to authenticated
  using (public.is_sales_admin());

-- contact_history
drop policy if exists "Authenticated users can read contact history" on public.contact_history;
drop policy if exists "Sales staff can read contact history" on public.contact_history;
create policy "Sales staff can read contact history"
  on public.contact_history for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create contact history" on public.contact_history;
drop policy if exists "Sales staff can create contact history" on public.contact_history;
create policy "Sales staff can create contact history"
  on public.contact_history for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Scout can insert own lead history" on public.contact_history;
create policy "Scout can insert own lead history"
  on public.contact_history for insert
  to authenticated
  with check (
    public.is_bot_enabled()
    and user_id = auth.uid()
    and exists (
      select 1 from public.restaurants r
      where r.id = restaurant_id
        and r.created_by = auth.uid()
        and r.created_by_agent = true
    )
  );

drop policy if exists "Authenticated users can update contact history" on public.contact_history;
drop policy if exists "Sales staff can update contact history" on public.contact_history;
create policy "Sales staff can update contact history"
  on public.contact_history for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete contact history" on public.contact_history;
create policy "Admins can delete contact history"
  on public.contact_history for delete
  to authenticated
  using (public.is_sales_admin());

-- tours
drop policy if exists "Authenticated users can read tours" on public.tours;
drop policy if exists "Sales staff can read tours" on public.tours;
create policy "Sales staff can read tours"
  on public.tours for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create tours" on public.tours;
drop policy if exists "Sales staff can create tours" on public.tours;
create policy "Sales staff can create tours"
  on public.tours for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Authenticated users can update tours" on public.tours;
drop policy if exists "Sales staff can update tours" on public.tours;
create policy "Sales staff can update tours"
  on public.tours for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete tours" on public.tours;
create policy "Admins can delete tours"
  on public.tours for delete
  to authenticated
  using (public.is_sales_admin());

-- tour_stops
drop policy if exists "Authenticated users can read tour stops" on public.tour_stops;
drop policy if exists "Sales staff can read tour stops" on public.tour_stops;
create policy "Sales staff can read tour stops"
  on public.tour_stops for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create tour stops" on public.tour_stops;
drop policy if exists "Sales staff can create tour stops" on public.tour_stops;
create policy "Sales staff can create tour stops"
  on public.tour_stops for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Authenticated users can update tour stops" on public.tour_stops;
drop policy if exists "Sales staff can update tour stops" on public.tour_stops;
create policy "Sales staff can update tour stops"
  on public.tour_stops for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete tour stops" on public.tour_stops;
create policy "Admins can delete tour stops"
  on public.tour_stops for delete
  to authenticated
  using (public.is_sales_admin());

-- offers
drop policy if exists "Authenticated users can read offers" on public.offers;
drop policy if exists "Sales staff can read offers" on public.offers;
create policy "Sales staff can read offers"
  on public.offers for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create offers" on public.offers;
drop policy if exists "Sales staff can create offers" on public.offers;
create policy "Sales staff can create offers"
  on public.offers for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Authenticated users can update offers" on public.offers;
drop policy if exists "Sales staff can update offers" on public.offers;
create policy "Sales staff can update offers"
  on public.offers for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete offers" on public.offers;
create policy "Admins can delete offers"
  on public.offers for delete
  to authenticated
  using (public.is_sales_admin());

-- service_packages
drop policy if exists "Authenticated users can read service packages" on public.service_packages;
drop policy if exists "Sales staff can read service packages" on public.service_packages;
create policy "Sales staff can read service packages"
  on public.service_packages for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create service packages" on public.service_packages;
drop policy if exists "Sales staff can create service packages" on public.service_packages;
create policy "Sales staff can create service packages"
  on public.service_packages for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Authenticated users can update service packages" on public.service_packages;
drop policy if exists "Sales staff can update service packages" on public.service_packages;
create policy "Sales staff can update service packages"
  on public.service_packages for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete service packages" on public.service_packages;
create policy "Admins can delete service packages"
  on public.service_packages for delete
  to authenticated
  using (public.is_sales_admin());

-- tasks
drop policy if exists "Authenticated users can read tasks" on public.tasks;
drop policy if exists "Sales staff can read tasks" on public.tasks;
create policy "Sales staff can read tasks"
  on public.tasks for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Scout can read own visit tasks" on public.tasks;
create policy "Scout can read own visit tasks"
  on public.tasks for select
  to authenticated
  using (
    public.is_restaurant_scout_bot()
    and created_by = auth.uid()
  );

drop policy if exists "Authenticated users can create tasks" on public.tasks;
drop policy if exists "Sales staff can create tasks" on public.tasks;
create policy "Sales staff can create tasks"
  on public.tasks for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Scout can create visit tasks for own leads" on public.tasks;
create policy "Scout can create visit tasks for own leads"
  on public.tasks for insert
  to authenticated
  with check (
    public.is_bot_enabled()
    and created_by = auth.uid()
    and task_type = 'visit'
    and due_at is null
    and status = 'open'
    and exists (
      select 1
      from public.restaurants r
      join public.agent_runs ar on ar.id = r.agent_run_id
      where r.id = restaurant_id
        and r.created_by = auth.uid()
        and r.created_by_agent = true
        and ar.agent_user_id = auth.uid()
        and ar.status = 'running'
    )
  );

drop policy if exists "Authenticated users can update tasks" on public.tasks;
drop policy if exists "Sales staff can update tasks" on public.tasks;
create policy "Sales staff can update tasks"
  on public.tasks for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

drop policy if exists "Admins can delete tasks" on public.tasks;
create policy "Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (public.is_sales_admin());

-- message_templates
drop policy if exists "Authenticated users can read message templates" on public.message_templates;
drop policy if exists "Sales staff can read message templates" on public.message_templates;
create policy "Sales staff can read message templates"
  on public.message_templates for select
  to authenticated
  using (public.is_sales_staff());

-- restaurant_photos
drop policy if exists "Authenticated users can read restaurant photos" on public.restaurant_photos;
drop policy if exists "Sales staff can read restaurant photos" on public.restaurant_photos;
create policy "Sales staff can read restaurant photos"
  on public.restaurant_photos for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Authenticated users can create restaurant photos" on public.restaurant_photos;
drop policy if exists "Sales staff can create restaurant photos" on public.restaurant_photos;
create policy "Sales staff can create restaurant photos"
  on public.restaurant_photos for insert
  to authenticated
  with check (public.is_sales_staff());

drop policy if exists "Authenticated users can update restaurant photos" on public.restaurant_photos;
drop policy if exists "Sales staff can update restaurant photos" on public.restaurant_photos;
create policy "Sales staff can update restaurant photos"
  on public.restaurant_photos for update
  to authenticated
  using (public.is_sales_staff())
  with check (public.is_sales_staff());

-- sales_settings / offer_share_links (if present)
drop policy if exists "Authenticated users can read sales settings" on public.sales_settings;
drop policy if exists "Sales staff can read sales settings" on public.sales_settings;
do $$
begin
  if to_regclass('public.sales_settings') is not null then
    execute $p$
      create policy "Sales staff can read sales settings"
        on public.sales_settings for select
        to authenticated
        using (public.is_sales_staff())
    $p$;
  end if;
end $$;

drop policy if exists "Authenticated users can read offer share links" on public.offer_share_links;
drop policy if exists "Sales staff can read offer share links" on public.offer_share_links;
do $$
begin
  if to_regclass('public.offer_share_links') is not null then
    execute $p$
      create policy "Sales staff can read offer share links"
        on public.offer_share_links for select
        to authenticated
        using (public.is_sales_staff())
    $p$;
    execute $p$
      drop policy if exists "Authenticated users can create offer share links" on public.offer_share_links
    $p$;
    execute $p$
      create policy "Sales staff can create offer share links"
        on public.offer_share_links for insert
        to authenticated
        with check (public.is_sales_staff())
    $p$;
  end if;
end $$;

-- demo_pages / restaurant_presentations: keep public read where needed; tighten writes
drop policy if exists "Authenticated users can create demo pages" on public.demo_pages;
drop policy if exists "Sales staff can create demo pages" on public.demo_pages;
do $$
begin
  if to_regclass('public.demo_pages') is not null then
    execute $p$
      create policy "Sales staff can create demo pages"
        on public.demo_pages for insert
        to authenticated
        with check (public.is_sales_staff())
    $p$;
    execute $p$
      drop policy if exists "Authenticated users can update demo pages" on public.demo_pages
    $p$;
    execute $p$
      create policy "Sales staff can update demo pages"
        on public.demo_pages for update
        to authenticated
        using (public.is_sales_staff())
        with check (public.is_sales_staff())
    $p$;
  end if;
end $$;

drop policy if exists "Authenticated users can read restaurant presentations" on public.restaurant_presentations;
drop policy if exists "Sales staff can read restaurant presentations" on public.restaurant_presentations;
do $$
begin
  if to_regclass('public.restaurant_presentations') is not null then
    execute $p$
      create policy "Sales staff can read restaurant presentations"
        on public.restaurant_presentations for select
        to authenticated
        using (public.is_sales_staff())
    $p$;
    execute $p$
      drop policy if exists "Authenticated users can create restaurant presentations" on public.restaurant_presentations
    $p$;
    execute $p$
      create policy "Sales staff can create restaurant presentations"
        on public.restaurant_presentations for insert
        to authenticated
        with check (public.is_sales_staff() and generated_by = auth.uid())
    $p$;
  end if;
end $$;

-- agent_runs
drop policy if exists "Scout can read own runs" on public.agent_runs;
create policy "Scout can read own runs"
  on public.agent_runs for select
  to authenticated
  using (
    public.is_restaurant_scout_bot() and agent_user_id = auth.uid()
  );

drop policy if exists "Sales staff can read agent runs" on public.agent_runs;
create policy "Sales staff can read agent runs"
  on public.agent_runs for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Scout can insert own runs" on public.agent_runs;
create policy "Scout can insert own runs"
  on public.agent_runs for insert
  to authenticated
  with check (
    public.is_bot_enabled()
    and agent_user_id = auth.uid()
    and status = 'running'
  );

drop policy if exists "Scout can finish own running runs" on public.agent_runs;
create policy "Scout can finish own running runs"
  on public.agent_runs for update
  to authenticated
  using (
    public.is_bot_enabled()
    and agent_user_id = auth.uid()
    and status = 'running'
  )
  with check (
    public.is_bot_enabled()
    and agent_user_id = auth.uid()
    and status in ('finished', 'failed', 'cancelled')
  );

drop policy if exists "Admins can manage agent runs" on public.agent_runs;
create policy "Admins can manage agent runs"
  on public.agent_runs for all
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

-- agent_audit_log
drop policy if exists "Scout can insert own audit rows" on public.agent_audit_log;
create policy "Scout can insert own audit rows"
  on public.agent_audit_log for insert
  to authenticated
  with check (
    public.is_restaurant_scout_bot()
    and agent_user_id = auth.uid()
  );

drop policy if exists "Scout can read own audit rows" on public.agent_audit_log;
create policy "Scout can read own audit rows"
  on public.agent_audit_log for select
  to authenticated
  using (
    public.is_restaurant_scout_bot() and agent_user_id = auth.uid()
  );

drop policy if exists "Sales staff can read agent audit log" on public.agent_audit_log;
create policy "Sales staff can read agent audit log"
  on public.agent_audit_log for select
  to authenticated
  using (public.is_sales_staff());

drop policy if exists "Admins can manage agent audit log" on public.agent_audit_log;
create policy "Admins can manage agent audit log"
  on public.agent_audit_log for all
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

-- agent_idempotency_keys
drop policy if exists "Scout can manage own idempotency keys" on public.agent_idempotency_keys;
create policy "Scout can manage own idempotency keys"
  on public.agent_idempotency_keys for all
  to authenticated
  using (
    public.is_restaurant_scout_bot() and agent_user_id = auth.uid()
  )
  with check (
    public.is_restaurant_scout_bot() and agent_user_id = auth.uid()
  );

drop policy if exists "Admins can read idempotency keys" on public.agent_idempotency_keys;
create policy "Admins can read idempotency keys"
  on public.agent_idempotency_keys for select
  to authenticated
  using (public.is_sales_admin());

-- ---------------------------------------------------------------------------
-- 8) Visit plan helper: set visit_status to_plan only for own scout lead
-- ---------------------------------------------------------------------------
create or replace function public.scout_plan_visit(p_restaurant_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_restaurant public.restaurants%rowtype;
  v_task_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_bot_enabled() then
    raise exception 'Bot disabled';
  end if;

  select * into v_restaurant
  from public.restaurants
  where id = p_restaurant_id
  for update;

  if not found then
    raise exception 'Restaurant not found';
  end if;

  if v_restaurant.created_by <> v_user_id or v_restaurant.created_by_agent is not true then
    raise exception 'Forbidden restaurant';
  end if;

  if v_restaurant.agent_run_id is null
     or not exists (
       select 1 from public.agent_runs ar
       where ar.id = v_restaurant.agent_run_id
         and ar.agent_user_id = v_user_id
         and ar.status = 'running'
     )
  then
    raise exception 'Restaurant not in active own run';
  end if;

  update public.restaurants
  set
    visit_status = 'to_plan',
    updated_at = now(),
    updated_by = v_user_id
  where id = p_restaurant_id;

  insert into public.tasks (
    restaurant_id,
    assigned_to,
    created_by,
    title,
    description,
    task_type,
    priority,
    status,
    due_at
  )
  values (
    p_restaurant_id,
    v_user_id,
    v_user_id,
    'Besuch planen',
    'Ungeplanter Scout-Lead — Termin noch festlegen.',
    'visit',
    'normal',
    'open',
    null
  )
  returning id into v_task_id;

  return jsonb_build_object(
    'restaurant_id', p_restaurant_id,
    'visit_status', 'to_plan',
    'task_id', v_task_id
  );
end;
$$;

revoke all on function public.scout_plan_visit(uuid) from public;
grant execute on function public.scout_plan_visit(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9) Prevent privilege escalation via profile self-update
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_sales_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Changing role is not allowed';
  end if;

  if new.bot_enabled is distinct from old.bot_enabled then
    raise exception 'Changing bot_enabled is not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();
