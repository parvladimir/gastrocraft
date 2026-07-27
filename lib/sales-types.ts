export type SalesUserId = "andrii" | "volodymyr";

export type RestaurantStatus =
  | "Neu"
  | "Besuch geplant"
  | "Nicht erreicht"
  | "Besucht"
  | "Interessiert"
  | "Rückruf"
  | "Demo gesendet"
  | "Angebot gesendet"
  | "Kunde gewonnen"
  | "Abgelehnt";

export type RestaurantCategory =
  | "Imbiss"
  | "Grill"
  | "Pizzeria"
  | "Restaurant"
  | "Café"
  | "Bäckerei"
  | "Lieferdienst"
  | "Bar"
  | "Sonstiges";

export type DemoId =
  | "schnellundlecker"
  | "schlemmerhus"
  | "rhodosgrill"
  | "none";

export type ContactType =
  | "Anrufen"
  | "WhatsApp"
  | "Erneut besuchen"
  | "Angebot senden"
  | "E-Mail senden";

export type ContactActionType =
  | "Restaurant erstellt"
  | "Besuch geplant"
  | "Besuch durchgeführt"
  | "Telefonat"
  | "WhatsApp gesendet"
  | "Demo gesendet"
  | "Angebot gesendet"
  | "Status geändert"
  | "Notiz hinzugefügt"
  | "Restaurant archiviert";

export type TourStatus = "Geplant" | "Aktiv" | "Abgeschlossen";
export type TourStopStatus = "Geplant" | "Besucht" | "Übersprungen";
export type OfferStatus = "Entwurf" | "Gesendet" | "Angenommen" | "Abgelehnt";

export type SalesUser = {
  created_at: string;
  email: string;
  id: SalesUserId;
  name: string;
  password: string;
};

export type Restaurant = {
  archived: boolean;
  category: RestaurantCategory | "";
  city: string;
  contact_person: string;
  contact_position: string;
  created_at: string;
  created_by: SalesUserId;
  email: string;
  id: string;
  instagram: string;
  interest_level: number | null;
  name: string;
  next_contact_at: string;
  next_contact_type: ContactType | "";
  notes: string;
  phone: string;
  planned_visit_at: string;
  postal_code: string;
  responsible_user_id: SalesUserId;
  selected_demo: DemoId;
  status: RestaurantStatus;
  street: string;
  updated_at: string;
  updated_by: SalesUserId;
  website: string;
};

export type ContactHistoryEntry = {
  action_type: ContactActionType;
  contact_at: string;
  created_at: string;
  id: string;
  next_contact_at: string;
  new_status: RestaurantStatus | "";
  note: string;
  old_status: RestaurantStatus | "";
  restaurant_id: string;
  user_id: SalesUserId;
};

export type Tour = {
  created_at: string;
  id: string;
  responsible_user_id: SalesUserId;
  status: TourStatus;
  tour_date: string;
};

export type TourStop = {
  id: string;
  position: number;
  restaurant_id: string;
  status: TourStopStatus;
  tour_id: string;
  visited_at: string;
};

export type Offer = {
  created_at: string;
  created_by: SalesUserId;
  id: string;
  monthly_price: string;
  offer_date: string;
  package_name: string;
  restaurant_id: string;
  setup_price: string;
  special_requests: string;
  status: OfferStatus;
  updated_at: string;
  valid_until: string;
};

export type ServicePackageTemplate = {
  description: string;
  id: string;
  name: string;
};

export type SalesData = {
  contact_history: ContactHistoryEntry[];
  offers: Offer[];
  package_templates: ServicePackageTemplate[];
  restaurants: Restaurant[];
  tour_stops: TourStop[];
  tours: Tour[];
  users: SalesUser[];
};
