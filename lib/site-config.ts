export type SiteConfig = {
  defaultUrl: string;
  description: string;
  descriptor: string;
  language: string;
  locale: string;
  name: string;
  slogan: string;
};

export const siteConfig: SiteConfig = {
  defaultUrl: "https://www.dinevio.de",
  description:
    "DINEVIO entwickelt moderne Websites und digitale Lösungen für Restaurants, Cafés, Bars und Gastronomiebetriebe.",
  descriptor: "Restaurant Digital Solutions",
  language: "de",
  locale: "de_DE",
  name: "DINEVIO",
  slogan: "Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden."
};

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const url = configuredUrl || siteConfig.defaultUrl;
  const normalizedUrl = url.replace(/\/+$/, "");

  try {
    return new URL(normalizedUrl).toString().replace(/\/+$/, "");
  } catch {
    return siteConfig.defaultUrl;
  }
}

export function getAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getSiteUrl()}${normalizedPath}`;
}
