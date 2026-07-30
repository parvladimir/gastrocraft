-- Editable CRM message templates.

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('whatsapp', 'email', 'sms', 'internal')),
  category text check (
    category in (
      'first_contact',
      'after_visit',
      'demo',
      'reminder',
      'offer',
      'follow_up',
      'appointment',
      'rejection',
      'custom'
    )
  ),
  subject text,
  body text not null,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists message_templates_channel_idx on public.message_templates (channel);
create index if not exists message_templates_category_idx on public.message_templates (category);
create index if not exists message_templates_active_idx on public.message_templates (is_active);

alter table public.message_templates enable row level security;

drop policy if exists "Authenticated users can read message templates" on public.message_templates;
create policy "Authenticated users can read message templates"
  on public.message_templates for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Admins can create message templates" on public.message_templates;
create policy "Admins can create message templates"
  on public.message_templates for insert
  to authenticated
  with check (public.is_sales_admin());

drop policy if exists "Admins can update message templates" on public.message_templates;
create policy "Admins can update message templates"
  on public.message_templates for update
  to authenticated
  using (public.is_sales_admin())
  with check (public.is_sales_admin());

drop policy if exists "Admins can delete message templates" on public.message_templates;
create policy "Admins can delete message templates"
  on public.message_templates for delete
  to authenticated
  using (public.is_sales_admin());

insert into public.message_templates (name, channel, category, subject, body)
values
  (
    'Nach erstem Besuch',
    'whatsapp',
    'after_visit',
    null,
    'Hallo {{contact_person}},

vielen Dank für das freundliche Gespräch.

Wie besprochen, finden Sie hier eine Live-Demo:
{{demo_link}}

Weitere Informationen finden Sie unter:
{{dinevio_website}}

Viele Grüße
{{user_name}}
DINEVIO'
  ),
  (
    'Demo senden',
    'whatsapp',
    'demo',
    null,
    'Hallo {{contact_person}},

hier ist die passende Demo für {{restaurant_name}}:
{{demo_link}}

Viele Grüße
{{user_name}}'
  ),
  (
    'Erinnerung',
    'whatsapp',
    'reminder',
    null,
    'Hallo {{contact_person}},

ich wollte mich kurz bezüglich unseres Gesprächs melden.

Hier ist der Link zur Demo:
{{demo_link}}

Viele Grüße
{{user_name}}'
  ),
  (
    'Angebot senden',
    'whatsapp',
    'offer',
    null,
    'Hallo {{contact_person}},

wie besprochen, finden Sie hier unser Angebot {{offer_number}}:
{{offer_link}}

Viele Grüße
{{user_name}}
DINEVIO'
  ),
  (
    'Follow-up',
    'whatsapp',
    'follow_up',
    null,
    'Hallo {{contact_person}},

ich wollte kurz nachfragen, ob Sie bereits Gelegenheit hatten, sich alles anzusehen.

Viele Grüße
{{user_name}}'
  ),
  (
    'Termin bestätigen',
    'whatsapp',
    'appointment',
    null,
    'Hallo {{contact_person}},

ich bestätige kurz unseren nächsten Kontakt am {{next_contact_date}}.

Viele Grüße
{{user_name}}'
  )
on conflict do nothing;
