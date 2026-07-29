import type { SupabaseClient } from "@supabase/supabase-js";
import { initialPackageTemplates, salesUsers } from "@/data/sales-config";
import type {
  ContactHistoryEntry,
  MessageTemplate,
  Offer,
  RestaurantPhoto,
  Restaurant,
  SalesData,
  SalesSetting,
  SalesTask,
  SalesUser,
  ServicePackageTemplate,
  Tour,
  TourStop
} from "@/lib/sales-types";

type DbRecord = Record<string, unknown>;
type SalesSupabaseClient = SupabaseClient;

export type SalesServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export const profilesService = {
  async getCurrentProfile(supabase: SalesSupabaseClient): Promise<SalesServiceResult<SalesUser>> {
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      return { data: null, error: "Sitzung konnte nicht geladen werden." };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    if (!data) {
      return { data: null, error: "Für diesen Benutzer wurde noch kein Profil angelegt." };
    }

    return { data: mapProfile(data as DbRecord), error: null };
  },

  async getProfiles(supabase: SalesSupabaseClient): Promise<SalesServiceResult<SalesUser[]>> {
    const { data, error } = await supabase.from("profiles").select("*").order("name");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapProfile), error: null };
  }
};

export const salesDataService = {
  async load(supabase: SalesSupabaseClient): Promise<SalesServiceResult<SalesData>> {
    const [
      profilesResult,
      restaurantsResult,
      historyResult,
      toursResult,
      tourStopsResult,
      offersResult,
      packagesResult,
      photosResult,
      tasksResult,
      templatesResult,
      settingsResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").order("name"),
      supabase.from("restaurants").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_history").select("*").order("created_at", { ascending: true }),
      supabase.from("tours").select("*").order("tour_date", { ascending: true }),
      supabase.from("tour_stops").select("*").order("position", { ascending: true }),
      supabase.from("offers").select("*").order("created_at", { ascending: true }),
      supabase.from("service_packages").select("*").order("sort_order", { ascending: true }),
      supabase.from("restaurant_photos").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_at", { ascending: true }),
      supabase.from("message_templates").select("*").order("name", { ascending: true }),
      supabase.from("sales_settings").select("*").order("key", { ascending: true })
    ]);

    const firstError =
      profilesResult.error ??
      restaurantsResult.error ??
      historyResult.error ??
      toursResult.error ??
      tourStopsResult.error ??
      offersResult.error ??
      packagesResult.error ??
      photosResult.error ??
      tasksResult.error ??
      templatesResult.error ??
      settingsResult.error;

    if (firstError) {
      return { data: null, error: normalizeSalesError(firstError.message) };
    }

    const users = ((profilesResult.data ?? []) as DbRecord[]).map(mapProfile);
    const packages = ((packagesResult.data ?? []) as DbRecord[]).map(mapServicePackage);

    return {
      data: {
        contact_history: ((historyResult.data ?? []) as DbRecord[]).map(mapContactHistory),
        message_templates: ((templatesResult.data ?? []) as DbRecord[]).map(mapMessageTemplate),
        offers: ((offersResult.data ?? []) as DbRecord[]).map(mapOffer),
        package_templates: packages.length > 0 ? packages : initialPackageTemplates,
        restaurant_photos: ((photosResult.data ?? []) as DbRecord[]).map(mapRestaurantPhoto),
        restaurants: ((restaurantsResult.data ?? []) as DbRecord[]).map(mapRestaurant),
        sales_settings: ((settingsResult.data ?? []) as DbRecord[]).map(mapSalesSetting),
        tasks: ((tasksResult.data ?? []) as DbRecord[]).map(mapSalesTask),
        tour_stops: ((tourStopsResult.data ?? []) as DbRecord[]).map(mapTourStop),
        tours: ((toursResult.data ?? []) as DbRecord[]).map(mapTour),
        users: users.length > 0 ? users : salesUsers
      },
      error: null
    };
  },

  async saveSnapshot(
    supabase: SalesSupabaseClient,
    data: SalesData
  ): Promise<SalesServiceResult<null>> {
    const operations = [];

    if (data.restaurants.length > 0) {
      operations.push(
        supabase.from("restaurants").upsert(data.restaurants.map(toRestaurantRow), {
          onConflict: "id"
        })
      );
    }

    if (data.contact_history.length > 0) {
      operations.push(
        supabase.from("contact_history").upsert(data.contact_history.map(toContactHistoryRow), {
          onConflict: "id"
        })
      );
    }

    if (data.tours.length > 0) {
      operations.push(
        supabase.from("tours").upsert(data.tours.map(toTourRow), {
          onConflict: "id"
        })
      );
    }

    if (data.tour_stops.length > 0) {
      operations.push(
        supabase.from("tour_stops").upsert(data.tour_stops.map(toTourStopRow), {
          onConflict: "id"
        })
      );
    }

    if (data.offers.length > 0) {
      operations.push(
        supabase.from("offers").upsert(data.offers.map(toOfferRow), {
          onConflict: "id"
        })
      );
    }

    if (data.package_templates.length > 0) {
      operations.push(
        supabase.from("service_packages").upsert(data.package_templates.map(toServicePackageRow), {
          onConflict: "id"
        })
      );
    }

    if (data.restaurant_photos.length > 0) {
      operations.push(
        supabase.from("restaurant_photos").upsert(data.restaurant_photos.map(toRestaurantPhotoRow), {
          onConflict: "id"
        })
      );
    }

    if (data.tasks.length > 0) {
      operations.push(
        supabase.from("tasks").upsert(data.tasks.map(toSalesTaskRow), {
          onConflict: "id"
        })
      );
    }

    if (data.message_templates.length > 0) {
      operations.push(
        supabase.from("message_templates").upsert(data.message_templates.map(toMessageTemplateRow), {
          onConflict: "id"
        })
      );
    }

    const results = await Promise.all(operations);
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      return { data: null, error: normalizeSalesError(firstError.message) };
    }

    return { data: null, error: null };
  }
};

