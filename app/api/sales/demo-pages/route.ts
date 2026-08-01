import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeTemplateKey, suggestDemoTemplateKey } from "@/lib/demo-template/config";
import type { DemoTemplateKey } from "@/lib/demo-template/types";

type DemoPagePayload = {
  cuisineType?: string;
  deliveryEnabled?: boolean;
  galleryPhotoIds?: string[];
  heroPhotoId?: string;
  logoPhotoId?: string;
  pickupEnabled?: boolean;
  reservationEnabled?: boolean;
  restaurantId?: string;
  slogan?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  specialOffer?: {
    price?: string;
    text?: string;
    title?: string;
  };
  templateKey?: DemoTemplateKey | "auto";
  useTemplateImages?: boolean;
};

type DbRecord = Record<string, unknown>;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase ist nicht konfiguriert." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Nicht angemeldet." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as DemoPagePayload;
  const restaurantId = payload.restaurantId?.trim() || "";

  if (!restaurantId) {
    return NextResponse.json({ message: "Restaurant fehlt." }, { status: 400 });
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ message: "Restaurant konnte nicht geladen werden." }, { status: 404 });
  }

  if (!toString(restaurant.name)) {
    return NextResponse.json({ message: "Restaurantname fehlt." }, { status: 400 });
  }

  const { data: existingDemo } = await supabase
    .from("demo_pages")
    .select("id, slug, version")
    .eq("restaurant_id", restaurantId)
    .neq("status", "archived")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const slug =
    toString(existingDemo?.slug) ||
    toString(restaurant.custom_demo_slug) ||
    (await createUniqueSlug(supabase, restaurant));
  const demoUrl = new URL(`/demo/${slug}`, request.url).toString();
  const templateKey = resolveTemplateKey(payload.templateKey, restaurant);
  const now = new Date().toISOString();

  const { data: photos } = await supabase
    .from("restaurant_photos")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const selectedPhotos = payload.useTemplateImages
    ? { gallery: [], hero: null, logo: null }
    : selectDemoPhotos((photos || []) as DbRecord[], payload);
  const demoPageId = toString(existingDemo?.id) || crypto.randomUUID();
  const demoAssets = await publishDemoAssets(supabase, demoPageId, selectedPhotos);
  const address = formatAddress(restaurant);
  const content = createDemoContent({
    assets: demoAssets,
    payload,
    restaurant,
    templateKey
  });
  const version = Number(existingDemo?.version || 0) + 1;
  const demoPageRow = {
    address,
    category: toString(restaurant.category),
    city: toString(restaurant.city),
    content,
    created_by: user.id,
    email: toString(restaurant.email),
    gallery_photo_paths: demoAssets.gallery,
    google_maps_url: toString(restaurant.google_maps_url),
    hero_photo_path: demoAssets.hero,
    id: demoPageId,
    instagram: toString(restaurant.instagram),
    legal_config: {},
    logo_photo_path: demoAssets.logo,
    menu_config: {
      is_example: true,
      source: "template"
    },
    menu_items: [],
    opening_hours: toArray(restaurant.opening_hours),
    phone: toString(restaurant.phone),
    postal_code: toString(restaurant.postal_code),
    published: true,
    published_at: now,
    restaurant_id: restaurantId,
    restaurant_name: toString(restaurant.name),
    slug,
    snapshot: content,
    status: "published",
    social_links: {
      facebook: toString(payload.socialLinks?.facebook) || toString(restaurant.facebook),
      instagram: toString(payload.socialLinks?.instagram) || toString(restaurant.instagram),
      tiktok: toString(payload.socialLinks?.tiktok) || toString(restaurant.tiktok)
    },
    special_offer: {
      price: toString(payload.specialOffer?.price),
      text: toString(payload.specialOffer?.text),
      title: toString(payload.specialOffer?.title)
    },
    template: templateKey,
    template_config: {
      cuisineType: toString(payload.cuisineType) || toString(restaurant.category),
      deliveryEnabled: Boolean(payload.deliveryEnabled),
      pickupEnabled: Boolean(payload.pickupEnabled),
      reservationEnabled: Boolean(payload.reservationEnabled),
      slogan: toString(payload.slogan),
      theme: templateKey,
      useTemplateImages: Boolean(payload.useTemplateImages)
    },
    template_key: templateKey,
    updated_at: now,
    updated_by: user.id,
    version,
    website: toString(restaurant.website)
  };

  const writeResult = existingDemo
    ? await supabase.from("demo_pages").update(demoPageRow).eq("id", existingDemo.id)
    : await supabase.from("demo_pages").insert(demoPageRow);

  if (writeResult.error) {
    return NextResponse.json(
      {
        details: writeResult.error.details,
        hint: writeResult.error.hint,
        message: "Demo konnte nicht veröffentlicht werden.",
        operation: existingDemo ? "demo_pages.update" : "demo_pages.insert",
        supabaseCode: writeResult.error.code,
        technicalMessage: writeResult.error.message
      },
      { status: 500 }
    );
  }

  const { data: updatedRestaurant, error: updateError } = await supabase
    .from("restaurants")
    .update({
      custom_demo_slug: slug,
      custom_demo_url: demoUrl,
      generated_demo_at: now,
      selected_demo: "custom",
      updated_at: now,
      updated_by: user.id
    })
    .eq("id", restaurantId)
    .select("*")
    .single();

  if (updateError || !updatedRestaurant) {
    return NextResponse.json(
      {
        details: updateError?.details,
        hint: updateError?.hint,
        message: "Demo wurde veröffentlicht, aber Restaurant konnte nicht aktualisiert werden.",
        operation: "restaurants.update",
        supabaseCode: updateError?.code,
        technicalMessage: updateError?.message
      },
      { status: 500 }
    );
  }

  await supabase.from("contact_history").insert({
    action_type: existingDemo ? "demo_updated" : "demo_created",
    contact_at: now,
    created_at: now,
    id: crypto.randomUUID(),
    metadata: {
      demo_url: demoUrl,
      slug,
      template_key: templateKey,
      version
    },
    new_status: updatedRestaurant.status,
    note: existingDemo ? `Persönliches Demo aktualisiert: ${demoUrl}.` : `Persönliches Demo erstellt: ${demoUrl}.`,
    old_status: restaurant.status,
    restaurant_id: restaurantId,
    user_id: user.id
  });

  return NextResponse.json({
    demoUrl,
    restaurant: updatedRestaurant,
    slug,
    version
  });
}

