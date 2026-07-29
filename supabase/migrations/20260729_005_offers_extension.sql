-- Extended commercial offers and safe offer number generation.

create sequence if not exists public.offer_number_seq;

create or replace function public.generate_offer_number()
returns text
language plpgsql
as $$
declare
  next_number bigint;
begin
  next_number := nextval('public.offer_number_seq');
  return 'DV-' || to_char(now(), 'YYYY') || '-' || lpad(next_number::text, 4, '0');
end;
$$;

alter table public.offers
  add column if not exists offer_number text,
  add column if not exists contact_person text,
  add column if not exists package_id text,
  add column if not exists discount_amount numeric,
  add column if not exists discount_percent numeric,
  add column if not exists vat_rate numeric,
  add column if not exists intro_text text,
  add column if not exists included_services jsonb not null default '[]'::jsonb,
  add column if not exists additional_services jsonb not null default '[]'::jsonb,
  add column if not exists payment_terms text,
  add column if not exists notes text,
  add column if not exists sent_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists pdf_storage_path text;

alter table public.offers
  alter column status set default 'draft';

update public.offers
set status = lower(status)
where status in ('Entwurf', 'Gesendet', 'Angenommen', 'Abgelehnt');

update public.offers set status = 'draft' where status = 'entwurf';
update public.offers set status = 'sent' where status = 'gesendet';
update public.offers set status = 'accepted' where status = 'angenommen';
update public.offers set status = 'rejected' where status = 'abgelehnt';

alter table public.offers
  drop constraint if exists offers_status_check;

alter table public.offers
  add constraint offers_status_check
  check (status in ('draft', 'generated', 'sent', 'accepted', 'rejected', 'expired'));

update public.offers
set offer_number = public.generate_offer_number()
where offer_number is null;

create unique index if not exists offers_offer_number_idx on public.offers (offer_number);
create index if not exists offers_status_idx on public.offers (status);
create index if not exists offers_valid_until_idx on public.offers (valid_until);

insert into storage.buckets (id, name, public)
values ('offers', 'offers', false)
on conflict (id) do nothing;