export const restaurantsService = {
  async create(
    supabase: SalesSupabaseClient,
    restaurant: Restaurant
  ): Promise<SalesServiceResult<Restaurant>> {
    const { data, error } = await supabase
      .from("restaurants")
      .insert(toRestaurantRow(restaurant))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapRestaurant(data as DbRecord), error: null };
  },

  async update(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<Restaurant>
  ): Promise<SalesServiceResult<Restaurant>> {
    const { data, error } = await supabase
      .from("restaurants")
      .update(toRestaurantPatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapRestaurant(data as DbRecord), error: null };
  },

  async archive(
    supabase: SalesSupabaseClient,
    id: string,
    userId: string
  ): Promise<SalesServiceResult<Restaurant>> {
    return restaurantsService.update(supabase, id, {
      archived: true,
      updated_at: new Date().toISOString(),
      updated_by: userId
    });
  },

  async findDuplicate(
    supabase: SalesSupabaseClient,
    restaurant: Restaurant
  ): Promise<SalesServiceResult<Restaurant | null>> {
    const { data, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("archived", false)
      .ilike("name", restaurant.name)
      .eq("postal_code", restaurant.postal_code || "")
      .eq("city", restaurant.city || "")
      .limit(5);

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    const duplicate =
      ((data ?? []) as DbRecord[])
        .map(mapRestaurant)
        .find((candidate) => {
          const sameAddress =
            normalizeDuplicateText(candidate.street) === normalizeDuplicateText(restaurant.street) &&
            normalizeDuplicateText(candidate.house_number) ===
              normalizeDuplicateText(restaurant.house_number);
          const samePhone =
            Boolean(candidate.phone && restaurant.phone) &&
            normalizeDuplicateText(candidate.phone) === normalizeDuplicateText(restaurant.phone);

          return sameAddress || samePhone;
        }) ?? null;

    return { data: duplicate, error: null };
  }
};

