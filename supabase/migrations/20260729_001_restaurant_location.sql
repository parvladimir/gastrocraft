-- Restaurant coordinates and location metadata.

alter table public.restaurants
  add column if not exists google_place_id text,
  add column if not exists location_accuracy text,
  add column if not exists location_updated_at timestamptz,
  add column if not exists rejection_reason text;

alter table public.restaurants
  alter column latitude type double precision using nullif(latitude::text, '')::double precision,
  alter column longitude type double precision using nullif(longitude::text, '')::double precision;

create index if not exists restaurants_city_idx on public.restaurants (city);
create index if not exists restaurants_google_place_id_idx on public.restaurants (google_place_id);
create index if not exists restaurants_latitude_longitude_idx on public.restaurants (latitude, longitude);
create index if not exists restaurants_status_idx on public.restaurants (status);
create index if not exists restaurants_responsible_user_id_idx on public.restaurants (responsible_user_id);
