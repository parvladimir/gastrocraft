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
  defaultUrl: "http://localhost:3000",
  description:
    "GastroCraft entwickelt moderne digitale Lösungen für Restaurants – von professionellen Websites und digitalen Speisekarten bis zur Google-Optimierung und laufenden Betreuung.",
  descriptor: "Restaurant Digital Solutions",
  language: "de",
  locale: "de_DE",
  name: "GastroCraft",
  slogan: "Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden."
};

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const deploymentUrl = vercelUrl ? normalizeDeploymentUrl(vercelUrl) : "";
  const fallbackUrl =
    process.env.NODE_ENV === "production"
      ? "https://site-url-not-configured.invalid"
      : siteConfig.defaultUrl;
  const url = configuredUrl || deploymentUrl || fallbackUrl;
  const normalizedUrl = url.replace(/\/+$/, "");

  try {
    return new URL(normalizedUrl).toString().replace(/\/+$/, "");
  } catch {
    return fallbackUrl;
  }
}

export function getAbsoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getSiteUrl()}${normalizedPath}`;
}

function normalizeDeploymentUrl(url: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}
