import type { DemoTemplateKey, RestaurantDemoConfig, RestaurantDemoMenuItem } from "./types";

const assetBase = "/demo-template/assets/img";

export const demoTemplateThemes: Record<
  DemoTemplateKey,
  {
    accentColor: string;
    description: string;
    heroImage: string;
    label: string;
    primaryColor: string;
    secondaryColor: string;
  }
> = {
  "premium-dark": {
    accentColor: "#d6b66c",
    description: "Fine Dining, Steakhouse, Weinbar, Premium Restaurant",
    heroImage: `${assetBase}/hero-premium-dark.jpg`,
    label: "Premium Dark",
    primaryColor: "#c9a45d",
    secondaryColor: "#f4e6c8"
  },
  "cocktail-neon": {
    accentColor: "#54f0ff",
    description: "Cocktailbar, Lounge, Nachtbar, Shisha-Bar",
    heroImage: `${assetBase}/hero-cocktail-neon.jpg`,
    label: "Cocktail Neon",
    primaryColor: "#ff4fd8",
    secondaryColor: "#b8f7ff"
  },
  "imbiss-pro": {
    accentColor: "#ffb703",
    description: "Döner, Burger, Pizza, Grill, Chicken, Imbiss, Takeaway",
    heroImage: `${assetBase}/hero-imbiss-pro.jpg`,
    label: "Imbiss Pro",
    primaryColor: "#d62828",
    secondaryColor: "#222222"
  },
  "cafe-minimal": {
    accentColor: "#c69c72",
    description: "Café, Bäckerei, Frühstück, Brunch, Eisdiele",
    heroImage: `${assetBase}/hero-cafe-minimal.jpg`,
    label: "Café Minimal",
    primaryColor: "#7a5c45",
    secondaryColor: "#375d48"
  },
  "german-gasthaus": {
    accentColor: "#b8894d",
    description: "Deutsches Restaurant, Biergarten, Familienrestaurant, klassische Küche",
    heroImage: `${assetBase}/hero-german-gasthaus.jpg`,
    label: "German Gasthaus",
    primaryColor: "#7c2d2d",
    secondaryColor: "#183f2f"
  }
};

export const templateThemeHeroImages = Object.fromEntries(
  Object.entries(demoTemplateThemes).map(([key, value]) => [key, value.heroImage])
) as Record<DemoTemplateKey, string>;

export const defaultGalleryImages: Record<DemoTemplateKey, string[]> = {
  "premium-dark": [
    `${assetBase}/gallery/interior.jpg`,
    `${assetBase}/gallery/table.jpg`,
    `${assetBase}/gallery/grill.jpg`,
    `${assetBase}/gallery/dessert.jpg`,
    `${assetBase}/food/photos/salmon.jpg`,
    `${assetBase}/food/photos/tiramisu.jpg`
  ],
  "cocktail-neon": [
    `${assetBase}/gallery/drinks.jpg`,
    `${assetBase}/gallery/interior.jpg`,
    `${assetBase}/gallery/table.jpg`,
    `${assetBase}/food/photos/lemonade.jpg`,
    `${assetBase}/gallery/dessert.jpg`,
    `${assetBase}/gallery/front.jpg`
  ],
  "imbiss-pro": [
    `${assetBase}/gallery/burger.jpg`,
    `${assetBase}/gallery/currywurst-pommes.jpg`,
    `${assetBase}/gallery/grillteller.jpg`,
    `${assetBase}/gallery/pommes.jpg`,
    `${assetBase}/food/photos/doener.jpg`,
    `${assetBase}/food/photos/pizza-sucuk.jpg`
  ],
  "cafe-minimal": [
    `${assetBase}/gallery/front.jpg`,
    `${assetBase}/gallery/interior.jpg`,
    `${assetBase}/gallery/table.jpg`,
    `${assetBase}/food/photos/bruschetta.jpg`,
    `${assetBase}/food/photos/dessert.jpg`,
    `${assetBase}/food/photos/lemonade.jpg`
  ],
  "german-gasthaus": [
    `${assetBase}/gallery/front.jpg`,
    `${assetBase}/gallery/grill.jpg`,
    `${assetBase}/gallery/schnitzel-pommes.jpg`,
    `${assetBase}/gallery/table.jpg`,
    `${assetBase}/food/photos/grill-plate.jpg`,
    `${assetBase}/food/photos/dessert.jpg`
  ]
};

