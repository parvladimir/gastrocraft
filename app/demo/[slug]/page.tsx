import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties } from "react";
import { getSupabaseConfig } from "@/lib/supabase/config";

type DemoPageData = {
  accent: string;
  address: string;
  category: string;
  city: string;
  email: string;
  galleryPhotos: string[];
  googleMapsUrl: string;
  heroPhoto: string;
  instagram: string;
  logoPhoto: string;
  name: string;
  openingHours: string[];
  phone: string;
  subtitle: string;
  templateKey: string;
  website: string;
};

type DemoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getDemoPage(slug);

  if (!page) {
    return {
      title: "Demo nicht gefunden"
    };
  }

  return {
    description: page.subtitle,
    robots: {
      follow: false,
      index: false
    },
    title: `${page.name} | DINEVIO Demo`
  };
}

export default async function RestaurantDemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  const page = await getDemoPage(slug);

  if (!page) {
    notFound();
  }

  const mapsHref = page.googleMapsUrl || (page.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.address)}` : "");

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#fafaf8]" style={{ "--demo-accent": page.accent } as CSSProperties}>
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold tracking-[0.12em]">{page.name}</p>
            {page.category ? <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--demo-accent)]">{page.category}</p> : null}
          </div>
          {page.phone ? (
            <a className="hidden min-h-11 items-center rounded border border-[var(--demo-accent)] px-4 text-sm font-semibold text-[var(--demo-accent)] sm:inline-flex" href={`tel:${page.phone}`}>
              Anrufen
            </a>
          ) : null}
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:min-h-[calc(100vh-88px)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-16">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.24em] text-[var(--demo-accent)]">
            Persönliche Restaurant-Demo
          </p>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold leading-tight sm:text-6xl">
            {page.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            {page.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {page.phone ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded bg-[var(--demo-accent)] px-5 font-semibold text-[#0f172a]" href={`tel:${page.phone}`}>
                Jetzt anrufen
              </a>
            ) : null}
            {mapsHref ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border border-[var(--demo-accent)] px-5 font-semibold text-[var(--demo-accent)]"
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Route öffnen
              </a>
            ) : null}
            {page.website ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border border-white/20 px-5 font-semibold text-[#fafaf8]"
                href={page.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website öffnen
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#101a2c] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          {page.heroPhoto ? (
            <div
              aria-label={`Restaurantfoto von ${page.name}`}
              className="aspect-[4/3] w-full rounded-lg bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${page.heroPhoto}")` }}
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-lg border border-[var(--demo-accent)]/35 bg-[#0f172a] text-center">
              <div className="px-6">
                <p className="font-heading text-3xl font-semibold text-[var(--demo-accent)]">{page.name}</p>
                <p className="mt-3 text-slate-400">Moderner digitaler Auftritt für Ihr Restaurant</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#101a2c] px-5 py-14 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <DemoInfoCard title="Mobil optimiert" text="Alle wichtigen Informationen sind auf dem Smartphone schnell erreichbar." />
          <DemoInfoCard title="Direkter Kontakt" text="Anruf, Route und Kontakt funktionieren ohne unnötige Umwege." />
          <DemoInfoCard title="Individuell anpassbar" text="Design, Inhalte und Funktionen können an Ihr Restaurant angepasst werden." />
        </div>
      </section>

      {(page.openingHours.length > 0 || page.address || page.phone || page.email || page.instagram) ? (
        <section className="px-5 py-14 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-2">
            {page.openingHours.length > 0 ? (
              <div className="rounded-lg border border-white/10 bg-[#101a2c] p-6">
                <h2 className="font-heading text-2xl font-semibold">Öffnungszeiten</h2>
                <ul className="mt-5 grid gap-3 text-slate-300">
                  {page.openingHours.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(page.address || page.phone || page.email || page.instagram) ? (
              <div className="rounded-lg border border-white/10 bg-[#101a2c] p-6">
                <h2 className="font-heading text-2xl font-semibold">Kontakt</h2>
                <div className="mt-5 grid gap-3 text-slate-300">
                  {page.address ? <p>{page.address}</p> : null}
                  {page.phone ? <a className="text-[var(--demo-accent)]" href={`tel:${page.phone}`}>{page.phone}</a> : null}
                  {page.email ? <a className="text-[var(--demo-accent)]" href={`mailto:${page.email}`}>{page.email}</a> : null}
                  {page.instagram ? (
                    <a className="text-[var(--demo-accent)]" href={page.instagram} target="_blank" rel="noopener noreferrer">
                      Instagram öffnen
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {page.galleryPhotos.length > 0 ? (
        <section className="bg-[#101a2c] px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-heading text-2xl font-semibold">Galerie</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {page.galleryPhotos.map((photo) => (
                <div
                  key={photo}
                  aria-label={`Galeriefoto von ${page.name}`}
                  className="aspect-[4/3] rounded-lg bg-cover bg-center"
                  role="img"
                  style={{ backgroundImage: `url("${photo}")` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {mapsHref ? (
        <section className="px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-7xl rounded-lg border border-white/10 bg-[#101a2c] p-6">
            <h2 className="font-heading text-2xl font-semibold">Standort</h2>
            {page.address ? <p className="mt-3 text-slate-300">{page.address}</p> : null}
            <a
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded bg-[var(--demo-accent)] px-5 font-semibold text-[#0f172a]"
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              In Google Maps öffnen
            </a>
          </div>
        </section>
      ) : null}

      <footer className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>Demo erstellt von DINEVIO.</p>
          <p>Restaurant Digital Solutions</p>
        </div>
      </footer>
    </main>
  );
}

function DemoInfoCard({ text, title }: { text: string; title: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0f172a] p-5">
      <h2 className="font-heading text-xl font-semibold text-[#fafaf8]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

async function getDemoPage(slug: string): Promise<DemoPageData | null> {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  const supabase = createClient(config.url, config.anonKey);
  const { data, error } = await supabase
    .from("demo_pages")
    .select("address, category, city, content, email, gallery_photo_paths, google_maps_url, hero_photo_path, instagram, logo_photo_path, opening_hours, phone, restaurant_name, snapshot, status, template_key, website")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const content = isRecord(data.content) ? data.content : isRecord(data.snapshot) ? data.snapshot : {};
  const name = toString(data.restaurant_name) || toString(content.name) || "Restaurant";
  const category = toString(data.category) || toString(content.category) || "Gastronomie";
  const city = toString(data.city) || toString(content.city);

  return {
    accent: toString(content.accent) || "#C9A227",
    address: toString(data.address) || toString(content.address),
    category,
    city,
    email: toString(data.email) || toString(content.email),
    galleryPhotos: toStringArray(data.gallery_photo_paths).length > 0
      ? toStringArray(data.gallery_photo_paths)
      : toStringArray(content.galleryPhotos ?? content.photos).slice(1, 7),
    googleMapsUrl: toString(data.google_maps_url) || toString(content.googleMapsUrl),
    heroPhoto: toString(data.hero_photo_path) || toString(content.heroPhoto) || toStringArray(content.photos)[0] || "",
    instagram: toString(data.instagram) || toString(content.instagram),
    logoPhoto: toString(data.logo_photo_path) || toString(content.logoPhoto),
    name,
    openingHours: toStringArray(data.opening_hours).length > 0
      ? toStringArray(data.opening_hours)
      : toStringArray(content.openingHours),
    phone: toString(data.phone) || toString(content.phone),
    subtitle: toString(content.subtitle) || `Moderner Webauftritt für ${category}${city ? ` in ${city}` : ""}.`,
    templateKey: toString(data.template_key) || toString(content.templateKey),
    website: toString(data.website) || toString(content.website)
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