export const contactHistoryService = {
  async create(
    supabase: SalesSupabaseClient,
    entry: ContactHistoryEntry
  ): Promise<SalesServiceResult<ContactHistoryEntry>> {
    const { data, error } = await supabase
      .from("contact_history")
      .insert(toContactHistoryRow(entry))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapContactHistory(data as DbRecord), error: null };
  },

  async getByRestaurant(
    supabase: SalesSupabaseClient,
    restaurantId: string
  ): Promise<SalesServiceResult<ContactHistoryEntry[]>> {
    const { data, error } = await supabase
      .from("contact_history")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapContactHistory), error: null };
  }
};

export const toursService = {
  async getTours(supabase: SalesSupabaseClient): Promise<SalesServiceResult<Tour[]>> {
    const { data, error } = await supabase.from("tours").select("*").order("tour_date");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapTour), error: null };
  },

  async createTour(supabase: SalesSupabaseClient, tour: Tour): Promise<SalesServiceResult<Tour>> {
    const { data, error } = await supabase
      .from("tours")
      .insert(toTourRow(tour))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapTour(data as DbRecord), error: null };
  },

  async updateTour(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<Tour>
  ): Promise<SalesServiceResult<Tour>> {
    const { data, error } = await supabase
      .from("tours")
      .update(toTourPatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapTour(data as DbRecord), error: null };
  }
};

export const offersService = {
  async getOffers(
    supabase: SalesSupabaseClient,
    restaurantId: string
  ): Promise<SalesServiceResult<Offer[]>> {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapOffer), error: null };
  },

  async createOffer(supabase: SalesSupabaseClient, offer: Offer): Promise<SalesServiceResult<Offer>> {
    const { data, error } = await supabase
      .from("offers")
      .insert(toOfferRow(offer))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapOffer(data as DbRecord), error: null };
  },

  async updateOffer(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<Offer>
  ): Promise<SalesServiceResult<Offer>> {
    const { data, error } = await supabase
      .from("offers")
      .update(toOfferPatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapOffer(data as DbRecord), error: null };
  }
};

export const photosService = {
  async getByRestaurant(
    supabase: SalesSupabaseClient,
    restaurantId: string
  ): Promise<SalesServiceResult<RestaurantPhoto[]>> {
    const { data, error } = await supabase
      .from("restaurant_photos")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapRestaurantPhoto), error: null };
  },

  async create(
    supabase: SalesSupabaseClient,
    photo: RestaurantPhoto
  ): Promise<SalesServiceResult<RestaurantPhoto>> {
    const { data, error } = await supabase
      .from("restaurant_photos")
      .insert(toRestaurantPhotoRow(photo))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapRestaurantPhoto(data as DbRecord), error: null };
  },

  async update(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<RestaurantPhoto>
  ): Promise<SalesServiceResult<RestaurantPhoto>> {
    const { data, error } = await supabase
      .from("restaurant_photos")
      .update(toRestaurantPhotoPatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapRestaurantPhoto(data as DbRecord), error: null };
  },

  async remove(supabase: SalesSupabaseClient, photo: RestaurantPhoto): Promise<SalesServiceResult<null>> {
    const storageResult = await supabase.storage
      .from("restaurant-photos")
      .remove([photo.storage_path]);

    if (storageResult.error) {
      return { data: null, error: normalizeSalesError(storageResult.error.message) };
    }

    const { error } = await supabase.from("restaurant_photos").delete().eq("id", photo.id);

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: null, error: null };
  },

  async uploadFile(
    supabase: SalesSupabaseClient,
    path: string,
    file: File
  ): Promise<SalesServiceResult<string>> {
    const { data, error } = await supabase.storage
      .from("restaurant-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: data.path, error: null };
  },

  async createSignedUrl(
    supabase: SalesSupabaseClient,
    path: string,
    expiresInSeconds = 60 * 10
  ): Promise<SalesServiceResult<string>> {
    const { data, error } = await supabase.storage
      .from("restaurant-photos")
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: data.signedUrl, error: null };
  }
};

