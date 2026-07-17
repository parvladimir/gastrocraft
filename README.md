# GastroCraft

Official company website for **GastroCraft**, a premium digital solutions partner for restaurants.

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
2. Import `parvladimir/gastrocraft` into Vercel.
3. Use the `Next.js` framework preset.
4. Use the build command:

```bash
npm run build
```

5. Add the environment variable:

```bash
NEXT_PUBLIC_SITE_URL
```

6. Set `NEXT_PUBLIC_SITE_URL` to the final public URL.
7. Redeploy after adding or changing a custom domain.
8. Verify:
   - `/sitemap.xml`
   - `/robots.txt`
   - `/manifest.webmanifest`
   - `/opengraph-image`
   - `/twitter-image`

Do not configure a production domain in the repository until the final public
domain has been confirmed.

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
