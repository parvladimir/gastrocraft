-- One outreach record per restaurant. Public email discovery alone never authorizes mail.
create table if not exists public.restaurant_outreach (
  restaurant_id uuid primary key references public.restaurants(id),
  recipient_email text not null,
  email_source_url text,
  status text not null default 'draft' check (status in ('draft','sending','sent','replied','wants_demo','opted_out','failed','send_uncertain')),
  consent_evidence text,
  consent_recorded_at timestamptz,
  consent_recorded_by uuid references public.profiles(id),
  send_key uuid not null default gen_random_uuid(),
  provider_email_id text unique,
  sent_at timestamptz,
  replied_at timestamptz,
  wants_demo_at timestamptz,
  reply_excerpt text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outreach_email_valid check (recipient_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint outreach_consent_evidence_check check (consent_evidence is null or length(trim(consent_evidence)) >= 20)
);
create index if not exists restaurant_outreach_status_idx on public.restaurant_outreach(status, updated_at desc);
create index if not exists restaurant_outreach_email_idx on public.restaurant_outreach(lower(recipient_email));

-- The trigger creates a non-sendable draft; it never confers consent.
create or replace function public.create_restaurant_outreach_draft()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is not null and length(trim(new.email)) > 3 and
     new.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    insert into public.restaurant_outreach(restaurant_id, recipient_email, email_source_url)
    values (new.id, lower(trim(new.email)), null)
    on conflict (restaurant_id) do update
      set recipient_email = excluded.recipient_email,
          email_source_url = excluded.email_source_url,
          updated_at = now()
      where public.restaurant_outreach.status = 'draft'
        and public.restaurant_outreach.recipient_email is distinct from excluded.recipient_email;
  end if;
  return new;
end;
$$;
revoke all on function public.create_restaurant_outreach_draft() from public;
drop trigger if exists restaurants_outreach_draft on public.restaurants;
create trigger restaurants_outreach_draft after insert or update of email on public.restaurants
for each row execute function public.create_restaurant_outreach_draft();
insert into public.restaurant_outreach(restaurant_id, recipient_email, email_source_url)
select id, lower(trim(email)), null from public.restaurants
where email is not null and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
on conflict (restaurant_id) do nothing;

alter table public.restaurant_outreach enable row level security;
revoke all on public.restaurant_outreach from anon, authenticated;
grant select on public.restaurant_outreach to authenticated;
create policy "Sales staff can read outreach" on public.restaurant_outreach
for select to authenticated using (public.is_sales_staff());
-- No table writes for browser users or the scout. An admin may reserve a send only
-- after documenting explicit prior consent, using the narrow RPC below.
create or replace function public.reserve_restaurant_outreach_send(
  p_restaurant_id uuid, p_consent_evidence text
) returns public.restaurant_outreach
language plpgsql security definer set search_path = public as $$
declare v_row public.restaurant_outreach;
begin
  if not public.is_sales_admin() then raise exception 'Admin required'; end if;
  if length(trim(coalesce(p_consent_evidence,''))) < 20 then
    raise exception 'Document prior express consent with source, date and scope';
  end if;
  update public.restaurant_outreach o
  set status = 'sending', consent_evidence = trim(p_consent_evidence),
      consent_recorded_at = now(), consent_recorded_by = auth.uid(), updated_at = now()
  from public.restaurants r
  where o.restaurant_id = p_restaurant_id and r.id = o.restaurant_id
    and o.status = 'draft' and o.sent_at is null and r.archived = false
    and lower(trim(r.email)) = o.recipient_email
    and not exists (select 1 from public.restaurant_outreach other
      where other.restaurant_id <> o.restaurant_id
        and other.recipient_email = o.recipient_email
        and other.status in ('sending','sent','replied','wants_demo','opted_out','send_uncertain'))
  returning o.* into v_row;
  if v_row.restaurant_id is null then raise exception 'Outreach is not sendable'; end if;
  return v_row;
end;
$$;
revoke all on function public.reserve_restaurant_outreach_send(uuid,text) from public;
grant execute on function public.reserve_restaurant_outreach_send(uuid,text) to authenticated;

create table if not exists public.outreach_inbound_events (
  provider_email_id text primary key,
  restaurant_id uuid not null references public.restaurants(id),
  received_at timestamptz not null default now(),
  notification_sent_at timestamptz
);
alter table public.outreach_inbound_events enable row level security;
revoke all on public.outreach_inbound_events from anon, authenticated;

-- Atomic and idempotent inbound recording. Only the server-side service role can invoke it.
create or replace function public.record_restaurant_outreach_reply(
  p_restaurant_id uuid, p_provider_email_id text, p_status text,
  p_excerpt text, p_subject text
) returns boolean language plpgsql security definer set search_path = public as $$
declare v_inserted text;
begin
  if p_status not in ('replied','wants_demo','opted_out') or
     length(coalesce(p_provider_email_id,'')) > 200 or
     length(coalesce(p_excerpt,'')) > 1000 then
    raise exception 'Invalid reply';
  end if;
  insert into public.outreach_inbound_events(provider_email_id, restaurant_id)
  values (p_provider_email_id, p_restaurant_id)
  on conflict do nothing returning provider_email_id into v_inserted;
  if v_inserted is null then return false; end if;
  update public.restaurant_outreach o set
    status = case when o.status = 'opted_out' then 'opted_out' else p_status end,
    replied_at = coalesce(o.replied_at, now()),
    wants_demo_at = case when p_status = 'wants_demo' then coalesce(o.wants_demo_at, now()) else o.wants_demo_at end,
    reply_excerpt = p_excerpt, updated_at = now()
  where o.restaurant_id = p_restaurant_id and o.sent_at is not null
    and o.status in ('sent','replied','wants_demo','opted_out');
  if not found then raise exception 'Sent outreach not found'; end if;
  insert into public.contact_history
    (restaurant_id, action_type, channel, direction, contact_at, title, message_text, note, metadata)
  values (p_restaurant_id, 'Status geändert', 'email', 'incoming', now(),
    left(coalesce(p_subject,'Antwort auf DINEVIO Angebot'), 300), p_excerpt,
    case when p_status='wants_demo' then 'Kunde möchte ein Demo'
         when p_status='opted_out' then 'Keine weiteren E-Mails'
         else 'Antwort erhalten' end,
    jsonb_build_object('provider_email_id', p_provider_email_id, 'outreach', true));
  return true;
end;
$$;
revoke all on function public.record_restaurant_outreach_reply(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.record_restaurant_outreach_reply(uuid,text,text,text,text) to service_role;