export const tasksService = {
  async getTasks(supabase: SalesSupabaseClient): Promise<SalesServiceResult<SalesTask[]>> {
    const { data, error } = await supabase.from("tasks").select("*").order("due_at");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapSalesTask), error: null };
  },

  async createTask(supabase: SalesSupabaseClient, task: SalesTask): Promise<SalesServiceResult<SalesTask>> {
    const { data, error } = await supabase
      .from("tasks")
      .insert(toSalesTaskRow(task))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapSalesTask(data as DbRecord), error: null };
  },

  async updateTask(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<SalesTask>
  ): Promise<SalesServiceResult<SalesTask>> {
    const { data, error } = await supabase
      .from("tasks")
      .update(toSalesTaskPatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapSalesTask(data as DbRecord), error: null };
  },

  async completeTask(
    supabase: SalesSupabaseClient,
    id: string,
    userId: string
  ): Promise<SalesServiceResult<SalesTask>> {
    return tasksService.updateTask(supabase, id, {
      completed_at: new Date().toISOString(),
      completed_by: userId,
      status: "completed",
      updated_at: new Date().toISOString()
    });
  }
};

export const messageTemplatesService = {
  async getTemplates(
    supabase: SalesSupabaseClient
  ): Promise<SalesServiceResult<MessageTemplate[]>> {
    const { data, error } = await supabase.from("message_templates").select("*").order("name");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapMessageTemplate), error: null };
  },

  async createTemplate(
    supabase: SalesSupabaseClient,
    template: MessageTemplate
  ): Promise<SalesServiceResult<MessageTemplate>> {
    const { data, error } = await supabase
      .from("message_templates")
      .insert(toMessageTemplateRow(template))
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapMessageTemplate(data as DbRecord), error: null };
  },

  async updateTemplate(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<MessageTemplate>
  ): Promise<SalesServiceResult<MessageTemplate>> {
    const { data, error } = await supabase
      .from("message_templates")
      .update(toMessageTemplatePatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapMessageTemplate(data as DbRecord), error: null };
  },

  async archiveTemplate(
    supabase: SalesSupabaseClient,
    id: string,
    userId: string
  ): Promise<SalesServiceResult<MessageTemplate>> {
    return messageTemplatesService.updateTemplate(supabase, id, {
      is_active: false,
      updated_at: new Date().toISOString(),
      updated_by: userId
    });
  },

  renderTemplate(template: MessageTemplate, variables: Record<string, string>): string {
    return template.body.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_match, key: string) => {
      return variables[key] ?? "";
    });
  }
};

export const statisticsService = {
  async getSummary(supabase: SalesSupabaseClient): Promise<SalesServiceResult<DbRecord[]>> {
    const { data, error } = await supabase.from("sales_statistics_summary").select("*");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: (data ?? []) as DbRecord[], error: null };
  },

  async getConversionFunnel(supabase: SalesSupabaseClient): Promise<SalesServiceResult<DbRecord[]>> {
    const { data, error } = await supabase.from("sales_conversion_funnel").select("*");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: (data ?? []) as DbRecord[], error: null };
  },

  async getRejectionReasons(supabase: SalesSupabaseClient): Promise<SalesServiceResult<DbRecord[]>> {
    const { data, error } = await supabase.from("rejection_reason_summary").select("*");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: (data ?? []) as DbRecord[], error: null };
  }
};

export const storageService = {
  async createSignedUrl(
    supabase: SalesSupabaseClient,
    bucket: "offers" | "restaurant-photos",
    path: string,
    expiresInSeconds = 60 * 10
  ): Promise<SalesServiceResult<string>> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: data.signedUrl, error: null };
  }
};

