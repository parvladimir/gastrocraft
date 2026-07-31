import Image from "next/image";
import Link from "next/link";
import type { RestaurantDemoConfig, RestaurantDemoMenuItem } from "@/lib/demo-template/types";

export type RestaurantDemoPageKind = "home" | "menu" | "gallery" | "contact" | "impressum" | "datenschutz";

type RestaurantDemoTemplateProps = {
  config: RestaurantDemoConfig;
  page: RestaurantDemoPageKind;
  slug: string;
};

const categoryOrder = ["Vorspeisen", "Hauptgerichte", "Pizza", "Döner", "Burger", "Salate", "Desserts", "Getränke"];

export function RestaurantDemoTemplate({ config, page, slug }: RestaurantDemoTemplateProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="/demo-template/assets/css/styles.css" />
      <div className={`demo-template theme-${config.theme}`}>
        <a className="skip-link" href="#main">
          Zum Inhalt springen
        </a>
        <DemoHeader config={config} page={page} slug={slug} />
        <main id="main">
          {page === "home" ? <HomePage config={config} slug={slug} /> : null}
          {page === "menu" ? <MenuPage config={config} /> : null}
          {page === "gallery" ? <GalleryPage config={config} /> : null}
          {page === "contact" ? <ContactPage config={config} /> : null}
          {page === "impressum" ? <LegalPage config={config} kind="impressum" /> : null}
          {page === "datenschutz" ? <LegalPage config={config} kind="datenschutz" /> : null}
        </main>
        <MobileOrderBar config={config} slug={slug} />
        <DemoFooter config={config} slug={slug} />
      </div>
    </>
  );
}

function DemoHeader({ config, page, slug }: RestaurantDemoTemplateProps) {
  const base = `/demo/${slug}`;

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href={base} aria-label={`${config.restaurantName} Startseite`}>
          <DemoImage
            alt={`${config.restaurantName} Logo`}
            className="brand-logo"
            height={44}
            src={config.logoPath}
            width={44}
          />
          <span>{config.restaurantName}</span>
        </Link>

        <input className="demo-nav-checkbox" id="demo-nav-toggle" type="checkbox" aria-hidden="true" tabIndex={-1} />
        <label className="nav-toggle" htmlFor="demo-nav-toggle" aria-label="Navigation öffnen">
          <span />
          <span />
          <span />
        </label>

        <nav className="site-nav" id="site-nav" aria-label="Hauptnavigation">
          <DemoNavLink active={page === "home"} href={base} label="Start" />
          <DemoNavLink active={page === "menu"} href={`${base}/menu`} label="Speisekarte" />
          <DemoNavLink active={page === "gallery"} href={`${base}/gallery`} label="Galerie" />
          <DemoNavLink active={page === "contact"} href={`${base}/contact`} label="Kontakt" />
        </nav>
      </div>
    </header>
  );
}

function DemoNavLink({ active, href, label }: { active: boolean; href: string; label: string }) {
  return (
    <Link aria-current={active ? "page" : undefined} href={href}>
      {label}
    </Link>
  );
}

