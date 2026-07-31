export type DemoTemplateKey =
  | "premium-dark"
  | "cocktail-neon"
  | "imbiss-pro"
  | "cafe-minimal"
  | "german-gasthaus";

export type LocalizedText = {
  de: string;
  en?: string;
};

export type OpeningHour = {
  closed?: boolean;
  days: LocalizedText;
  time: string;
};

export type RestaurantDemoMenuItem = {
  allergens?: string[];
  available?: boolean;
  category: string;
  description: string;
  image?: string;
  isExample?: boolean;
  name: string;
  price: string;
  tags?: string[];
};

export type RestaurantDemoGalleryImage = {
  alt: string;
  caption?: string;
  isExample?: boolean;
  src: string;
};

export type RestaurantDemoReview = {
  author: string;
  rating: number;
  text: string;
};

export type RestaurantDemoConfig = {
  accentColor: string;
  address: string;
  backgroundColor: string;
  category: string;
  city: string;
  cuisineType: string;
  defaultLanguage: "de";
  deliveryEnabled: boolean;
  email: string;
  galleryImages: RestaurantDemoGalleryImage[];
  googleMapsEmbedUrl: string;
  googleMapsLink: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  googleReviewUrl: string;
  heroImagePath: string;
  isExampleMenu: boolean;
  legalCompanyName: string;
  logoPath: string;
  menuItems: RestaurantDemoMenuItem[];
  openingHours: OpeningHour[];
  ownerName: string;
  phone: string;
  pickupEnabled: boolean;
  postalCode: string;
  primaryColor: string;
  privacyEmail: string;
  reservationEnabled: boolean;
  restaurantName: string;
  reviews: RestaurantDemoReview[];
  secondaryColor: string;
  seo: {
    canonicalUrl: string;
    description: string;
    title: string;
  };
  showThemeSwitcher: boolean;
  slogan: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
  };
  specialOffer: {
    price: string;
    text: string;
    title: string;
  };
  supportedLanguages: ["de"];
  templateKey: DemoTemplateKey;
  textColor: string;
  theme: DemoTemplateKey;
  themeHeroImages: Record<DemoTemplateKey, string>;
  vatId: string;
  website: string;
  whatsappNumber: string;
};

export type DemoPageSnapshot = {
  address?: unknown;
  category?: unknown;
  city?: unknown;
  content?: unknown;
  email?: unknown;
  gallery_config?: unknown;
  gallery_photo_paths?: unknown;
  google_maps_url?: unknown;
  hero_photo_path?: unknown;
  instagram?: unknown;
  legal_config?: unknown;
  logo_photo_path?: unknown;
  menu_config?: unknown;
  menu_items?: unknown;
  opening_hours?: unknown;
  phone?: unknown;
  postal_code?: unknown;
  restaurant_name?: unknown;
  reviews_config?: unknown;
  seo_config?: unknown;
  slug?: unknown;
  social_links?: unknown;
  special_offer?: unknown;
  status?: unknown;
  template_config?: unknown;
  template_key?: unknown;
  website?: unknown;
};
