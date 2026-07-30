import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DemoPagePayload = {
  restaurantId?: string;
};

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
  const restaurantId = payload.restaurantId ?? "";

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

  const slug = restaurant.custom_demo_slug || createDemoSlug(restaurant.name, restaurant.id);
  const demoUrl = `/demo/${slug}`;
  const now = new Date().toISOString();
  const snapshot = {
    address: [restaurant.street, restaurant.house_number, restaurant.postal_code, restaurant.city]
      .filter(Boolean)
      .join(" "),
    category: restaurant.category || "Restaurant",
    city: restaurant.city || "",
    contactPerson: restaurant.contact_person || "",
    facebook: restaurant.facebook || "",
    googleMapsUrl: restaurant.google_maps_url || "",
    instagram: restaurant.instagram || "",
    name: restaurant.name || "Restaurant",
    openingHours: Array.isArray(restaurant.opening_hours) ? restaurant.opening_hours : [],
    phone: restaurant.phone || "",
    photos: Array.isArray(restaurant.photos) ? restaurant.photos.slice(0, 6) : [],
    postalCode: restaurant.postal_code || "",
    rating: restaurant.google_rating ?? null,
    reviewCount: restaurant.google_review_count ?? null,
    website: restaurant.website || ""
  };

  const { error: upsertError } = await supabase.from("demo_pages").upsert(
    {
      created_by: user.id,
      published: true,
      restaurant_id: restaurant.id,
      slug,
      snapshot,
      template: "restaurant",
      updated_at: now,
      updated_by: user.id
    },
    {
      onConflict: "slug"
    }
  );

  if (upsertError) {
    return NextResponse.json({ message: "Demo konnte nicht erstellt werden." }, { status: 500 });
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
    .eq("id", restaurant.id)
    .select("*")
    .single();

  if (updateError || !updatedRestaurant) {
    return NextResponse.json({ message: "Demo wurde erstellt, aber Restaurant konnte nicht aktualisiert werden." }, { status: 500 });
  }

  await supabase.from("contact_history").insert({
    action_type: "Demo gesendet",
    contact_at: now,
    created_at: now,
    id: crypto.randomUUID(),
    new_status: updatedRestaurant.status,
    note: `Automatisches Demo erstellt: ${demoUrl}.`,
    old_status: restaurant.status,
    restaurant_id: restaurant.id,
    user_id: user.id
  });

  return NextResponse.json({
    demoUrl,
    restaurant: updatedRestaurant,
    slug
  });
}

function createDemoSlug(name: string, id: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${base || "restaurant"}-${id.slice(0, 8)}`;
}
