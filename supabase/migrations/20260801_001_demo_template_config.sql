-- Shared restaurant demo template snapshot configuration.

alter table public.demo_pages
  add column if not exists template_config jsonb not null default '{}'::jsonb,
  add column if not exists menu_config jsonb not null default '{}'::jsonb,
  add column if not exists menu_items jsonb not null default '[]'::jsonb,
  add column if not exists gallery_config jsonb not null default '{}'::jsonb,
  add column if not exists legal_config jsonb not null default '{}'::jsonb,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists reviews_config jsonb not null default '{}'::jsonb,
  add column if not exists special_offer jsonb not null default '{}'::jsonb,
  add column if not exists seo_config jsonb not null default '{}'::jsonb;

update public.demo_pages
set
  template_key = case
    when template_key in ('premium-dark', 'cocktail-neon', 'imbiss-pro', 'cafe-minimal', 'german-gasthaus') then template_key
    when template_key = 'schnellundlecker' then 'imbiss-pro'
    when template_key in ('rhodosgrill', 'schlemmerhus') then 'german-gasthaus'
    when template in ('premium-dark', 'cocktail-neon', 'imbiss-pro', 'cafe-minimal', 'german-gasthaus') then template
    when template = 'schnellundlecker' then 'imbiss-pro'
    else coalesce(nullif(template_key, ''), 'german-gasthaus')
  end,
  template_config = coalesce(nullif(template_config, '{}'::jsonb), jsonb_build_object(
    'theme', case
      when template_key = 'schnellundlecker' then 'imbiss-pro'
      when template_key in ('rhodosgrill', 'schlemmerhus') then 'german-gasthaus'
      else coalesce(nullif(template_key, ''), 'german-gasthaus')
    end,
    'slogan', coalesce(content->>'slogan', content->>'subtitle', ''),
    'cuisineType', coalesce(category, content->>'category', '')
  )),
  social_links = coalesce(nullif(social_links, '{}'::jsonb), jsonb_build_object(
    'instagram', coalesce(instagram, content->>'instagram', ''),
    'facebook', coalesce(content->>'facebook', ''),
    'tiktok', coalesce(content->>'tiktok', '')
  )),
  seo_config = coalesce(nullif(seo_config, '{}'::jsonb), jsonb_build_object(
    'title', concat(coalesce(restaurant_name, content->>'name', 'Restaurant'), ' | DINEVIO Demo'),
    'description', coalesce(content->>'subtitle', 'Unverbindliche Design-Demo für einen modernen Restaurant-Webauftritt.')
  ))
where status <> 'archived';

create index if not exists demo_pages_template_key_idx on public.demo_pages (template_key);
create index if not exists demo_pages_published_slug_idx on public.demo_pages (slug) where status = 'published';

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
