import type { DemoId, DigitalPresenceAnalysis, RestaurantCategory } from "@/lib/sales-types";

export type RestaurantLookupCandidate = {
  category: RestaurantCategory | "";
  city: string;
  email: string;
  facebook: string;
  google_maps_url: string;
  google_rating: number | null;
  google_review_count: number | null;
  house_number: string;
  id: string;
  image_url: string;
  instagram: string;
  latitude: string;
  longitude: string;
  name: string;
  opening_hours: string[];
  phone: string;
  photo_urls: string[];
  postal_code: string;
  presence: DigitalPresenceAnalysis;
  source: "google" | "nominatim";
  street: string;
  suggested_demo: DemoId;
  tiktok: string;
  website: string;
};

export type RestaurantLookupResponse = {
  candidates: RestaurantLookupCandidate[];
  message?: string;
  postalCodeAmbiguous?: boolean;
  status: "single" | "multiple" | "not_found" | "error";
};