export const packagesService = {
  async getPackages(
    supabase: SalesSupabaseClient
  ): Promise<SalesServiceResult<ServicePackageTemplate[]>> {
    const { data, error } = await supabase
      .from("service_packages")
      .select("*")
      .order("sort_order");

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: ((data ?? []) as DbRecord[]).map(mapServicePackage), error: null };
  },

  async updatePackage(
    supabase: SalesSupabaseClient,
    id: string,
    patch: Partial<ServicePackageTemplate>
  ): Promise<SalesServiceResult<ServicePackageTemplate>> {
    const { data, error } = await supabase
      .from("service_packages")
      .update(toServicePackagePatchRow(patch))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return { data: null, error: normalizeSalesError(error.message) };
    }

    return { data: mapServicePackage(data as DbRecord), error: null };
  }
};

export function normalizeSalesError(message: string) {
  if (/jwt|auth|permission|policy|rls/i.test(message)) {
    return "Sie haben keine Berechtigung für diese Aktion.";
  }

  if (/network|fetch|failed/i.test(message)) {
    return "Daten konnten nicht geladen werden.";
  }

  return "Die Datenbankaktion konnte nicht abgeschlossen werden.";
}

function mapProfile(row: DbRecord): SalesUser {
  return {
    created_at: toString(row.created_at),
    email: toString(row.email),
    id: toString(row.id),
    name: toString(row.name),
    role: row.role === "admin" ? "admin" : "sales",
    updated_at: toString(row.updated_at)
  };
}

function mapRestaurant(row: DbRecord): Restaurant {
  return {
    archived: Boolean(row.archived),
    category: toString(row.category) as Restaurant["category"],
    city: toString(row.city),
    contact_person: toString(row.contact_person),
    contact_position: toString(row.contact_position),
    created_at: toString(row.created_at),
    created_by: toString(row.created_by),
    digital_presence: (row.digital_presence as Restaurant["digital_presence"]) ?? null,
    email: toString(row.email),
    facebook: toString(row.facebook),
    google_maps_url: toString(row.google_maps_url),
    google_place_id: toString(row.google_place_id),
    google_rating: typeof row.google_rating === "number" ? row.google_rating : null,
    google_review_count: typeof row.google_review_count === "number" ? row.google_review_count : null,
    house_number: toString(row.house_number),
    id: toString(row.id),
    instagram: toString(row.instagram),
    interest_level: typeof row.interest_level === "number" ? row.interest_level : null,
    latitude: toString(row.latitude),
    location_accuracy: toString(row.location_accuracy),
    location_updated_at: toString(row.location_updated_at),
    longitude: toString(row.longitude),
    name: toString(row.name),
    next_contact_at: toString(row.next_contact_at),
    next_contact_type: toString(row.next_contact_type) as Restaurant["next_contact_type"],
    notes: toString(row.notes),
    opening_hours: toStringArray(row.opening_hours),
    phone: toString(row.phone),
    photos: toStringArray(row.photos),
    planned_visit_at: toString(row.planned_visit_at),
    postal_code: toString(row.postal_code),
    rejection_reason: toString(row.rejection_reason),
    responsible_user_id: toString(row.responsible_user_id),
    selected_demo: toString(row.selected_demo) as Restaurant["selected_demo"],
    status: (toString(row.status) || "Neu") as Restaurant["status"],
    street: toString(row.street),
    tiktok: toString(row.tiktok),
    updated_at: toString(row.updated_at),
    updated_by: toString(row.updated_by),
    website: toString(row.website)
  };
}

function mapContactHistory(row: DbRecord): ContactHistoryEntry {
  return {
    action_type: toString(row.action_type) as ContactHistoryEntry["action_type"],
    channel: toString(row.channel) as ContactHistoryEntry["channel"],
    contact_at: toString(row.contact_at),
    contact_person: toString(row.contact_person),
    created_at: toString(row.created_at),
    direction: toString(row.direction) as ContactHistoryEntry["direction"],
    id: toString(row.id),
    message_template_id: toString(row.message_template_id),
    message_text: toString(row.message_text),
    metadata: isRecord(row.metadata) ? row.metadata : undefined,
    next_contact_at: toString(row.next_contact_at),
    new_status: toString(row.new_status) as ContactHistoryEntry["new_status"],
    note: toString(row.note),
    offer_id: toString(row.offer_id),
    old_status: toString(row.old_status) as ContactHistoryEntry["old_status"],
    restaurant_id: toString(row.restaurant_id),
    task_id: toString(row.task_id),
    title: toString(row.title),
    user_id: toString(row.user_id)
  };
}

