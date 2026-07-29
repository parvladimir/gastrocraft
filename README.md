# DINEVIO

Official company website for **DINEVIO**, a premium digital solutions partner for restaurants.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Installation

```bash
npm install
```

## Local Development

```bash
npm run dev
```

The development server starts at `http://localhost:3000` by default.

## Production Build

```bash
npm run build
npm run start
```

## Production Deployment

### Vercel

1. Push the repository to GitHub.
2. Import the GitHub repository into Vercel.
3. Use the `Next.js` framework preset.
4. Use the build command:

```bash
npm run build
```

5. Add the environment variable:

```bash
NEXT_PUBLIC_SITE_URL
```

6. Add the contact form environment variables:

```bash
RESEND_API_KEY
CONTACT_FORM_FROM_EMAIL
CONTACT_FORM_TO_EMAIL
```

7. Set `NEXT_PUBLIC_SITE_URL` to the final public URL.
8. Add `www.dinevio.de` as the production domain.
9. Add `dinevio.de` as an additional Vercel-managed domain.
10. Set the primary domain in Vercel.
11. Verify the Vercel-managed redirect direction in the project domain settings.
12. Add only the DNS records shown by Vercel for this exact project.
13. Redeploy after adding or changing a custom domain.
14. Verify:
   - `/sitemap.xml`
   - `/robots.txt`
   - `/manifest.webmanifest`
   - `/opengraph-image`
   - `/twitter-image`

The production domain is `https://www.dinevio.de`.

### Generic Node Hosting

The production server build requires a Node.js-capable hosting environment.

Requirements:

- Node.js 22 or newer
- npm 10 or newer

Deployment commands:

```bash
npm install
npm run build
npm run start
```

A normal PHP-only shared hosting package cannot run this Next.js server build
unless it explicitly supports Node.js applications.

## Contact Form Configuration

The contact form submits to the internal Next.js route:

```bash
/api/contact
```

Email delivery is prepared for Resend and configured with server-side
environment variables:

```bash
RESEND_API_KEY
RESEND_API_URL
CONTACT_FORM_FROM_EMAIL
CONTACT_FORM_TO_EMAIL
```

`CONTACT_FORM_TO_EMAIL` may contain one recipient or a comma-separated list of
recipients. `RESEND_API_URL` is optional and defaults to the Resend email API;
it is mainly useful for production smoke tests against a controlled mock
endpoint. Never place API secrets, private tokens, email passwords or server
credentials in `NEXT_PUBLIC_*` variables.

After deployment, submit a real test request through the production website and
verify both success and failure behavior before launch.

## Launch Checklist

- Deploy to Vercel.
- Configure `NEXT_PUBLIC_SITE_URL`.
- Configure `RESEND_API_KEY`.
- Configure `CONTACT_FORM_FROM_EMAIL`.
- Configure `CONTACT_FORM_TO_EMAIL`.
- Test the form success state.
- Test the form failure state.
- Test the missing Resend configuration state.
- Complete `Impressum` before public commercial launch.
- Complete `Datenschutz` with the actual hosting and form-processing services used.
- Do not invent legal details in code.
- Verify demo links.
- Verify phone and WhatsApp links.
- Test on a real iPhone and Android device.
- Verify `/robots.txt`.
- Verify `/sitemap.xml`.
- Verify the Open Graph image.
- Run Lighthouse.
- Connect the final custom domain.
- Set the primary production domain in Vercel.
- Add both `dinevio.de` and `www.dinevio.de`.
- Keep host redirects managed by Vercel, not by project code.
- Add only the DNS records shown by Vercel for this exact project.
- Redeploy after domain changes.

## Production Smoke Test

After each production deployment:

1. Open the final public URL in a private browser window.
2. Verify the header navigation anchors:
   `#solutions`, `#services`, `#references`, `#packages`, `#about`, `#contact`.
3. Submit one real contact form test with Resend environment variables configured.
4. Temporarily test a failing Resend configuration in a preview deployment and confirm the error state.
5. Test the missing Resend configuration state in a preview deployment.
6. Verify phone and WhatsApp links:
   `tel:+4917624229299`, `https://wa.me/380678400156`, `https://wa.me/380963354328`.
7. Verify the three external demo links open in a new tab.
8. Check `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image` and `/twitter-image`.
9. Run Lighthouse on desktop and mobile.
10. Re-test after connecting or changing the custom domain.
11. Confirm the Vercel-managed domain redirect works without a redirect loop.

## Sales Manager

The internal sales tool is available at:

```bash
/sales
```

It is hidden from the public website navigation and uses Supabase Auth plus
Supabase tables for shared Sales Manager data. `localStorage` is only used for
unsaved form drafts and one-time migration of older local test data.

The Supabase database foundation is documented in:

```bash
supabase/schema.sql
```

Required Supabase environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The application uses the anon key together with Supabase Auth, RLS policies and
private Storage signed URLs. Do not expose service role keys in browser code.

### Supabase Setup Guide

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Run all SQL files in `supabase/migrations` in filename order for the CRM
   extensions:
   - restaurant coordinates
   - restaurant photos
   - private Storage policies
   - tasks
   - message templates
   - extended offers
   - sales settings
   - statistics views
