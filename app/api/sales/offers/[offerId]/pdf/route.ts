import { NextResponse } from "next/server";
import { createOfferPdf } from "@/lib/sales/pdf";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    offerId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const { offerId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    offer?: Record<string, unknown>;
  };

  if (body.offer) {
    await supabase.from("offers").upsert(body.offer, { onConflict: "id" });
  }

  const { data: offer, error: offerError } = await supabase
    .from("offers")
    .select("*")
    .eq("id", offerId)
    .single();

  if (offerError || !offer) {
    return NextResponse.json({ message: "Angebot konnte nicht geladen werden." }, { status: 404 });
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", offer.restaurant_id)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json({ message: "Restaurant konnte nicht geladen werden." }, { status: 404 });
  }

  const offerNumber = offer.offer_number || `DV-${new Date().getFullYear()}-${offer.id.slice(0, 8)}`;
  const pdf = createOfferPdf({
    contactName: offer.contact_person || restaurant.contact_person || "",
    monthlyPrice: offer.monthly_price || "",
    offerNumber,
    packageName: offer.package_name || "",
    restaurantAddress: [restaurant.street, restaurant.house_number, restaurant.postal_code, restaurant.city]
      .filter(Boolean)
      .join(" "),
    restaurantName: restaurant.name || "",
    setupPrice: offer.setup_price || "",
    validUntil: offer.valid_until || "",
    website: "www.dinevio.de"
  });
  const storagePath = `offers/${offer.restaurant_id}/${offerNumber}.pdf`;
  const uploadResult = await supabase.storage.from("offers").upload(storagePath, pdf, {
    contentType: "application/pdf",
    upsert: true
  });

  if (uploadResult.error) {
    return NextResponse.json({ message: "PDF konnte nicht gespeichert werden." }, { status: 500 });
  }

  const { data: updatedOffer, error: updateError } = await supabase
    .from("offers")
    .update({
      offer_number: offerNumber,
      pdf_storage_path: storagePath,
      status: offer.status === "draft" || offer.status === "Entwurf" ? "generated" : offer.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", offer.id)
    .select("*")
    .single();

  if (updateError || !updatedOffer) {
    return NextResponse.json({ message: "Angebot konnte nicht aktualisiert werden." }, { status: 500 });
  }

  await supabase.from("contact_history").insert({
    action_type: "Angebot gesendet",
    contact_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    id: crypto.randomUUID(),
    new_status: restaurant.status,
    note: `PDF erstellt: ${offerNumber}.`,
    offer_id: offer.id,
    old_status: restaurant.status,
    restaurant_id: restaurant.id,
    user_id: user.id
  });

  return NextResponse.json({
    offer: updatedOffer,
    path: storagePath
  });
}
