import { NextResponse } from "next/server";
import { z } from "zod";
import { createProposal } from "@/lib/sales/outreach/proposal";
import { createOutreachAdminClient } from "@/lib/sales/outreach/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
type Context = { params: Promise<{ restaurantId: string }> };
const sendSchema = z.object({ consentEvidence: z.string().trim().min(20).max(2000) }).strict();

async function authorize() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ message: "Supabase fehlt." }, { status: 503 }) };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ message: "Nicht angemeldet." }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["admin", "sales"].includes(profile.role)) {
    return { error: NextResponse.json({ message: "Kein Sales-Zugriff." }, { status: 403 }) };
  }
  return { supabase, role: profile.role, user };
}

export async function GET(_request: Request, context: Context) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  const { restaurantId } = await context.params;
  if (!z.uuid().safeParse(restaurantId).success) return NextResponse.json({ message: "Ungültige ID." }, { status: 400 });
  const { data: restaurant, error: restaurantError } = await auth.supabase!
    .from("restaurants").select("id,name,email,google_maps_url,archived").eq("id", restaurantId).maybeSingle();
  if (restaurantError || !restaurant) return NextResponse.json({ message: "Restaurant nicht gefunden." }, { status: 404 });
  const { data: outreach, error } = await auth.supabase!
    .from("restaurant_outreach").select("*").eq("restaurant_id", restaurantId).maybeSingle();
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({
    outreach,
    proposal: createProposal({ restaurantName: restaurant.name, googleMapsUrl: restaurant.google_maps_url }),
    restaurant: { id: restaurant.id, name: restaurant.name, email: restaurant.email, archived: restaurant.archived },
    canSend: auth.role === "admin"
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: Context) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  if (auth.role !== "admin") return NextResponse.json({ message: "Nur Admins dürfen versenden." }, { status: 403 });
  const { restaurantId } = await context.params;
  if (!z.uuid().safeParse(restaurantId).success) return NextResponse.json({ message: "Ungültige ID." }, { status: 400 });
  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Nachweis der vorherigen ausdrücklichen Einwilligung fehlt (Quelle, Datum, Umfang)." }, { status: 400 });
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OUTREACH_FROM_EMAIL?.trim();
  const replyTo = process.env.OUTREACH_REPLY_TO_EMAIL?.trim();
  const notify = process.env.OUTREACH_NOTIFY_EMAIL?.trim();
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const inboundReady = process.env.OUTREACH_INBOUND_READY === "true";
  const admin = createOutreachAdminClient();
  if (!apiKey || !from || !replyTo || !notify || !webhookSecret || !inboundReady ||
      !z.email().safeParse(from).success || !z.email().safeParse(replyTo).success ||
      !z.email().safeParse(notify).success || !admin) {
    return NextResponse.json({ message: "E-Mail-Versand und Antwortempfang sind noch nicht konfiguriert." }, { status: 503 });
  }
  const { data: restaurant } = await auth.supabase!
    .from("restaurants").select("id,name,email,google_maps_url,archived").eq("id", restaurantId).maybeSingle();
  if (!restaurant || restaurant.archived || !restaurant.email) {
    return NextResponse.json({ message: "Restaurant oder E-Mail fehlt." }, { status: 409 });
  }
  const { data: reserved, error: reserveError } = await auth.supabase!.rpc("reserve_restaurant_outreach_send", {
    p_restaurant_id: restaurantId,
    p_consent_evidence: parsed.data.consentEvidence
  });
  if (reserveError || !reserved) {
    return NextResponse.json({ message: reserveError?.message || "Versand bereits gestartet oder nicht erlaubt." }, { status: 409 });
  }
  const proposal = createProposal({ restaurantName: restaurant.name, googleMapsUrl: restaurant.google_maps_url });
  const payload = {
    from,
    to: [reserved.recipient_email],
    reply_to: replyTo,
    subject: proposal.subject,
    text: proposal.text,
    html: proposal.html
  };
  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `restaurant-outreach-${reserved.send_key}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000)
    });
  } catch {
    await admin.from("restaurant_outreach").update({ status: "send_uncertain", last_error: "Provider response unavailable; reconcile before retry", updated_at: new Date().toISOString() }).eq("restaurant_id", restaurantId).eq("status", "sending");
    return NextResponse.json({ message: "Versandstatus unklar. Kein erneuter automatischer Versand." }, { status: 502 });
  }
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !result.id) {
    await admin.from("restaurant_outreach").update({ status: "send_uncertain", last_error: `Provider HTTP ${response.status}`, updated_at: new Date().toISOString() }).eq("restaurant_id", restaurantId).eq("status", "sending");
    return NextResponse.json({ message: "Provider hat den Versand nicht bestätigt. Bitte prüfen." }, { status: 502 });
  }
  const sentAt = new Date().toISOString();
  const { error: updateError } = await admin.from("restaurant_outreach").update({ status: "sent", provider_email_id: result.id, sent_at: sentAt, updated_at: sentAt, last_error: null }).eq("restaurant_id", restaurantId).eq("status", "sending");
  if (updateError) {
    return NextResponse.json({ message: "E-Mail versandt; CRM-Speicherung fehlgeschlagen. Nicht erneut senden." }, { status: 502 });
  }
  await admin.from("contact_history").insert({
    restaurant_id: restaurantId, user_id: auth.user!.id, action_type: "Angebot gesendet",
    channel: "email", direction: "outgoing", contact_at: sentAt,
    title: proposal.subject, message_text: proposal.text,
    note: "DINEVIO Vorschlag per E-Mail versandt",
    metadata: { provider_email_id: result.id, outreach: true }
  });
  return NextResponse.json({ status: "sent", sentAt }, { headers: { "Cache-Control": "no-store" } });
}