function HomePage({ config, slug }: { config: RestaurantDemoConfig; slug: string }) {
  const base = `/demo/${slug}`;
  const badges = [
    "Unverbindliche Design-Demo",
    config.pickupEnabled ? "Abholung möglich" : "",
    config.deliveryEnabled ? "Lieferung möglich" : "",
    config.reservationEnabled ? "Reservierung möglich" : ""
  ].filter(Boolean);

  return (
    <>
      <section className="hero order-hero section">
        <div className="container hero-grid hero-inner order-hero-inner">
          <div className="hero-content order-hero-content">
            <p className="eyebrow">{config.category || "Restaurant-Demo"}</p>
            <h1>{config.restaurantName}</h1>
            <p className="hero-slogan">{config.slogan}</p>
            <p>Alle wichtigen Informationen, Speisekarte und Kontaktmöglichkeiten sind mobil klar erreichbar.</p>
            {badges.length > 0 ? (
              <div className="hero-trust-row" aria-label="Demo-Vorteile">
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            ) : null}
            <div className="action-row">
              {config.phone ? (
                <a className="button button-primary" href={`tel:${config.phone}`}>
                  Jetzt anrufen
                </a>
              ) : null}
              <Link className="button button-secondary" href={`${base}/menu`}>
                Speisekarte ansehen
              </Link>
              {config.whatsappNumber ? (
                <a className="button button-ghost" href={whatsAppHref(config.whatsappNumber, config.restaurantName)} target="_blank" rel="noopener noreferrer">
                  Per WhatsApp schreiben
                </a>
              ) : null}
            </div>
          </div>

          <div className="hero-media order-hero-media">
            <DemoImage alt={`Beispielansicht für ${config.restaurantName}`} height={760} priority src={config.heroImagePath} width={980} />
            {(config.specialOffer.title || config.specialOffer.text) ? (
              <div className="hero-order-card" aria-label="Hervorgehobener Bereich">
                <span>Heute empfohlen</span>
                <strong>{config.specialOffer.title}</strong>
                {config.specialOffer.price ? <em>{config.specialOffer.price}</em> : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Restaurant-Informationen">
        <div className="container trust-grid">
          {config.googleRating && config.googleReviewCount ? (
            <div className="trust-item">
              <strong>{config.googleRating.toFixed(1).replace(".", ",")}/5</strong>
              <span>{config.googleReviewCount} Google Bewertungen</span>
            </div>
          ) : null}
          <div className="trust-item">
            <strong>Mobil</strong>
            <span>Schnell erreichbar</span>
          </div>
          <div className="trust-item">
            <strong>Kontakt</strong>
            <span>Direkte Aktionen</span>
          </div>
          {config.city ? (
            <div className="trust-item">
              <strong>Lokal</strong>
              <span>{config.city}</span>
            </div>
          ) : null}
        </div>
      </section>

      {(config.specialOffer.title || config.specialOffer.text) ? (
        <section className="section section-compact offer-section">
          <div className="container special-band offer-card order-offer">
            <div>
              <p className="eyebrow">Hervorgehoben</p>
              <h2>{config.specialOffer.title}</h2>
              <p>{config.specialOffer.text}</p>
            </div>
            {config.specialOffer.price ? <strong>{config.specialOffer.price}</strong> : null}
            {config.whatsappNumber ? (
              <a className="button button-primary" href={whatsAppHref(config.whatsappNumber, config.restaurantName)} target="_blank" rel="noopener noreferrer">
                Per WhatsApp schreiben
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <MenuPreview config={config} slug={slug} />

      <section className="section digital-menu-section">
        <div className="container two-column digital-order-grid">
          <div>
            <p className="eyebrow">Digitale Speisekarte</p>
            <h2>Schnell wählen, einfach Kontakt aufnehmen</h2>
            <p>Adresse, Öffnungszeiten, Speisekarte und Kontakt sind mobil sofort erreichbar.</p>
            <div className="action-row">
              <Link className="button button-primary" href={`${base}/menu`}>
                QR-Speisekarte öffnen
              </Link>
              {config.googleMapsLink ? (
                <a className="button button-ghost" href={config.googleMapsLink} target="_blank" rel="noopener noreferrer">
                  Route planen
                </a>
              ) : null}
            </div>
          </div>
          <aside className="qr-panel order-qr-panel" aria-labelledby="qr-title">
            <DemoImage alt="QR-Code Platzhalter für die digitale Speisekarte" height={180} src="/demo-template/assets/img/qr-menu-placeholder.png" width={180} />
            <div>
              <h3 id="qr-title">Digitale Speisekarte</h3>
              <p>Der QR-Code führt direkt zur mobilen Speisekarte und kann auf Tischen, Flyern oder Schaufenstern verwendet werden.</p>
              <small>Beispielhafte Darstellung für das persönliche Demo.</small>
            </div>
          </aside>
        </div>
      </section>

      {(config.address || config.openingHours.length > 0) ? (
        <section className="section">
          <div className="container info-layout">
            {config.address ? (
              <div className="info-card business-card">
                <p className="eyebrow">Google Business</p>
                <h2>Restaurant-Informationen</h2>
                <div className="info-list">
                  <InfoRow label="Name" value={config.restaurantName} />
                  <InfoRow label="Kategorie" value={config.cuisineType} />
                  <InfoRow label="Adresse" value={formatFullAddress(config)} />
                  {config.googleMapsLink ? <InfoRow href={config.googleMapsLink} label="Route" value="In Google Maps öffnen" /> : null}
                </div>
              </div>
            ) : null}
            {config.openingHours.length > 0 ? (
              <div className="hours-card opening-hours info-card">
                <h3>Öffnungszeiten</h3>
                <OpeningHoursList hours={config.openingHours} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {config.reviews.length > 0 ? <ReviewsSection config={config} /> : null}
      <ContactTeaser config={config} slug={slug} />
    </>
  );
}

function MenuPreview({ config, slug }: { config: RestaurantDemoConfig; slug: string }) {
  const previewItems = config.menuItems.filter((item) => item.available !== false).slice(0, 6);

  if (previewItems.length === 0) {
    return null;
  }

  return (
    <section className="section section-muted bestseller-section" id="bestsellers">
      <div className="container section-heading section-header">
        <p className="eyebrow">Speisekarte</p>
        <h2>Bestseller, die sofort Orientierung geben</h2>
        <p>Große Food-Cards, klare Preise und direkte Wege zur Kontaktaufnahme.</p>
      </div>
      <div className="container menu-grid preview-grid menu-preview bestseller-grid">
        {previewItems.map((item) => (
          <MenuCard item={item} key={`${item.category}-${item.name}`} />
        ))}
      </div>
      <div className="container center-actions">
        <Link className="button button-primary" href={`/demo/${slug}/menu`}>
          Speisekarte ansehen
        </Link>
      </div>
    </section>
  );
}

function MenuPage({ config }: { config: RestaurantDemoConfig }) {
  const grouped = groupMenuItems(config.menuItems);

  return (
    <section className="section menu-page-section">
      <div className="container section-heading section-header">
        <p className="eyebrow">Digitale Speisekarte</p>
        <h1>Speisekarte</h1>
        <p>Beispielhafte Darstellung – Inhalte können individuell angepasst werden.</p>
      </div>
      <div className="container menu-category-stack">
        {grouped.map(([category, items]) => (
          <section className="menu-category" key={category}>
            <div className="section-heading">
              <h2>{category}</h2>
            </div>
            <div className="menu-grid">
              {items.map((item) => (
                <MenuCard item={item} key={`${category}-${item.name}`} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function MenuCard({ item }: { item: RestaurantDemoMenuItem }) {
  return (
    <article className="menu-card">
      {item.image ? <DemoImage alt={item.name} height={380} src={item.image} width={560} /> : null}
      <div className="menu-card-content">
        <div className="menu-card-title">
          <h3>{item.name}</h3>
          {item.price ? <strong>{item.price}</strong> : null}
        </div>
        {item.description ? <p>{item.description}</p> : null}
        {item.tags && item.tags.length > 0 ? (
          <div className="tag-row">
            {item.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function GalleryPage({ config }: { config: RestaurantDemoConfig }) {
  return (
    <section className="section gallery-page-section">
      <div className="container section-heading section-header">
        <p className="eyebrow">Galerie</p>
        <h1>Einblicke</h1>
        <p>{config.galleryImages.some((image) => !image.isExample) ? "Ausgewählte Bilder des Restaurants." : "Standardbilder des Templates als visuelle Vorschau."}</p>
      </div>
      <div className="container gallery-grid">
        {config.galleryImages.map((image, index) => (
          <figure className="gallery-card" key={`${image.src}-${index}`}>
            <DemoImage alt={image.alt} height={620} src={image.src} width={820} />
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </section>
  );
}

function ContactPage({ config }: { config: RestaurantDemoConfig }) {
  return (
    <section className="section contact-section">
      <div className="container two-column">
        <div>
          <p className="eyebrow">Kontakt</p>
          <h1>{config.restaurantName}</h1>
          {config.address || config.city ? <p>{formatFullAddress(config)}</p> : null}
          <div className="action-row">
            {config.phone ? (
              <a className="button button-primary" href={`tel:${config.phone}`}>
                Anrufen
              </a>
            ) : null}
            {config.whatsappNumber ? (
              <a className="button button-secondary" href={whatsAppHref(config.whatsappNumber, config.restaurantName)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            ) : null}
            {config.googleMapsLink ? (
              <a className="button button-ghost" href={config.googleMapsLink} target="_blank" rel="noopener noreferrer">
                Route planen
              </a>
            ) : null}
          </div>
          <div className="info-list">
            <InfoRow href={config.email ? `mailto:${config.email}` : undefined} label="E-Mail" value={config.email} />
            <InfoRow href={config.website || undefined} label="Website" value={config.website ? "Website öffnen" : ""} />
            <InfoRow href={config.socialLinks.instagram || undefined} label="Instagram" value={config.socialLinks.instagram ? "Instagram öffnen" : ""} />
          </div>
        </div>
        <div className="map-frame info-card">
          {config.googleMapsEmbedUrl ? (
            <iframe title={`Karte ${config.restaurantName}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={config.googleMapsEmbedUrl} />
          ) : (
            <p>Standortdaten sind für diese Demo noch nicht hinterlegt.</p>
          )}
        </div>
      </div>
      <div className="container section-compact">
        <div className="info-card">
          <h2>Kontaktformular</h2>
          <p>Diese Demo versendet noch keine Anfrage an den Restaurantbetrieb. Nutzen Sie die direkten Kontaktmöglichkeiten oder passen Sie den Formularversand später an.</p>
        </div>
      </div>
    </section>
  );
}

function LegalPage({ config, kind }: { config: RestaurantDemoConfig; kind: "impressum" | "datenschutz" }) {
  const hasLegalDetails = Boolean(config.legalCompanyName || config.ownerName || config.privacyEmail);
  const title = kind === "impressum" ? "Impressum" : "Datenschutz";

  return (
    <section className="section">
      <div className="container narrow info-card">
        <p className="eyebrow">{title}</p>
        <h1>{title}</h1>
        {!hasLegalDetails ? (
          <p>
            Musterseite – rechtliche Angaben müssen vor Veröffentlichung durch den Betreiber ergänzt und geprüft werden.
          </p>
        ) : null}
        {config.legalCompanyName ? <InfoRow label="Unternehmen" value={config.legalCompanyName} /> : null}
        {config.ownerName ? <InfoRow label="Vertreten durch" value={config.ownerName} /> : null}
        {config.privacyEmail ? <InfoRow href={`mailto:${config.privacyEmail}`} label="Kontakt" value={config.privacyEmail} /> : null}
        {kind === "datenschutz" ? (
          <p className="template-demo-note">Diese Datenschutzhinweise müssen vor einer echten Veröffentlichung auf Hosting, Formulare und eingesetzte Dienste angepasst werden.</p>
        ) : null}
      </div>
    </section>
  );
}

function ContactTeaser({ config, slug }: { config: RestaurantDemoConfig; slug: string }) {
  if (!config.address && !config.phone && !config.email && !config.googleMapsLink) {
    return null;
  }

  return (
    <section className="section contact-section">
      <div className="container two-column">
        <div>
          <p className="eyebrow">Anfahrt</p>
          <h2>Kontakt</h2>
          <p>
            <strong>{config.restaurantName}</strong>
            {formatFullAddress(config) ? (
              <>
                <br />
                {formatFullAddress(config)}
              </>
            ) : null}
          </p>
          <p>
            {config.phone ? (
              <>
                <a href={`tel:${config.phone}`}>{config.phone}</a>
                <br />
              </>
            ) : null}
            {config.email ? <a href={`mailto:${config.email}`}>{config.email}</a> : null}
          </p>
          <div className="action-row">
            {config.googleMapsLink ? (
              <a className="button button-primary" href={config.googleMapsLink} target="_blank" rel="noopener noreferrer">
                Route planen
              </a>
            ) : null}
            <Link className="button button-secondary" href={`/demo/${slug}/contact`}>
              Kontakt
            </Link>
          </div>
        </div>
        {config.googleMapsEmbedUrl ? (
          <div className="map-frame info-card">
            <iframe title={`Karte ${config.restaurantName}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={config.googleMapsEmbedUrl} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ReviewsSection({ config }: { config: RestaurantDemoConfig }) {
  return (
    <section className="section section-muted">
      <div className="container section-heading section-header">
        <p className="eyebrow">Bewertungen</p>
        <h2>Stimmen unserer Gäste</h2>
      </div>
      <div className="container reviews-grid">
        {config.reviews.map((review) => (
          <article className="review-card info-card" key={`${review.author}-${review.text}`}>
            <strong>{"★".repeat(review.rating)}</strong>
            <p>{review.text}</p>
            <span>{review.author}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemoFooter({ config, slug }: { config: RestaurantDemoConfig; slug: string }) {
  const base = `/demo/${slug}`;

  return (
    <footer className="site-footer footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand footer-brand" href={base}>
            <DemoImage alt={`${config.restaurantName} Logo`} height={40} src={config.logoPath} width={40} />
            <span>{config.restaurantName}</span>
          </Link>
          <p>Unverbindliche Design-Demo für einen modernen Restaurant-Webauftritt.</p>
          <p>
            Demo erstellt von{" "}
            <a href="https://www.dinevio.de" target="_blank" rel="noopener noreferrer">
              DINEVIO
            </a>
          </p>
        </div>
        <div>
          <h2>Navigation</h2>
          <p>
            <Link href={base}>Start</Link>
            <br />
            <Link href={`${base}/menu`}>Speisekarte</Link>
            <br />
            <Link href={`${base}/gallery`}>Galerie</Link>
            <br />
            <Link href={`${base}/contact`}>Kontakt</Link>
          </p>
        </div>
        <div>
          <h2>Kontakt</h2>
          <p>
            {formatFullAddress(config) || "Kontaktangaben noch nicht vollständig hinterlegt."}
            {config.phone ? (
              <>
                <br />
                <a href={`tel:${config.phone}`}>{config.phone}</a>
              </>
            ) : null}
          </p>
        </div>
        <div>
          <h2>Rechtliches</h2>
          <p>
            <Link href={`${base}/impressum`}>Impressum</Link>
            <br />
            <Link href={`${base}/datenschutz`}>Datenschutz</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function MobileOrderBar({ config, slug }: { config: RestaurantDemoConfig; slug: string }) {
  return (
    <nav className="mobile-order-bar" aria-label="Schnellzugriff">
      {config.phone ? <a href={`tel:${config.phone}`}>Anrufen</a> : null}
      <Link href={`/demo/${slug}/menu`}>Menü</Link>
      {config.whatsappNumber ? (
        <a href={whatsAppHref(config.whatsappNumber, config.restaurantName)} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      ) : null}
    </nav>
  );
}

function OpeningHoursList({ hours }: { hours: RestaurantDemoConfig["openingHours"] }) {
  return (
    <div>
      {hours.map((entry) => (
        <p className="hours-row" key={`${entry.days.de}-${entry.time}`}>
          <span>{entry.days.de}</span>
          <strong>{entry.closed ? "Geschlossen" : entry.time}</strong>
        </p>
      ))}
    </div>
  );
}

function InfoRow({ href, label, value }: { href?: string; label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <p className="info-row">
      <span>{label}</span>
      {href ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </p>
  );
}

function DemoImage({
  alt,
  className,
  height,
  priority = false,
  src,
  width
}: {
  alt: string;
  className?: string;
  height: number;
  priority?: boolean;
  src: string;
  width: number;
}) {
  if (!src) {
    return null;
  }

  if (src.startsWith("/")) {
    return <Image alt={alt} className={className} height={height} priority={priority} src={src} width={width} />;
  }

  return <Image alt={alt} className={className} height={height} priority={priority} src={src} unoptimized width={width} />;
}

function groupMenuItems(items: RestaurantDemoMenuItem[]) {
  const grouped = new Map<string, RestaurantDemoMenuItem[]>();

  for (const item of items.filter((entry) => entry.available !== false)) {
    const category = item.category || "Speisekarte";
    grouped.set(category, [...(grouped.get(category) ?? []), item]);
  }

  return [...grouped.entries()].sort(([a], [b]) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
  });
}

function whatsAppHref(number: string, restaurantName: string) {
  const cleanNumber = number.replace(/[^\d]/g, "");
  const text = encodeURIComponent(`Hallo, ich habe eine Frage zu ${restaurantName}.`);
  return `https://wa.me/${cleanNumber}?text=${text}`;
}

function formatFullAddress(config: RestaurantDemoConfig) {
  return [config.address, [config.postalCode, config.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}
