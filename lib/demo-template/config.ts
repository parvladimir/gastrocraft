import { getSiteUrl } from "@/lib/site-config";
import { defaultGalleryImages, defaultMenuItems, defaultRestaurantDemoConfig, demoTemplateThemes, getMenuFallbackImage } from "./defaults";
import type {
  DemoPageSnapshot,
  DemoTemplateKey,
  OpeningHour,
  RestaurantDemoConfig,
  RestaurantDemoGalleryImage,
  RestaurantDemoMenuItem,
  RestaurantDemoReview
} from "./types";

const templateKeys = Object.keys(demoTemplateThemes) as DemoTemplateKey[];

export function buildRestaurantDemoConfig(snapshot: DemoPageSnapshot, slug: string): RestaurantDemoConfig {
  const content = toRecord(snapshot.content);
  const templateConfig = toRecord(snapshot.template_config);
  const socialLinks = {
    ...toRecord(snapshot.social_links),
    ...toRecord(content.socialLinks)
  };
  const legalConfig = toRecord(snapshot.legal_config);
  const seoConfig = toRecord(snapshot.seo_config);
  const specialOffer = {
    ...toRecord(snapshot.special_offer),
    ...toRecord(content.specialOffer)
  };
  const theme = normalizeTemplateKey(
    toString(snapshot.template_key) ||
      toString(templateConfig.theme) ||
      toString(templateConfig.templateKey) ||
      toString(content.templateKey)
  );
  const themeDefaults = demoTemplateThemes[theme];
  const restaurantName = toString(snapshot.restaurant_name) || toString(content.name) || "Restaurant";
  const category = toString(snapshot.category) || toString(content.category) || "Gastronomie";
  const city = toString(snapshot.city) || toString(content.city);
  const address = toString(snapshot.address) || toString(content.address);
  const phone = toString(snapshot.phone) || toString(content.phone);
  const email = toString(snapshot.email) || toString(content.email);
  const website = toString(snapshot.website) || toString(content.website);
  const instagram = toString(snapshot.instagram) || toString(content.instagram) || toString(socialLinks.instagram);
  const googleMapsLink = toString(snapshot.google_maps_url) || toString(content.googleMapsUrl);
  const selectedGallery = toStringArray(snapshot.gallery_photo_paths);
  const menuItems = normalizeMenuItems(snapshot.menu_items);

  return {
    ...defaultRestaurantDemoConfig,
    accentColor: themeDefaults.accentColor,
    address,
    category,
    city,
    cuisineType: toString(templateConfig.cuisineType) || toString(content.cuisineType) || category,
    deliveryEnabled: toBoolean(templateConfig.deliveryEnabled, Boolean(content.deliveryEnabled)),
    email,
    galleryImages: buildGalleryImages(selectedGallery, restaurantName, theme),
    googleMapsEmbedUrl: toString(templateConfig.googleMapsEmbedUrl) || createGoogleMapsEmbedUrl(googleMapsLink, address),
    googleMapsLink: googleMapsLink || createGoogleMapsSearchUrl(address),
    googleRating: toNullableNumber(content.googleRating),
    googleReviewCount: toNullableNumber(content.googleReviewCount),
    googleReviewUrl: toString(content.googleReviewUrl),
    heroImagePath: toString(snapshot.hero_photo_path) || toString(content.heroPhoto) || themeDefaults.heroImage,
    isExampleMenu: menuItems.length === 0,
    legalCompanyName: toString(legalConfig.legalCompanyName),
    logoPath: toString(snapshot.logo_photo_path) || toString(content.logoPhoto) || defaultRestaurantDemoConfig.logoPath,
    menuItems: menuItems.length > 0 ? menuItems : getDefaultMenuItemsForTheme(theme),
    openingHours: normalizeOpeningHours(snapshot.opening_hours),
    ownerName: toString(legalConfig.ownerName),
    phone,
    pickupEnabled: toBoolean(templateConfig.pickupEnabled, Boolean(content.pickupEnabled)),
    postalCode: toString(snapshot.postal_code) || toString(content.postalCode),
    primaryColor: themeDefaults.primaryColor,
    privacyEmail: toString(legalConfig.privacyEmail),
    reservationEnabled: toBoolean(templateConfig.reservationEnabled, Boolean(content.reservationEnabled)),
    restaurantName,
    reviews: normalizeReviews(snapshot.reviews_config),
    secondaryColor: themeDefaults.secondaryColor,
    seo: {
      canonicalUrl: toString(seoConfig.canonicalUrl) || `${getSiteUrl()}/demo/${slug}`,
      description:
        toString(seoConfig.description) ||
        `Unverbindliche Design-Demo für ${restaurantName}${city ? ` in ${city}` : ""}.`,
      title: toString(seoConfig.title) || `${restaurantName} | DINEVIO Demo`
    },
    showThemeSwitcher: false,
    slogan:
      toString(templateConfig.slogan) ||
      toString(content.slogan) ||
      `Moderner Webauftritt für ${category}${city ? ` in ${city}` : ""}`,
    socialLinks: {
      facebook: toString(socialLinks.facebook),
      instagram,
      tiktok: toString(socialLinks.tiktok)
    },
    specialOffer: {
      price: toString(specialOffer.price),
      text: toString(specialOffer.text) || defaultRestaurantDemoConfig.specialOffer.text,
      title: toString(specialOffer.title) || defaultRestaurantDemoConfig.specialOffer.title
    },
    templateKey: theme,
    theme,
    vatId: toString(legalConfig.vatId),
    website,
    whatsappNumber: toString(templateConfig.whatsappNumber) || normalizePhoneForWhatsApp(phone)
  };
}

