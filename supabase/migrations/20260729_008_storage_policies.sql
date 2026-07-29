-- Private Storage access for restaurant photos and offer PDFs.

create policy "Authenticated users can read restaurant photo files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'restaurant-photos');

create policy "Authenticated users can upload restaurant photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'restaurant-photos');

create policy "Authenticated users can update restaurant photo files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'restaurant-photos')
  with check (bucket_id = 'restaurant-photos');

create policy "Admins can delete restaurant photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'restaurant-photos' and public.is_sales_admin());

create policy "Authenticated users can read offer files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'offers');

create policy "Authenticated users can upload offer files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'offers');

create policy "Authenticated users can update offer files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'offers')
  with check (bucket_id = 'offers');

create policy "Admins can delete offer files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'offers' and public.is_sales_admin());