async function createUniqueSlug(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, restaurant: DbRecord) {
  const base = slugify([restaurant.name, restaurant.city].map(toString).filter(Boolean).join(" ")) || "restaurant";
  let candidate = base.slice(0, 56);
  let suffix = 2;

  while (await slugExists(supabase, candidate)) {
    candidate = `${base.slice(0, 52)}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function slugExists(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  slug: string
) {
  const { data } = await supabase.from("demo_pages").select("id").eq("slug", slug).maybeSingle();
  return Boolean(data);
}

function resolveTemplateKey(templateKey: DemoPagePayload["templateKey"], restaurant: DbRecord): DemoTemplateKey {
  if (templateKey && templateKey !== "auto") {
    return normalizeTemplateKey(templateKey);
  }

  return suggestDemoTemplateKey([restaurant.category, restaurant.name].map(toString).join(" "));
}

function selectDemoPhotos(photos: DbRecord[], payload: DemoPagePayload) {
  const byId = new Map(photos.map((photo) => [toString(photo.id), photo]));
  const primary = photos.find((photo) => Boolean(photo.is_primary)) || photos[0] || null;
  const hero = payload.heroPhotoId ? byId.get(payload.heroPhotoId) : primary;
  const gallery = (payload.galleryPhotoIds || [])
    .map((id) => byId.get(id))
    .filter((photo): photo is DbRecord => Boolean(photo))
    .slice(0, 6);
  const fallbackGallery = photos.filter((photo) => photo.id !== hero?.id).slice(0, 6);
  const logo = payload.logoPhotoId
    ? byId.get(payload.logoPhotoId)
    : photos.find((photo) => toString(photo.photo_type) === "logo");

  return {
    gallery: gallery.length > 0 ? gallery : fallbackGallery,
    hero: hero || null,
    logo: logo || null
  };
}

async function publishDemoAssets(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  demoPageId: string,
  photos: {
    gallery: DbRecord[];
    hero: DbRecord | null;
    logo: DbRecord | null;
  }
) {
  const copied = new Map<string, string>();

  async function copyPhoto(photo: DbRecord | null, role: string) {
    if (!photo) {
      return "";
    }

    const id = toString(photo.id);

    if (copied.has(id)) {
      return copied.get(id) || "";
    }

    const storagePath = toString(photo.storage_path);
    const fileName = toString(photo.file_name) || `${id}.webp`;
    const safeFileName = fileName.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
    const targetPath = `${demoPageId}/${role}-${id}-${safeFileName}`;
    const downloadResult = await supabase.storage.from("restaurant-photos").download(storagePath);

    if (downloadResult.error || !downloadResult.data) {
      return "";
    }

    const uploadResult = await supabase.storage
      .from("demo-assets")
      .upload(targetPath, downloadResult.data, {
        cacheControl: "31536000",
        contentType: toString(photo.mime_type) || undefined,
        upsert: true
      });

    if (uploadResult.error) {
      return "";
    }

    const publicUrl = supabase.storage.from("demo-assets").getPublicUrl(targetPath).data.publicUrl;
    copied.set(id, publicUrl);
    return publicUrl;
  }

  return {
    gallery: (await Promise.all(photos.gallery.map((photo, index) => copyPhoto(photo, `gallery-${index + 1}`)))).filter(Boolean),
    hero: await copyPhoto(photos.hero, "hero"),
    logo: await copyPhoto(photos.logo, "logo")
  };
}

function createDemoContent({
  assets,
  payload,
  restaurant,
  templateKey
}: {
  assets: {
    gallery: string[];
    hero: string;
    logo: string;
  };
  payload: DemoPagePayload;
  restaurant: DbRecord;
  templateKey: DemoTemplateKey;
}) {
  const name = toString(restaurant.name);
  const category = toString(restaurant.category) || "Gastronomie";
  const city = toString(restaurant.city);
  const slogan = toString(payload.slogan) || `Moderner Webauftritt für ${category}${city ? ` in ${city}` : ""}.`;

  return {
    accent: getTemplateAccent(templateKey),
    address: formatAddress(restaurant),
    category,
    city,
    contactPerson: toString(restaurant.contact_person),
    cuisineType: toString(payload.cuisineType) || category,
    deliveryEnabled: Boolean(payload.deliveryEnabled),
    email: toString(restaurant.email),
    facebook: toString(payload.socialLinks?.facebook) || toString(restaurant.facebook),
    galleryPhotos: assets.gallery,
    googleMapsUrl: toString(restaurant.google_maps_url),
    heroPhoto: assets.hero,
    instagram: toString(payload.socialLinks?.instagram) || toString(restaurant.instagram),
    logoPhoto: assets.logo,
    menuItems: [],
    name,
    openingHours: toArray(restaurant.opening_hours),
    phone: toString(restaurant.phone),
    pickupEnabled: Boolean(payload.pickupEnabled),
    postalCode: toString(restaurant.postal_code),
    reservationEnabled: Boolean(payload.reservationEnabled),
    slogan,
    specialOffer: {
      price: toString(payload.specialOffer?.price),
      text: toString(payload.specialOffer?.text),
      title: toString(payload.specialOffer?.title)
    },
    subtitle: slogan,
    templateKey,
    tiktok: toString(payload.socialLinks?.tiktok) || toString(restaurant.tiktok),
    useTemplateImages: Boolean(payload.useTemplateImages),
    website: toString(restaurant.website)
  };
}

function getTemplateAccent(templateKey: DemoTemplateKey) {
  const accents: Record<DemoTemplateKey, string> = {
    "cafe-minimal": "#C69C72",
    "cocktail-neon": "#54F0FF",
    "german-gasthaus": "#B8894D",
    "imbiss-pro": "#FFB703",
    "premium-dark": "#D6B66C"
  };

  return accents[templateKey] || "#C9A227";
}

function formatAddress(restaurant: DbRecord) {
  return [
    [restaurant.street, restaurant.house_number].map(toString).filter(Boolean).join(" "),
    [restaurant.postal_code, restaurant.city].map(toString).filter(Boolean).join(" ")
  ]
    .filter(Boolean)
    .join(", ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
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
