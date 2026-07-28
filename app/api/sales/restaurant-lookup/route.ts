import { NextRequest, NextResponse } from "next/server";
import type {
  RestaurantLookupCandidate,
  RestaurantLookupResponse
} from "@/lib/restaurant-lookup-types";
import type { DemoId, DigitalPresenceAnalysis, RestaurantCategory } from "@/lib/sales-types";

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.dinevio.de";

const googleFieldMask = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.photos.name",
  "places.types",
  "places.primaryTypeDisplayName"
].join(",");

type GooglePlace = {
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  googleMapsUri?: string;
  id?: string;
  internationalPhoneNumber?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  nationalPhoneNumber?: string;
  photos?: Array<{
    name?: string;
  }>;
  primaryTypeDisplayName?: {
    text?: string;
  };
  rating?: number;
  regularOpeningHours?: {
    weekdayDescriptions?: string[];
  };
  types?: string[];
  userRatingCount?: number;
  websiteUri?: string;
};

type NominatimPlace = {
  address?: Record<string, string>;
  boundingbox?: string[];
  display_name?: string;
  extratags?: Record<string, string>;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number;
  place_id?: number;
  type?: string;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const rawQuery = body.query?.trim() ?? "";

  if (rawQuery.length < 3) {
    return NextResponse.json<RestaurantLookupResponse>(
      {
        candidates: [],
        message: "Bitte geben Sie einen Google Maps Link oder Restaurantnamen ein.",
        status: "error"
      },
      { status: 400 }
    );
  }

  const query = await normalizeLookupQuery(rawQuery);
  const googleCandidates = googlePlacesApiKey ? await searchGooglePlaces(query) : [];
  const candidates = googleCandidates.length > 0 ? googleCandidates : await searchNominatim(query);

  if (candidates.length === 0) {
    return NextResponse.json<RestaurantLookupResponse>({
      candidates: [],
      message: "Kein passendes Restaurant gefunden.",
      status: "not_found"
    });
  }

  const enrichedCandidates = await Promise.all(candidates.slice(0, 5).map(enrichCandidate));
  const postalCodeAmbiguous = enrichedCandidates.some((candidate) => !candidate.postal_code);

  return NextResponse.json<RestaurantLookupResponse>({
    candidates: enrichedCandidates,
    postalCodeAmbiguous,
    status: enrichedCandidates.length > 1 ? "multiple" : "single"
  });
}

async function normalizeLookupQuery(rawQuery: string) {
  if (!isHttpUrl(rawQuery)) {
    return rawQuery;
  }

  try {
    const response = await fetch(rawQuery, {
      redirect: "follow",
      signal: AbortSignal.timeout(5000)
    });
    return decodeURIComponent(response.url || rawQuery);
  } catch {
    return rawQuery;
  }
}

async function searchGooglePlaces(query: string): Promise<RestaurantLookupCandidate[]> {
  try {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      body: JSON.stringify({
        languageCode: "de",
        regionCode: "DE",
        textQuery: query
      }),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": googlePlacesApiKey,
        "X-Goog-FieldMask": googleFieldMask
      },
      method: "POST",
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { places?: GooglePlace[] };
    return (payload.places ?? []).map(mapGooglePlace);
  } catch {
    return [];
  }
}

function mapGooglePlace(place: GooglePlace): RestaurantLookupCandidate {
  const address = parseGoogleAddress(place.addressComponents ?? []);
  const category = mapCategory([
    ...(place.types ?? []),
    place.primaryTypeDisplayName?.text ?? ""
  ]);
  const photoUrls = (place.photos ?? [])
    .map((photo) => photo.name)
    .filter(Boolean)
    .slice(0, 4)
    .map((name) => `/api/sales/place-photo?name=${encodeURIComponent(name as string)}`);

  return {
    category,
    city: address.city,
    email: "",
    facebook: "",
    google_maps_url: place.googleMapsUri ?? "",
    google_rating: place.rating ?? null,
    google_review_count: place.userRatingCount ?? null,
    house_number: address.houseNumber,
    id: place.id ?? createCandidateId(place.displayName?.text ?? place.formattedAddress ?? ""),
    image_url: photoUrls[0] ?? "",
    instagram: "",
    latitude: place.location?.latitude ? String(place.location.latitude) : "",
    longitude: place.location?.longitude ? String(place.location.longitude) : "",
    name: place.displayName?.text ?? place.formattedAddress ?? "Restaurant",
    opening_hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    phone: place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? "",
    photo_urls: photoUrls,
    postal_code: address.postalCode,
    presence: createPresenceAnalysis(place.websiteUri ?? "", ""),
    source: "google",
    street: address.street,
    suggested_demo: suggestDemo(category, [
      ...(place.types ?? []),
      place.displayName?.text ?? "",
      place.primaryTypeDisplayName?.text ?? ""
    ]),
    tiktok: "",
    website: place.websiteUri ?? ""
  };
}

