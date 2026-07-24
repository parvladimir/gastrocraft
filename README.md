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
8. Add `dinevio.de` as the production domain.
9. Add `www.dinevio.de` as an additional domain.
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

The production domain is `https://dinevio.de`.

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
