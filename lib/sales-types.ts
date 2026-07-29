export type SalesUserId = string;

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
export type OfferStatus =
  | "draft"
  | "generated"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "Entwurf"
  | "Gesendet"
  | "Angenommen"
  | "Abgelehnt";

export type TaskStatus = "open" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskType =
  | "call"
  | "whatsapp"
  | "email"
  | "visit"
  | "send_offer"
  | "follow_up"
  | "custom";

export type MessageChannel = "whatsapp" | "email" | "sms" | "internal";
export type MessageTemplateCategory =
  | "first_contact"
  | "after_visit"
  | "demo"
  | "reminder"
  | "offer"
  | "follow_up"
  | "appointment"
  | "rejection"
  | "custom";
export type PhotoType = "facade" | "interior" | "menu" | "logo" | "other";
export type ContactDirection = "incoming" | "outgoing" | "internal";

export type SalesUser = {
  created_at: string;
  email: string;
  id: SalesUserId;
  name: string;
  role: "admin" | "sales";
  updated_at?: string;
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
  facebook: string;
  google_maps_url: string;
  google_place_id?: string;
  google_rating: number | null;
  google_review_count: number | null;
  house_number: string;
  id: string;
  instagram: string;
  interest_level: number | null;
  latitude: string;
  location_accuracy?: string;
  location_updated_at?: string;
  longitude: string;
  name: string;
  next_contact_at: string;
  next_contact_type: ContactType | "";
  notes: string;
  opening_hours: string[];
  phone: string;
  photos: string[];
  planned_visit_at: string;
  postal_code: string;
  rejection_reason?: string;
  responsible_user_id: SalesUserId;
  selected_demo: DemoId;
  status: RestaurantStatus;
  street: string;
  tiktok: string;
  updated_at: string;
  updated_by: SalesUserId;
  website: string;
  digital_presence: DigitalPresenceAnalysis | null;
};

export type DigitalPresenceAnalysis = {
  has_facebook: boolean | null;
  has_https: boolean | null;
  has_instagram: boolean | null;
  has_mobile_viewport: boolean | null;
  has_online_booking: boolean | null;
  has_online_menu: boolean | null;
  has_website: boolean;
  score: number;
};

export type ContactHistoryEntry = {
  action_type: ContactActionType;
  channel?: MessageChannel | "";
  contact_at: string;
  contact_person?: string;
  created_at: string;
  direction?: ContactDirection | "";
  id: string;
  message_template_id?: string;
  message_text?: string;
  metadata?: Record<string, unknown>;
  next_contact_at: string;
  new_status: RestaurantStatus | "";
  note: string;
  offer_id?: string;
  old_status: RestaurantStatus | "";
  restaurant_id: string;
  task_id?: string;
  title?: string;
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
  accepted_at?: string;
  additional_services?: string[];
  contact_person?: string;
  created_at: string;
  created_by: SalesUserId;
  discount_amount?: string;
  discount_percent?: string;
  id: string;
  included_services?: string[];
  intro_text?: string;
  monthly_price: string;
  notes?: string;
  offer_date: string;
  offer_number?: string;
  package_name: string;
  package_id?: string;
  payment_terms?: string;
  pdf_storage_path?: string;
  rejected_at?: string;
  restaurant_id: string;
  sent_at?: string;
  setup_price: string;
  special_requests: string;
  status: OfferStatus;
  updated_at: string;
  valid_until: string;
  vat_rate?: string;
};

export type ServicePackageTemplate = {
  description: string;
  id: string;
  name: string;
};

export type RestaurantPhoto = {
  caption: string;
  created_at: string;
  file_name: string;
  file_size: number | null;
  id: string;
  is_primary: boolean;
  mime_type: string;
  photo_type: PhotoType;
  restaurant_id: string;
  signed_url?: string;
  storage_path: string;
  uploaded_by: SalesUserId;
};

export type SalesTask = {
  assigned_to: SalesUserId;
  completed_at: string;
  completed_by: SalesUserId | "";
  created_at: string;
  created_by: SalesUserId;
  description: string;
  due_at: string;
  id: string;
  priority: TaskPriority;
  related_offer_id: string;
  restaurant_id: string;
  status: TaskStatus;
  task_type: TaskType;
  title: string;
  updated_at: string;
};

export type MessageTemplate = {
  body: string;
  category: MessageTemplateCategory | "";
  channel: MessageChannel;
  created_at: string;
  created_by: SalesUserId | "";
  id: string;
  is_active: boolean;
  name: string;
  subject: string;
  updated_at: string;
  updated_by: SalesUserId | "";
};

export type SalesSetting = {
  id: string;
  key: string;
  updated_at: string;
  updated_by: SalesUserId | "";
  value: unknown;
};

export type SalesData = {
  contact_history: ContactHistoryEntry[];
  message_templates: MessageTemplate[];
  offers: Offer[];
  package_templates: ServicePackageTemplate[];
  restaurant_photos: RestaurantPhoto[];
  restaurants: Restaurant[];
  sales_settings: SalesSetting[];
  tasks: SalesTask[];
  tour_stops: TourStop[];
  tours: Tour[];
  users: SalesUser[];
};
