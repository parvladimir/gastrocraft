-- Aggregated sales statistics and conversion helpers.

create or replace view public.sales_statistics_summary as
select
  count(*)::integer as restaurants_total,
  count(*) filter (where created_at >= date_trunc('month', now()))::integer as restaurants_new_this_month,
  count(*) filter (where status = 'Besuch geplant')::integer as visits_planned,
  count(*) filter (where status in ('Besucht', 'Interessiert', 'Demo gesendet', 'Angebot gesendet', 'Kunde gewonnen'))::integer as visits_completed,
  count(*) filter (where status = 'Nicht erreicht')::integer as not_reached,
  count(*) filter (where status = 'Interessiert')::integer as interested,
  count(*) filter (where status = 'Demo gesendet')::integer as demos_sent,
  count(*) filter (where status = 'Angebot gesendet')::integer as offers_sent,
  count(*) filter (where status = 'Kunde gewonnen')::integer as customers_won,
  count(*) filter (where status = 'Abgelehnt')::integer as rejected
from public.restaurants
where archived = false;

create or replace view public.sales_conversion_funnel as
select
  count(*) filter (where status is not null)::integer as new_restaurants,
  count(*) filter (where status in ('Besucht', 'Interessiert', 'Demo gesendet', 'Angebot gesendet', 'Kunde gewonnen'))::integer as visited,
  count(*) filter (where status in ('Interessiert', 'Demo gesendet', 'Angebot gesendet', 'Kunde gewonnen'))::integer as interested,
  count(*) filter (where status in ('Angebot gesendet', 'Kunde gewonnen'))::integer as offer_sent,
  count(*) filter (where status = 'Kunde gewonnen')::integer as won
from public.restaurants
where archived = false;

create or replace view public.rejection_reason_summary as
select
  coalesce(rejection_reason, 'Sonstiges') as rejection_reason,
  count(*)::integer as total
from public.restaurants
where status = 'Abgelehnt'
group by coalesce(rejection_reason, 'Sonstiges')
order by total desc
limit 5;

grant select on public.sales_statistics_summary to authenticated;
grant select on public.sales_conversion_funnel to authenticated;
grant select on public.rejection_reason_summary to authenticated;