export const defaultMenuItems: RestaurantDemoMenuItem[] = [
  {
    category: "Vorspeisen",
    description: "Knuspriges Brot mit Tomaten, Kräutern und Olivenöl.",
    image: `${assetBase}/food/photos/bruschetta.jpg`,
    isExample: true,
    name: "Bruschetta",
    price: "6,90 €",
    tags: ["Vegetarisch"]
  },
  {
    category: "Hauptgerichte",
    description: "Gegrilltes Gericht mit Beilage und frischem Salat.",
    image: `${assetBase}/food/photos/grill-plate.jpg`,
    isExample: true,
    name: "Grillteller",
    price: "16,90 €"
  },
  {
    category: "Pizza",
    description: "Klassische Pizza mit Tomaten, Käse und frischen Zutaten.",
    image: `${assetBase}/food/photos/pizza.jpg`,
    isExample: true,
    name: "Pizza Margherita",
    price: "9,90 €",
    tags: ["Vegetarisch"]
  },
  {
    category: "Döner",
    description: "Frisch gefülltes Fladenbrot mit Salat und Sauce.",
    image: `${assetBase}/food/photos/doener.jpg`,
    isExample: true,
    name: "Döner Tasche",
    price: "7,50 €"
  },
  {
    category: "Burger",
    description: "Burger mit Salat, Sauce und knuspriger Beilage.",
    image: `${assetBase}/food/photos/burger.jpg`,
    isExample: true,
    name: "Haus-Burger",
    price: "11,90 €"
  },
  {
    category: "Salate",
    description: "Frischer Salat mit hausgemachtem Dressing.",
    image: `${assetBase}/food/photos/salad.jpg`,
    isExample: true,
    name: "Gemischter Salat",
    price: "8,90 €",
    tags: ["Vegetarisch"]
  },
  {
    category: "Desserts",
    description: "Süßer Abschluss als beispielhafte Darstellung.",
    image: `${assetBase}/food/photos/tiramisu.jpg`,
    isExample: true,
    name: "Dessert des Hauses",
    price: "5,90 €"
  },
  {
    category: "Getränke",
    description: "Erfrischendes Getränk für die Speisekarten-Demo.",
    image: `${assetBase}/food/photos/lemonade.jpg`,
    isExample: true,
    name: "Hausgemachte Limonade",
    price: "4,20 €"
  }
];

export function getMenuFallbackImage(category: string) {
  const normalized = category.toLowerCase();

  if (/burger/.test(normalized)) {
    return `${assetBase}/food/photos/burger.jpg`;
  }

  if (/pizza/.test(normalized)) {
    return `${assetBase}/food/photos/pizza.jpg`;
  }

  if (/döner|doener/.test(normalized)) {
    return `${assetBase}/food/photos/doener.jpg`;
  }

  if (/salat|salad/.test(normalized)) {
    return `${assetBase}/food/photos/salad.jpg`;
  }

  if (/dessert|nachtisch|süß|suess/.test(normalized)) {
    return `${assetBase}/food/photos/tiramisu.jpg`;
  }

  if (/getränk|getraenk|drink/.test(normalized)) {
    return `${assetBase}/food/photos/lemonade.jpg`;
  }

  if (/vorspeise|starter/.test(normalized)) {
    return `${assetBase}/food/photos/bruschetta.jpg`;
  }

  return `${assetBase}/food/photos/grill-plate.jpg`;
}

export const defaultRestaurantDemoConfig: RestaurantDemoConfig = {
  accentColor: demoTemplateThemes["german-gasthaus"].accentColor,
  address: "",
  backgroundColor: "#fff4df",
  category: "Gastronomie",
  city: "",
  cuisineType: "Gastronomie",
  defaultLanguage: "de",
  deliveryEnabled: false,
  email: "",
  galleryImages: defaultGalleryImages["german-gasthaus"].map((src) => ({
    alt: "Beispielbild für ein Restaurant-Demo",
    isExample: true,
    src
  })),
  googleMapsEmbedUrl: "",
  googleMapsLink: "",
  googleRating: null,
  googleReviewCount: null,
  googleReviewUrl: "",
  heroImagePath: demoTemplateThemes["german-gasthaus"].heroImage,
  isExampleMenu: true,
  legalCompanyName: "",
  logoPath: `${assetBase}/logo-placeholder.svg`,
  menuItems: defaultMenuItems,
  openingHours: [],
  ownerName: "",
  phone: "",
  pickupEnabled: false,
  postalCode: "",
  primaryColor: demoTemplateThemes["german-gasthaus"].primaryColor,
  privacyEmail: "",
  reservationEnabled: false,
  restaurantName: "Restaurant",
  reviews: [],
  secondaryColor: demoTemplateThemes["german-gasthaus"].secondaryColor,
  seo: {
    canonicalUrl: "",
    description: "Unverbindliche Design-Demo für einen modernen Restaurant-Webauftritt.",
    title: "Restaurant Demo"
  },
  showThemeSwitcher: false,
  slogan: "Moderner Webauftritt für Ihr Restaurant",
  socialLinks: {
    facebook: "",
    instagram: "",
    tiktok: ""
  },
  specialOffer: {
    price: "",
    text: "Beispielhafte Darstellung eines hervorgehobenen Angebots.",
    title: "Empfehlung des Hauses"
  },
  supportedLanguages: ["de"],
  templateKey: "german-gasthaus",
  textColor: "#2d241c",
  theme: "german-gasthaus",
  themeHeroImages: templateThemeHeroImages,
  vatId: "",
  website: "",
  whatsappNumber: ""
};
