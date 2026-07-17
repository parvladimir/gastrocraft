export type ReferenceTheme = "restaurant" | "rhodos" | "schlemmerhus";

export type ReferenceProject = {
  category: string;
  description: string;
  desktopImage: string;
  id: string;
  imageAlt: string;
  mobileImage: string;
  theme: ReferenceTheme;
  title: string;
  url: string;
};

export const referenceProjects: ReferenceProject[] = [
  {
    category: "Modernes Restaurant",
    desktopImage: "/images/references/restaurant-demo-desktop.webp",
    description:
      "Ein eleganter, atmosphärischer Auftritt für ein modernes Restaurant mit Fokus auf Vertrauen, Reservierung und hochwertige Präsentation.",
    id: "restaurant-demo",
    imageAlt:
      "Screenshot des Restaurant Demo Webdesigns von GastroCraft auf Desktop und Smartphone.",
    mobileImage: "/images/references/restaurant-demo-mobile.webp",
    theme: "restaurant",
    title: "Restaurant Demo",
    url: "https://restaurant.metro-gatecontrol.de/index.html"
  },
  {
    category: "Griechisches Restaurant",
    desktopImage: "/images/references/rhodos-grill-desktop.webp",
    description:
      "Ein frischer, mediterraner Auftritt mit digitaler Speisekarte und einer klaren visuellen Identität für griechische Gastronomie.",
    id: "rhodos-grill",
    imageAlt:
      "Screenshot des Rhodos Grill Demo Webdesigns von GastroCraft auf Desktop und Smartphone.",
    mobileImage: "/images/references/rhodos-grill-mobile.webp",
    theme: "rhodos",
    title: "Rhodos Grill",
    url: "https://rhodosgrill.metro-gatecontrol.de/index.html"
  },
  {
    category: "Grill & Fast Casual",
    desktopImage: "/images/references/schlemmerhus-desktop.webp",
    description:
      "Ein markanter, moderner Auftritt für Grill, Burger und Fast Casual mit direkter Ansprache und mobilem Fokus.",
    id: "schlemmerhus",
    imageAlt:
      "Screenshot des Schlemmerhus Demo Webdesigns von GastroCraft auf Desktop und Smartphone.",
    mobileImage: "/images/references/schlemmerhus-mobile.webp",
    theme: "schlemmerhus",
    title: "Schlemmerhus",
    url: "https://schlemmerhus.metro-gatecontrol.de/index.html"
  }
];
