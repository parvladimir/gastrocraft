-- Six leads per rolling 24 hours: at most three without a sourced public email.
-- Pause all bot-created leads at 50 until the owner authorizes a later migration.
-- The bot still has no direct CRM table writes or privileged credentials.

begin;

create or replace function public.scout_start_run(
  p_city text default null,
  p_region text default null,
  p_notes text default null,
  p_max_leads integer default 6
)
returns public.agent_runs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_run public.agent_runs;
  v_total integer;
begin
  if v_user_id is null or not public.is_bot_enabled() then
    raise exception 'Scout not enabled';
  end if;
  if p_max_leads is null or p_max_leads < 1 or p_max_leads > 6
     or length(coalesce(p_city, '')) > 200
     or length(coalesce(p_region, '')) > 200
     or length(coalesce(p_notes, '')) > 1000 then
    raise exception 'Invalid run input';
  end if;

  perform 1 from public.profiles where id = v_user_id for update;
  perform pg_advisory_xact_lock(20260915, 1);
  select count(*) into v_total from public.restaurants where created_by_agent = true;
  if v_total >= 50 then
    raise exception 'Scout paused at 50 total leads; owner approval required';
  end if;
  if (select count(*) from public.agent_runs
      where agent_user_id = v_user_id
        and started_at >= now() - interval '24 hours') >= 20 then
    raise exception 'Daily run limit exceeded';
  end if;

  insert into public.agent_runs (agent_user_id, city, region, notes, max_leads)
  values (v_user_id, p_city, p_region, p_notes, least(p_max_leads, 50 - v_total))
  returning * into v_run;
  insert into public.agent_audit_log
    (agent_user_id, agent_run_id, action, resource_type, resource_id)
  values (v_user_id, v_run.id, 'run.start', 'agent_run', v_run.id);
  return v_run;
end;
$$;

revoke all on function public.scout_start_run(text, text, text, integer) from public;
grant execute on function public.scout_start_run(text, text, text, integer) to authenticated;

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
  v_idempotency_key text := nullif(trim(coalesce(p_lead->>'_idempotency_key', '')), '');
  v_request_hash text := nullif(trim(coalesce(p_lead->>'_request_hash', '')), '');
  v_existing_key public.agent_idempotency_keys%rowtype;
  v_email text := lower(nullif(trim(coalesce(p_lead->>'email', '')), ''));
  v_email_source_url text := nullif(trim(coalesce(p_lead->>'email_source_url', '')), '');
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

  -- Serialize the rolling daily cap across all runs of this scout.
  perform 1 from public.profiles where id = v_user_id for update;
  perform pg_advisory_xact_lock(20260915, 1);
  if v_idempotency_key is not null then
    if length(v_idempotency_key) > 200 or v_request_hash is null
       or v_request_hash !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid idempotency data';
    end if;
    select * into v_existing_key from public.agent_idempotency_keys
    where agent_user_id = v_user_id and idempotency_key = v_idempotency_key;
    if found then
      if v_existing_key.request_hash is distinct from v_request_hash then
        raise exception 'Idempotency-Key conflict';
      end if;
      select * into v_restaurant from public.restaurants
      where id = (v_existing_key.response_body->'lead'->>'id')::uuid
        and created_by = v_user_id;
      if not found then
        raise exception 'Idempotent lead not found';
      end if;
      return v_restaurant;
    end if;
  end if;
  if (select count(*) from public.restaurants where created_by_agent = true) >= 50 then
    raise exception 'Scout paused at 50 total leads; owner approval required';
  end if;
  if (select count(*) from public.restaurants
      where created_by_agent = true
        and created_at >= now() - interval '24 hours') >= 6 then
    raise exception 'Daily lead limit exceeded';
  end if;
  if v_email is null and (select count(*) from public.restaurants
      where created_by_agent = true
        and email is null
        and created_at >= now() - interval '24 hours') >= 3 then
    raise exception 'Email lead slots reserved';
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

  if length(v_name) > 200 or pg_column_size(p_lead) > 12000 then
    raise exception 'Lead input too large';
  end if;

  v_score := coalesce((p_lead->>'lead_score')::integer, 0);
  if v_score < 0 or v_score > 100 then
    raise exception 'lead_score out of range';
  end if;

  v_website := nullif(trim(coalesce(p_lead->>'website', '')), '');
  if v_website is not null or p_lead->>'website_status' is distinct from 'missing' then
    raise exception 'Scout leads must have no own website';
  end if;

  v_source_url := nullif(trim(coalesce(p_lead->>'source_url', '')), '');
  if v_source_url is null or v_source_url !~* '^https?://' then
    raise exception 'Verifiable http(s) source_url required';
  end if;
  if length(v_source_url) > 2048
     or v_source_url !~* '^https?://[^ /]+'
     or (p_lead->>'google_maps_url' is not null
         and p_lead->>'google_maps_url' <> ''
         and p_lead->>'google_maps_url' !~* '^https?://[^ /]+') then
    raise exception 'Invalid source URL';
  end if;
  if v_email is not null and (
      v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      or v_email_source_url is null
      or length(v_email_source_url) > 2048
      or v_email_source_url !~* '^https?://[^ /]+'
     ) then
    raise exception 'Verified public email source URL required';
  end if;
  if length(trim(coalesce(p_lead->>'selection_reason', ''))) < 10 then
    raise exception 'Selection reason required';
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
    v_email,
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

  if v_email is not null then
    update public.restaurant_outreach
    set email_source_url = v_email_source_url, updated_at = now()
    where restaurant_id = v_restaurant.id and status = 'draft';
    if not found then
      raise exception 'Email outreach draft missing';
    end if;
  end if;

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

  if v_idempotency_key is not null then
    insert into public.agent_idempotency_keys
      (agent_user_id, idempotency_key, request_path, request_hash, response_status, response_body)
    values (
      v_user_id, v_idempotency_key, '/api/agent/restaurant-scout/lead',
      v_request_hash, 201,
      jsonb_build_object('lead', jsonb_build_object(
        'agent_run_id', v_restaurant.agent_run_id,
        'city', v_restaurant.city,
        'created_by_agent', v_restaurant.created_by_agent,
        'id', v_restaurant.id,
        'lead_score', v_restaurant.lead_score,
        'lead_status', v_restaurant.lead_status,
        'name', v_restaurant.name,
        'source_type', v_restaurant.source_type,
        'visit_status', v_restaurant.visit_status,
        'website', v_restaurant.website
      ))
    );
  end if;
  insert into public.agent_audit_log
    (agent_user_id, agent_run_id, action, resource_type, resource_id, details)
  values (v_user_id, p_run_id, 'lead.create', 'restaurant', v_restaurant.id,
          jsonb_build_object('name', v_restaurant.name, 'city', v_restaurant.city,
                             'lead_score', v_restaurant.lead_score));

  return v_restaurant;
end;
$$;

revoke all on function public.create_scout_lead(uuid, jsonb) from public;
grant execute on function public.create_scout_lead(uuid, jsonb) to authenticated;

commit;