5. Create two users in Authentication for Andrii and Volodymyr.
6. Copy their Auth user IDs.
7. Insert matching profiles:

```sql
insert into public.profiles (id, name, email, role)
values
  ('AUTH_USER_ID_ANDRII', 'Andrii', 'AUTH_EMAIL_ANDRII', 'admin'),
  ('AUTH_USER_ID_VOLODYMYR', 'Volodymyr', 'AUTH_EMAIL_VOLODYMYR', 'sales');
```

Replace the placeholders with the real Supabase Auth values.
Do not write passwords or real private keys into this repository.

8. Add `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
9. Start the project and open `/sales/login`.
10. Test login, restaurant creation, editing, archive, tasks, tours and offers.
11. Test the second user in another browser or an incognito window.

If older local test data exists, the app shows `Lokale Daten gefunden` after
login. Use `Jetzt übertragen` to import restaurants, history, tours and offers
into Supabase. The old local copy is not deleted automatically; it can be
removed in `Mehr` after checking the import.

### CRM Extensions

The Sales Manager now includes the following Supabase-backed CRM modules:

- restaurant coordinates (`latitude`, `longitude`, `google_maps_url`, `google_place_id`)
- private restaurant photos in the `restaurant-photos` Storage bucket
- photo metadata in `restaurant_photos`
- task management in `tasks`
- editable message templates in `message_templates`
- extended commercial offers in `offers`
- generated offer PDFs in the private `offers` Storage bucket
- sales settings in `sales_settings`
- statistics and conversion views
- protected `/sales/pipeline` and `/sales/statistik` routes

Manual Supabase checks before production use:

1. Confirm RLS is enabled on all Sales Manager tables.
2. Confirm `restaurant-photos` and `offers` buckets are private.
3. Confirm authenticated users can upload and read files through signed URLs.
4. Confirm anon users cannot read tables or Storage objects.
5. Confirm the offer number function generates unique values.

Photo test:

1. Log in on a mobile device.
2. Open a restaurant card.
3. Upload or capture a facade photo.
4. Confirm the photo appears in the `Fotos` section.
5. Confirm a `Foto hochgeladen` event appears in `Kontaktverlauf`.

PDF test:

1. Open a restaurant card.
2. Create or edit an `Angebot`.
3. Click `PDF erstellen`.
4. Confirm the PDF path is saved in Supabase.
5. Open and download the PDF through the signed link.
6. Confirm a history entry was created.

Tasks test:

1. Finish a visit and set a next contact date.
2. Confirm a task appears on the Dashboard and in `Aufgaben`.
3. Confirm overdue tasks are highlighted.

Two-user test:

1. Log in as Volodymyr in one browser.
2. Log in as Andrii in another browser or incognito window.
3. Create a restaurant as one user.
4. Refresh or wait for realtime sync in the other session.
5. Change the status in `/sales/pipeline`.
6. Confirm the timeline shows the correct user.

### Restaurant Lookup

The create/edit restaurant form can prefill restaurant data from a Google Maps
link or restaurant name.

Set the server-only environment variable:

```bash
GOOGLE_PLACES_API_KEY=
```

The key must never be exposed as a `NEXT_PUBLIC` variable. When Google Places is
not configured or unavailable, the lookup route falls back to
OpenStreetMap/Nominatim for basic address data. Nominatim is only a reserve for
manual lookups and must not be used for bulk scraping.

The lookup stores editable fields such as address, phone, website, Google Maps
URL, coordinates, opening hours, rating, review count, photo URLs and social
links when they are available. If a restaurant website is found, the server does
a lightweight homepage scan for e-mail, Instagram, Facebook, TikTok and basic
digital presence signals.

## Reference Screenshots

The `Referenzen` section uses local static screenshots when the following files
exist:

- `public/images/references/restaurant-demo-desktop.webp`
- `public/images/references/restaurant-demo-mobile.webp`
- `public/images/references/rhodos-grill-desktop.webp`
- `public/images/references/rhodos-grill-mobile.webp`
- `public/images/references/schlemmerhus-desktop.webp`
- `public/images/references/schlemmerhus-mobile.webp`

Recommended dimensions:

- Desktop: around `1600 x 1000` in WebP format
- Mobile: around `430 x 900` in WebP format

Optimize screenshots before committing them. Do not include browser chrome inside
the screenshot because the website adds its own browser and phone frames.

If one of the desktop screenshot assets is unavailable, the section falls back to
the built-in CSS preview so the build and layout remain stable.

## Project Conventions

- The project uses Next.js with the App Router, TypeScript, Tailwind CSS and ESLint.
- Source code, file names, component names, variables and comments are written in English.
- Visible website content is written in German.
- Brand typography is configured with `next/font`: Manrope for headings and Inter for body text.
- Global brand tokens live in `app/globals.css`.
- Reusable layout primitives live in `components/layout`.
- Reusable UI primitives live in `components/ui`.
- Page sections live in `components/sections`.
- Shared non-UI helpers live in `lib`.
- Static brand assets belong in `public/brand`.
- Static image assets belong in `public/images`.
- Static structured content belongs in `data`.
