-- Extended immutable contact/action timeline.

alter table public.contact_history
  add column if not exists channel text,
  add column if not exists direction text
    check (direction in ('incoming', 'outgoing', 'internal')),
  add column if not exists title text,
  add column if not exists message_template_id uuid references public.message_templates (id),
  add column if not exists message_text text,
  add column if not exists offer_id uuid references public.offers (id),
  add column if not exists task_id uuid references public.tasks (id),
  add column if not exists contact_person text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists contact_history_restaurant_idx
  on public.contact_history (restaurant_id, created_at desc);

create index if not exists contact_history_contact_at_idx
  on public.contact_history (contact_at);

create index if not exists contact_history_action_type_idx
  on public.contact_history (action_type);

drop policy if exists "Authenticated users can update contact history" on public.contact_history;

drop policy if exists "Admins can append corrective history only by insert" on public.contact_history;
create policy "Admins can append corrective history only by insert"
  on public.contact_history for update
  to authenticated
  using (false)
  with check (false);
