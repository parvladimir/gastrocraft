import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

type DemoSnapshot = {
  address?: string;
  category?: string;
  city?: string;
  contactPerson?: string;
  facebook?: string;
  googleMapsUrl?: string;
  instagram?: string;
  name?: string;
  openingHours?: string[];
  phone?: string;
  photos?: string[];
  rating?: number | null;
  reviewCount?: number | null;
  website?: string;
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

  const heroPhoto = page.photos[0];
  const gallery = page.photos.slice(1, 4);
  const mapsHref = page.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.address || page.name)}`;

  return (
    <main className="min-h-screen bg-[#0f172a] text-[#fafaf8]">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-12">
        <div>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.24em] text-[#c9a227]">
            DINEVIO Restaurant Demo
          </p>
          <h1 className="mt-5 font-heading text-4xl font-semibold leading-tight sm:text-6xl">
            {page.name}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Moderner digitaler Auftritt für {page.category || "Gastronomie"} in {page.city || "Ihrer Stadt"}.
            Speisekarte, Öffnungszeiten, Kontakt und Navigation an einem Ort.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {page.phone ? (
              <a className="inline-flex min-h-12 items-center justify-center rounded bg-[#c9a227] px-5 font-semibold text-[#0f172a]" href={`tel:${page.phone}`}>
                Jetzt anrufen
              </a>
            ) : null}
            {page.googleMapsUrl || page.address ? (
              <a
                className="inline-flex min-h-12 items-center justify-center rounded border border-[#c9a227]/70 px-5 font-semibold text-[#c9a227]"
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                Route öffnen
              </a>
            ) : null}
          </div>
          <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded border border-white/10 p-4">
              <p className="text-[#c9a227]">Adresse</p>
              <p className="mt-2">{page.address || "-"}</p>
            </div>
            <div className="rounded border border-white/10 p-4">
              <p className="text-[#c9a227]">Kontakt</p>
              <p className="mt-2">{page.phone || page.website || "-"}</p>
            </div>
            <div className="rounded border border-white/10 p-4">
              <p className="text-[#c9a227]">Bewertung</p>
              <p className="mt-2">
                {page.rating ? `${page.rating.toFixed(1)} / 5` : "Aktuell halten"}
                {page.reviewCount ? ` · ${page.reviewCount}` : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#101a2c] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          {heroPhoto ? (
            <div
              aria-label={`Vorschau von ${page.name}`}
              className="aspect-[4/3] w-full rounded-lg bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url("${heroPhoto}")` }}
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-lg border border-[#c9a227]/30 bg-[#0f172a] text-center">
              <div>
                <p className="font-heading text-3xl font-semibold text-[#c9a227]">{page.name}</p>
                <p className="mt-3 text-slate-400">Bildbereich für Restaurantfotos</p>
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {gallery.length > 0
              ? gallery.map((photo) => (
                  <div
                    key={photo}
                    aria-hidden="true"
                    className="aspect-square rounded bg-cover bg-center"
                    style={{ backgroundImage: `url("${photo}")` }}
                  />
                ))
              : ["Speisekarte", "Kontakt", "Öffnungszeiten"].map((label) => (
                  <div key={label} className="grid aspect-square place-items-center rounded border border-white/10 text-center text-xs font-semibold text-[#c9a227]">
                    {label}
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#101a2c] px-5 py-14">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <DemoInfoCard title="Online sichtbar" text="Alle wichtigen Informationen sind schnell auffindbar und mobil optimiert." />
          <DemoInfoCard title="Direkt erreichbar" text="Anruf, Route und Kontakt funktionieren ohne unnötige Umwege." />
          <DemoInfoCard title="Einfach aktuell" text="Speisekarte, Öffnungszeiten und Inhalte können laufend gepflegt werden." />
        </div>
        <p className="mx-auto mt-10 max-w-7xl text-sm text-slate-500">
          Konzeptdemo erstellt von DINEVIO. Inhalte dienen der Veranschaulichung und können vor Veröffentlichung angepasst werden.
        </p>
      </section>
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

async function getDemoPage(slug: string): Promise<(DemoSnapshot & { name: string; photos: string[] }) | null> {
  const config = getSupabaseConfig();

  if (!config.isConfigured) {
    return null;
  }

  const supabase = createClient(config.url, config.anonKey);
  const { data, error } = await supabase
    .from("demo_pages")
    .select("snapshot")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const snapshot = data.snapshot as DemoSnapshot;

  return {
    ...snapshot,
    name: snapshot.name || "Restaurant Demo",
    photos: Array.isArray(snapshot.photos) ? snapshot.photos.filter(Boolean) : []
  };
}
