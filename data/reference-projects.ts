export type ReferenceTheme = "restaurant" | "rhodos" | "schlemmerhus";

export type ReferenceProject = {
  category: string;
  description: string;
  id: string;
  theme: ReferenceTheme;
  title: string;
  url: string;
};

export const referenceProjects: ReferenceProject[] = [
  {
    category: "Modernes Restaurant",
    description:
      "Ein eleganter, atmosphärischer Auftritt für ein modernes Restaurant mit Fokus auf Vertrauen, Reservierung und hochwertige Präsentation.",
    id: "restaurant-demo",
    theme: "restaurant",
    title: "Restaurant Demo",
    url: "https://restaurant.metro-gatecontrol.de/index.html"
  },
  {
    category: "Griechisches Restaurant",
    description:
      "Ein frischer, mediterraner Auftritt mit digitaler Speisekarte und einer klaren visuellen Identität für griechische Gastronomie.",
    id: "rhodos-grill",
    theme: "rhodos",
    title: "Rhodos Grill",
    url: "https://rhodosgrill.metro-gatecontrol.de/index.html"
  },
  {
    category: "Grill & Fast Casual",
    description:
      "Ein markanter, moderner Auftritt für Grill, Burger und Fast Casual mit direkter Ansprache und mobilem Fokus.",
    id: "schlemmerhus",
    theme: "schlemmerhus",
    title: "Schlemmerhus",
    url: "https://schlemmerhus.metro-gatecontrol.de/index.html"
  }
];