async function searchNominatim(query: string): Promise<RestaurantLookupCandidate[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("namedetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "de");

  try {
    const response = await fetch(url, {
      headers: {
        Referer: siteUrl,
        "User-Agent": `DINEVIO Sales Manager (${siteUrl})`
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      return [];
    }

    const places = (await response.json()) as NominatimPlace[];
    return places.map(mapNominatimPlace);
  } catch {
    return [];
  }
}

function mapNominatimPlace(place: NominatimPlace): RestaurantLookupCandidate {
  const address = place.address ?? {};
  const street = address.road ?? address.pedestrian ?? address.footway ?? "";
  const category = mapCategory([place.type ?? "", place.extratags?.cuisine ?? ""]);
  const name =
    place.name ??
    place.extratags?.name ??
    place.display_name?.split(",")[0]?.trim() ??
    "Restaurant";
  const website = normalizeWebsiteUrl(place.extratags?.website ?? place.extratags?.url ?? "");

  return {
    category,
    city: address.city ?? address.town ?? address.village ?? address.municipality ?? "",
    email: place.extratags?.email ?? "",
    facebook: normalizeSocialUrl(place.extratags?.facebook ?? ""),
    google_maps_url: "",
    google_rating: null,
    google_review_count: null,
    house_number: address.house_number ?? "",
    id: String(place.place_id ?? place.osm_id ?? createCandidateId(name)),
    image_url: "",
    instagram: normalizeSocialUrl(place.extratags?.instagram ?? ""),
    latitude: place.lat ?? "",
    longitude: place.lon ?? "",
    name,
    opening_hours: place.extratags?.opening_hours ? [place.extratags.opening_hours] : [],
    phone: place.extratags?.phone ?? "",
    photo_urls: [],
    postal_code: address.postcode ?? "",
    presence: createPresenceAnalysis(website, ""),
    source: "nominatim",
    street,
    suggested_demo: suggestDemo(category, [place.type ?? "", place.extratags?.cuisine ?? "", name]),
    tiktok: "",
    website
  };
}

async function enrichCandidate(candidate: RestaurantLookupCandidate) {
  const scanned = await scanWebsite(candidate.website);

  return {
    ...candidate,
    email: candidate.email || scanned.email,
    facebook: candidate.facebook || scanned.facebook,
    instagram: candidate.instagram || scanned.instagram,
    presence: mergePresenceAnalysis(candidate.presence, scanned.presence),
    suggested_demo:
      candidate.suggested_demo === "none"
        ? suggestDemo(candidate.category, [
            candidate.name,
            scanned.htmlSample,
            candidate.website
          ])
        : candidate.suggested_demo,
    tiktok: candidate.tiktok || scanned.tiktok
  };
}

async function scanWebsite(website: string) {
  const empty = {
    email: "",
    facebook: "",
    htmlSample: "",
    instagram: "",
    presence: createPresenceAnalysis(website, ""),
    tiktok: ""
  };

  if (!website || !isSafePublicHttpUrl(website)) {
    return empty;
  }

  try {
    const response = await fetch(website, {
      headers: {
        "User-Agent": `DINEVIO Sales Manager (${siteUrl})`
      },
      signal: AbortSignal.timeout(6500)
    });

    if (!response.ok) {
      return empty;
    }

    const html = (await response.text()).slice(0, 250000);
    return {
      email: findEmail(html),
      facebook: findSocialUrl(html, "facebook.com"),
      htmlSample: html.slice(0, 5000),
      instagram: findSocialUrl(html, "instagram.com"),
      presence: createPresenceAnalysis(website, html),
      tiktok: findSocialUrl(html, "tiktok.com")
    };
  } catch {
    return empty;
  }
}

function parseGoogleAddress(components: GooglePlace["addressComponents"]) {
  const find = (type: string) =>
    components?.find((component) => component.types?.includes(type))?.longText ?? "";

  return {
    city: find("locality") || find("postal_town") || find("administrative_area_level_3"),
    houseNumber: find("street_number"),
    postalCode: find("postal_code"),
    street: find("route")
  };
}

function mapCategory(signals: string[]): RestaurantCategory | "" {
  const text = signals.join(" ").toLowerCase();

  if (/(bakery|bäckerei|baeckerei)/i.test(text)) {
    return "Bäckerei";
  }

  if (/(cafe|café)/i.test(text)) {
    return "Café";
  }

  if (/(bar|pub)/i.test(text)) {
    return "Bar";
  }

  if (/(pizza|pizzeria)/i.test(text)) {
    return "Pizzeria";
  }

  if (/(grill|burger|fast food|imbiss|snack)/i.test(text)) {
    return "Imbiss";
  }

  if (/(delivery|lieferdienst)/i.test(text)) {
    return "Lieferdienst";
  }

  if (/(restaurant|greek|griech)/i.test(text)) {
    return "Restaurant";
  }

  return "";
}

function suggestDemo(category: RestaurantCategory | "", signals: string[]): DemoId {
  const text = `${category} ${signals.join(" ")}`.toLowerCase();

  if (/(griech|greek|rhodos|gyros|souvlaki)/i.test(text)) {
    return "rhodosgrill";
  }

  if (/(fast food|burger|imbiss|grill|snack|kebab|döner|doener)/i.test(text)) {
    return "schnellundlecker";
  }

  if (/(restaurant|cafe|café|gehoben|bistro)/i.test(text)) {
    return "schlemmerhus";
  }

  return "none";
}

function createPresenceAnalysis(website: string, html: string): DigitalPresenceAnalysis {
  const hasWebsite = Boolean(website);
  const lowerHtml = html.toLowerCase();
  const hasInstagram = /instagram\.com/i.test(html);
  const hasFacebook = /facebook\.com/i.test(html);
  const hasOnlineMenu = /(speisekarte|menü|menu|karte|gerichte|essen)/i.test(lowerHtml);
  const hasOnlineBooking = /(reservierung|reservation|table|booking|opentable|quandoo|resmio)/i.test(lowerHtml);
  const hasMobileViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasHttps = website.startsWith("https://");
  const scoreParts = [
    hasWebsite,
    hasHttps,
    hasOnlineMenu,
    hasInstagram,
    hasFacebook,
    hasOnlineBooking,
    hasMobileViewport
  ];
  const score = Math.round((scoreParts.filter(Boolean).length / scoreParts.length) * 100);

  return {
    has_facebook: hasWebsite ? hasFacebook : null,
    has_https: hasWebsite ? hasHttps : null,
    has_instagram: hasWebsite ? hasInstagram : null,
    has_mobile_viewport: hasWebsite ? hasMobileViewport : null,
    has_online_booking: hasWebsite ? hasOnlineBooking : null,
    has_online_menu: hasWebsite ? hasOnlineMenu : null,
    has_website: hasWebsite,
    score
  };
}

function mergePresenceAnalysis(
  base: DigitalPresenceAnalysis,
  scanned: DigitalPresenceAnalysis
): DigitalPresenceAnalysis {
  return {
    has_facebook: scanned.has_facebook ?? base.has_facebook,
    has_https: scanned.has_https ?? base.has_https,
    has_instagram: scanned.has_instagram ?? base.has_instagram,
    has_mobile_viewport: scanned.has_mobile_viewport ?? base.has_mobile_viewport,
    has_online_booking: scanned.has_online_booking ?? base.has_online_booking,
    has_online_menu: scanned.has_online_menu ?? base.has_online_menu,
    has_website: scanned.has_website || base.has_website,
    score: Math.max(base.score, scanned.score)
  };
}

function findEmail(html: string) {
  return html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function findSocialUrl(html: string, host: string) {
  const escapedHost = host.replace(".", "\\.");
  const match = html.match(new RegExp(`https?:\\/\\/[^"'\\s<>]*${escapedHost}[^"'\\s<>]*`, "i"));
  return match?.[0]?.replace(/&amp;/g, "&") ?? "";
}

function normalizeSocialUrl(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http")) {
    return value;
  }

  return `https://${value.replace(/^@/, "")}`;
}

function normalizeWebsiteUrl(value: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isSafePublicHttpUrl(value: string) {
  if (!isHttpUrl(value)) {
    return false;
  }

  const hostname = new URL(value).hostname.toLowerCase();
  return !(
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

function createCandidateId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "candidate";
}