function mapTour(row: DbRecord): Tour {
  return {
    created_at: toString(row.created_at),
    id: toString(row.id),
    responsible_user_id: toString(row.responsible_user_id),
    status: (toString(row.status) || "Geplant") as Tour["status"],
    tour_date: toString(row.tour_date)
  };
}

function mapTourStop(row: DbRecord): TourStop {
  return {
    id: toString(row.id),
    position: Number(row.position ?? 0),
    restaurant_id: toString(row.restaurant_id),
    status: (toString(row.status) || "Geplant") as TourStop["status"],
    tour_id: toString(row.tour_id),
    visited_at: toString(row.visited_at)
  };
}

function mapOffer(row: DbRecord): Offer {
  return {
    accepted_at: toString(row.accepted_at),
    additional_services: toStringArray(row.additional_services),
    contact_person: toString(row.contact_person),
    created_at: toString(row.created_at),
    created_by: toString(row.created_by),
    discount_amount: toString(row.discount_amount),
    discount_percent: toString(row.discount_percent),
    id: toString(row.id),
    included_services: toStringArray(row.included_services),
    intro_text: toString(row.intro_text),
    monthly_price: toString(row.monthly_price),
    notes: toString(row.notes),
    offer_date: toString(row.offer_date),
    offer_number: toString(row.offer_number),
    package_id: toString(row.package_id),
    package_name: toString(row.package_name),
    payment_terms: toString(row.payment_terms),
    pdf_storage_path: toString(row.pdf_storage_path),
    rejected_at: toString(row.rejected_at),
    restaurant_id: toString(row.restaurant_id),
    sent_at: toString(row.sent_at),
    setup_price: toString(row.setup_price),
    special_requests: toString(row.special_requests),
    status: (toString(row.status) || "Entwurf") as Offer["status"],
    updated_at: toString(row.updated_at),
    valid_until: toString(row.valid_until),
    vat_rate: toString(row.vat_rate)
  };
}

function mapServicePackage(row: DbRecord): ServicePackageTemplate {
  return {
    description: toString(row.description),
    id: toString(row.id),
    name: toString(row.name)
  };
}

function mapRestaurantPhoto(row: DbRecord): RestaurantPhoto {
  return {
    caption: toString(row.caption),
    created_at: toString(row.created_at),
    file_name: toString(row.file_name),
    file_size: typeof row.file_size === "number" ? row.file_size : null,
    id: toString(row.id),
    is_primary: Boolean(row.is_primary),
    mime_type: toString(row.mime_type),
    photo_type: (toString(row.photo_type) || "other") as RestaurantPhoto["photo_type"],
    restaurant_id: toString(row.restaurant_id),
    storage_path: toString(row.storage_path),
    uploaded_by: toString(row.uploaded_by)
  };
}

function mapSalesTask(row: DbRecord): SalesTask {
  return {
    assigned_to: toString(row.assigned_to),
    completed_at: toString(row.completed_at),
    completed_by: toString(row.completed_by),
    created_at: toString(row.created_at),
    created_by: toString(row.created_by),
    description: toString(row.description),
    due_at: toString(row.due_at),
    id: toString(row.id),
    priority: (toString(row.priority) || "normal") as SalesTask["priority"],
    related_offer_id: toString(row.related_offer_id),
    restaurant_id: toString(row.restaurant_id),
    status: (toString(row.status) || "open") as SalesTask["status"],
    task_type: (toString(row.task_type) || "custom") as SalesTask["task_type"],
    title: toString(row.title),
    updated_at: toString(row.updated_at)
  };
}