export function normalizeTemplateKey(value: string): DemoTemplateKey {
  if (templateKeys.includes(value as DemoTemplateKey)) {
    return value as DemoTemplateKey;
  }

  if (value === "schnellundlecker") {
    return "imbiss-pro";
  }

  if (value === "rhodosgrill") {
    return "german-gasthaus";
  }

  if (value === "schlemmerhus") {
    return "german-gasthaus";
  }

  return "german-gasthaus";
}

export function suggestDemoTemplateKey(signals: string): DemoTemplateKey {
  const normalized = signals.toLowerCase();

  if (/imbiss|burger|fast|liefer|döner|doener|grill/.test(normalized)) {
    return "imbiss-pro";
  }

  if (/café|cafe|bäckerei|baeckerei|frühstück|fruehstueck|brunch|eisdiele/.test(normalized)) {
    return "cafe-minimal";
  }

  if (/bar|cocktail|lounge|shisha/.test(normalized)) {
    return "cocktail-neon";
  }

  if (/deutsch|gasthaus|biergarten|hausmannskost/.test(normalized)) {
    return "german-gasthaus";
  }

  if (/fine|steak|premium|weinbar/.test(normalized)) {
    return "premium-dark";
  }

  return /restaurant|pizzeria|café|cafe/.test(normalized) ? "german-gasthaus" : "imbiss-pro";
}

function buildGalleryImages(paths: string[], restaurantName: string, theme: DemoTemplateKey): RestaurantDemoGalleryImage[] {
  const ownImages = paths.map((src, index) => ({
    alt: `Foto ${index + 1} von ${restaurantName}`,
    isExample: false,
    src
  }));

  if (ownImages.length > 0) {
    return ownImages;
  }

  return defaultGalleryImages[theme].map((src) => ({
    alt: "Beispielbild für die Restaurant-Demo",
    isExample: true,
    src
  }));
}

function getDefaultMenuItemsForTheme(theme: DemoTemplateKey) {
  if (theme === "cafe-minimal") {
    return defaultMenuItems.filter((item) => ["Vorspeisen", "Salate", "Desserts", "Getränke"].includes(item.category));
  }

  if (theme === "cocktail-neon") {
    return defaultMenuItems.filter((item) => ["Burger", "Desserts", "Getränke"].includes(item.category));
  }

  if (theme === "premium-dark") {
    return defaultMenuItems.filter((item) => ["Vorspeisen", "Hauptgerichte", "Salate", "Desserts", "Getränke"].includes(item.category));
  }

  return defaultMenuItems;
}

function normalizeMenuItems(value: unknown): RestaurantDemoMenuItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => toRecord(item))
    .map((item) => ({
      allergens: toStringArray(item.allergens),
      available: item.available !== false,
      category: toString(item.category),
      description: toString(item.description),
      image: toString(item.image) || getMenuFallbackImage(toString(item.category)),
      isExample: Boolean(item.isExample),
      name: toString(item.name),
      price: toString(item.price),
      tags: toStringArray(item.tags)
    }))
    .filter((item) => item.name && item.category);
}

function normalizeOpeningHours(value: unknown): OpeningHour[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return {
          days: { de: entry },
          time: ""
        };
      }

      const record = toRecord(entry);
      const daysRecord = toRecord(record.days);
      return {
        closed: Boolean(record.closed),
        days: {
          de: toString(daysRecord.de) || toString(record.days) || toString(record.label)
        },
        time: toString(record.time)
      };
    })
    .filter((entry) => entry.days.de || entry.time);
}

function normalizeReviews(value: unknown): RestaurantDemoReview[] {
  const record = toRecord(value);
  const reviews = Array.isArray(record.reviews) ? record.reviews : Array.isArray(value) ? value : [];

  return reviews
    .map((review) => toRecord(review))
    .map((review) => ({
      author: toString(review.author),
      rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
      text: toString(review.text)
    }))
    .filter((review) => review.author && review.text);
}

function createGoogleMapsEmbedUrl(googleMapsLink: string, address: string) {
  const query = googleMapsLink || address;
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : "";
}

function createGoogleMapsSearchUrl(address: string) {
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : "";
}

function normalizePhoneForWhatsApp(phone: string) {
  return phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
}

function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return fallback;
}

function toNullableNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function toRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function toString(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}
