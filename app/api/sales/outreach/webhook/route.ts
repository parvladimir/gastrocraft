import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { classifyReply } from "@/lib/sales/outreach/proposal";
import { createOutreachAdminClient } from "@/lib/sales/outreach/supabase-admin";
import { getAbsoluteUrl } from "@/lib/site-config";

export const runtime = "nodejs";
type ReceivedEvent = {
  type?: string;
  data?: { email_id?: string; from?: string; to?: string[]; subject?: string };
};
type ReceivedEmail = { from?: string; to?: string[]; subject?: string; text?: string | null; headers?: Record<string, string> };

function verifySignature(body: string, headers: Headers, secret: string) {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp) || !secret.startsWith("whsec_")) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) return false;
  const key = Buffer.from(secret.slice(6), "base64");
  if (key.length < 16) return false;
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(" ").some((part) => {
    const [version, value] = part.split(",");
    if (version !== "v1" || !value) return false;
    const received = Buffer.from(value, "base64");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const replyTo = process.env.OUTREACH_REPLY_TO_EMAIL?.trim().toLowerCase();
  const admin = createOutreachAdminClient();
  if (!secret || !apiKey || !replyTo || !admin) return NextResponse.json({ message: "Webhook not configured" }, { status: 503 });
  const body = await request.text();
  if (body.length > 64_000 || !verifySignature(body, request.headers, secret)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }
  let event: ReceivedEvent;
  try { event = JSON.parse(body) as ReceivedEvent; } catch { return NextResponse.json({ message: "Invalid JSON" }, { status: 400 }); }
  if (event.type !== "email.received") return NextResponse.json({ ignored: true });
  const emailId = event.data?.email_id;
  if (!emailId || !/^[0-9a-f-]{36}$/i.test(emailId)) return NextResponse.json({ message: "Invalid email id" }, { status: 400 });
  if (!event.data?.to?.some((address) => address.toLowerCase() === replyTo)) return NextResponse.json({ ignored: true });
  const providerResponse = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(10000)
  });
  if (!providerResponse.ok) return NextResponse.json({ message: "Could not retrieve email" }, { status: 502 });
  const message = await providerResponse.json() as ReceivedEmail;
  const sender = message.from?.trim().toLowerCase();
  if (!sender || !message.to?.some((address) => address.toLowerCase() === replyTo)) return NextResponse.json({ ignored: true });
  const { data: matches, error: lookupError } = await admin.from("restaurant_outreach")
    .select("restaurant_id,status,recipient_email,sent_at")
    .eq("recipient_email", sender).not("sent_at", "is", null).limit(2);
  if (lookupError) return NextResponse.json({ message: "CRM lookup failed" }, { status: 500 });
  if (!matches || matches.length !== 1) return NextResponse.json({ ignored: "no unique sent outreach" });
  const row = matches[0];
  const classified = classifyReply(message.text || message.subject || "");
  const newStatus = classified.optedOut ? "opted_out" : classified.wantsDemo ? "wants_demo" : "replied";
  const { error: recordError } = await admin.rpc("record_restaurant_outreach_reply", {
    p_restaurant_id: row.restaurant_id, p_provider_email_id: emailId,
    p_status: newStatus, p_excerpt: classified.excerpt,
    p_subject: message.subject || "Antwort auf DINEVIO Angebot"
  });
  if (recordError) return NextResponse.json({ message: "Could not record reply" }, { status: 500 });
  const { data: existingEvent } = await admin.from("outreach_inbound_events")
    .select("notification_sent_at").eq("provider_email_id", emailId).maybeSingle();
  if (!existingEvent?.notification_sent_at) {
    const notifyAddress = process.env.OUTREACH_NOTIFY_EMAIL?.trim();
    const notifyFrom = process.env.OUTREACH_FROM_EMAIL?.trim();
    if (notifyAddress && notifyFrom) {
      const { data: restaurant } = await admin.from("restaurants").select("name").eq("id", row.restaurant_id).maybeSingle();
      const notification = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `outreach-reply-${emailId}` },
        body: JSON.stringify({ from: notifyFrom, to: [notifyAddress], subject: `${classified.wantsDemo ? "Demo angefragt" : "Antwort erhalten"}: ${restaurant?.name || sender}`,
          text: `Restaurant: ${restaurant?.name || row.restaurant_id}\nVon: ${sender}\nStatus: ${newStatus}\n\n${classified.excerpt}\n\nSales: ${getAbsoluteUrl("/sales")}` }),
        signal: AbortSignal.timeout(10000)
      }).catch(() => null);
      if (!notification?.ok) return NextResponse.json({ message: "Notification failed" }, { status: 502 });
      await admin.from("outreach_inbound_events").update({ notification_sent_at: new Date().toISOString() }).eq("provider_email_id", emailId);
    }
  }
  return NextResponse.json({ processed: true });
}