function mapMessageTemplate(row: DbRecord): MessageTemplate {
  return {
    body: toString(row.body),
    category: toString(row.category) as MessageTemplate["category"],
    channel: (toString(row.channel) || "internal") as MessageTemplate["channel"],
    created_at: toString(row.created_at),
    created_by: toString(row.created_by),
    id: toString(row.id),
    is_active: Boolean(row.is_active),
    name: toString(row.name),
    subject: toString(row.subject),
    updated_at: toString(row.updated_at),
    updated_by: toString(row.updated_by)
  };
}

function mapSalesSetting(row: DbRecord): SalesSetting {
  return {
    id: toString(row.id),
    key: toString(row.key),
    updated_at: toString(row.updated_at),
    updated_by: toString(row.updated_by),
    value: row.value
  };
}

function toRestaurantRow(restaurant: Restaurant): DbRecord {
  return {
    ...restaurant,
    google_rating: restaurant.google_rating,
    google_review_count: restaurant.google_review_count,
    interest_level: restaurant.interest_level,
    latitude: toNullableNumber(restaurant.latitude),
    longitude: toNullableNumber(restaurant.longitude),
    opening_hours: restaurant.opening_hours,
    photos: restaurant.photos
  };
}

function toRestaurantPatchRow(patch: Partial<Restaurant>): DbRecord {
  const row = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

  if ("latitude" in row) {
    row.latitude = toNullableNumber(row.latitude);
  }

  if ("longitude" in row) {
    row.longitude = toNullableNumber(row.longitude);
  }

  return row;
}

function toContactHistoryRow(entry: ContactHistoryEntry): DbRecord {
  return { ...entry };
}

function toTourRow(tour: Tour): DbRecord {
  return { ...tour };
}

function toTourPatchRow(patch: Partial<Tour>): DbRecord {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function toTourStopRow(stop: TourStop): DbRecord {
  return { ...stop };
}

function toOfferRow(offer: Offer): DbRecord {
  return {
    ...offer,
    status: normalizeOfferStatusForDatabase(offer.status)
  };
}

function toOfferPatchRow(patch: Partial<Offer>): DbRecord {
  const row = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

  if ("status" in row) {
    row.status = normalizeOfferStatusForDatabase(row.status as Offer["status"]);
  }

  return row;
}

function toServicePackageRow(
  packageTemplate: ServicePackageTemplate,
  index: number
): DbRecord {
  return {
    description: packageTemplate.description,
    id: packageTemplate.id,
    name: packageTemplate.name,
    sort_order: index,
    updated_at: new Date().toISOString()
  };
}

function toServicePackagePatchRow(patch: Partial<ServicePackageTemplate>): DbRecord {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function toRestaurantPhotoRow(photo: RestaurantPhoto): DbRecord {
  const row: Partial<RestaurantPhoto> = { ...photo };
  delete row.signed_url;
  return row;
}

function toRestaurantPhotoPatchRow(patch: Partial<RestaurantPhoto>): DbRecord {
  const row = { ...patch };
  delete row.signed_url;
  return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined));
}

function toSalesTaskRow(task: SalesTask): DbRecord {
  return { ...task };
}

function toSalesTaskPatchRow(patch: Partial<SalesTask>): DbRecord {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function toMessageTemplateRow(template: MessageTemplate): DbRecord {
  return { ...template };
}

function toMessageTemplatePatchRow(patch: Partial<MessageTemplate>): DbRecord {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
}

function toString(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return "";
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeDuplicateText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = typeof value === "number" ? value : Number(String(value).replace(",", "."));

  return Number.isFinite(numberValue) ? numberValue : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeOfferStatusForDatabase(status: Offer["status"]) {
  if (status === "Entwurf") {
    return "draft";
  }

  if (status === "Gesendet") {
    return "sent";
  }

  if (status === "Angenommen") {
    return "accepted";
  }

  if (status === "Abgelehnt") {
    return "rejected";
  }

  return status;
}
