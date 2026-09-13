"use client";

import { useEffect, useState } from "react";
import type { Restaurant } from "@/lib/sales-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Outreach = {
  recipient_email: string;
  email_source_url: string | null;
  status: string;
  sent_at: string | null;
  replied_at: string | null;
  wants_demo_at: string | null;
  reply_excerpt: string | null;
  last_error: string | null;
};
type DetailResponse = {
  outreach: Outreach | null;
  proposal: { subject: string; text: string };
  canSend: boolean;
  restaurant: { email: string | null };
  message?: string;
};
const statusLabel: Record<string, string> = {
  draft: "Entwurf · Versand gesperrt", sending: "Versand läuft", sent: "Angebot gesendet",
  replied: "Antwort erhalten", wants_demo: "Kunde möchte Demo", opted_out: "Keine weiteren E-Mails",
  failed: "Versand fehlgeschlagen", send_uncertain: "Versandstatus prüfen"
};

export function RestaurantOutreachPanel({ restaurant }: { restaurant: Restaurant }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [evidence, setEvidence] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    fetch(`/api/sales/outreach/${restaurant.id}`, { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, body: await response.json() as DetailResponse }))
      .then(({ ok, body }) => { if (active) { if (ok) setDetail(body); else setError(body.message || "Outreach konnte nicht geladen werden."); } })
      .catch(() => { if (active) setError("Outreach konnte nicht geladen werden."); });
    return () => { active = false; };
  }, [restaurant.id]);

  async function send() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/sales/outreach/${restaurant.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consentEvidence: evidence })
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) { setError(result.message || "Versand fehlgeschlagen."); return; }
      const refreshed = await fetch(`/api/sales/outreach/${restaurant.id}`, { cache: "no-store" });
      if (refreshed.ok) setDetail(await refreshed.json() as DetailResponse);
      setEvidence("");
    } catch { setError("Verbindung unterbrochen. Bitte Status prüfen, bevor Sie erneut handeln."); }
    finally { setBusy(false); }
  }
  const outreach = detail?.outreach;
  return <section className="rounded-lg border border-white/10 bg-[#101a2c] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.18)]">
    <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">E-Mail Angebot</p>
    <h2 className="mt-2 font-heading text-xl font-semibold">DINEVIO Vorschlag & Antworten</h2>
    <p className="mt-2 text-sm text-slate-400">{outreach ? `${statusLabel[outreach.status] || outreach.status} · ${outreach.recipient_email}` : restaurant.email ? "Entwurf wird geladen" : "Keine E-Mail-Adresse vorhanden"}</p>
    {outreach?.sent_at ? <p className="mt-2 text-sm text-slate-300">Gesendet: {new Date(outreach.sent_at).toLocaleString("de-DE")}</p> : null}
    {outreach?.replied_at ? <p className="mt-1 text-sm text-slate-300">Antwort: {new Date(outreach.replied_at).toLocaleString("de-DE")}</p> : null}
    {outreach?.reply_excerpt ? <div className="mt-4 rounded border border-white/10 bg-midnight/40 p-3 text-sm whitespace-pre-wrap text-slate-200">{outreach.reply_excerpt}</div> : null}
    {outreach?.last_error ? <p className="mt-2 text-sm text-amber-200">{outreach.last_error}</p> : null}
    {detail?.proposal && outreach?.status === "draft" ? <details className="mt-4 rounded border border-white/10 bg-midnight/40 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-premium-gold">Vorschau des Angebots</summary>
      <p className="mt-3 font-semibold">{detail.proposal.subject}</p>
      <p className="mt-3 whitespace-pre-wrap leading-6 text-slate-300">{detail.proposal.text}</p>
    </details> : null}
    {detail?.canSend && outreach?.status === "draft" ? <div className="mt-4 grid gap-3">
      <label className="grid gap-2 text-sm text-slate-300">
        <span>Nachweis einer vorherigen ausdrücklichen Einwilligung (Quelle, Datum und Umfang)</span>
        <textarea className="min-h-24 rounded border border-white/15 bg-midnight/50 p-3" value={evidence} maxLength={2000} onChange={(event) => setEvidence(event.target.value)} />
      </label>
      <p className="text-xs text-slate-400">Eine öffentlich gefundene E-Mail-Adresse ist kein Einwilligungsnachweis. Ohne Nachweis wird kein Werbeangebot verschickt.</p>
      <button className="w-fit rounded bg-premium-gold px-4 py-3 text-sm font-semibold text-midnight disabled:opacity-50" type="button" disabled={busy || evidence.trim().length < 20} onClick={() => void send()}>{busy ? "Senden…" : "Nachgewiesene Einwilligung speichern & Angebot senden"}</button>
    </div> : null}
    {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
  </section>;
}

export function OutreachStatistics() {
  const [counts, setCounts] = useState({ prepared: 0, sent: 0, replied: 0, wantsDemo: 0 });
  const [error, setError] = useState("");
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    let active = true;
    const load = async () => {
      const query = () => supabase.from("restaurant_outreach").select("restaurant_id", { count: "exact", head: true });
      const [prepared, sent, replied, wantsDemo] = await Promise.all([
        query().eq("status", "draft"),
        query().not("sent_at", "is", null),
        query().not("replied_at", "is", null),
        query().not("wants_demo_at", "is", null)
      ]);
      if (!active) return;
      const loadError = prepared.error || sent.error || replied.error || wantsDemo.error;
      if (loadError) { setError(loadError.message); return; }
      setCounts({ prepared: prepared.count || 0, sent: sent.count || 0,
        replied: replied.count || 0, wantsDemo: wantsDemo.count || 0 });
    };
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {[
      ["E-Mail Entwürfe", counts.prepared], ["Angebote per E-Mail gesendet", counts.sent],
      ["Antworten erhalten", counts.replied], ["Demo angefragt", counts.wantsDemo]
    ].map(([label, value]) => <div key={label} className="rounded-lg border border-white/10 bg-[#101a2c] p-5"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 font-heading text-3xl font-semibold">{value}</p></div>)}
    {error ? <p className="text-sm text-red-200">{error}</p> : null}
  </div>;
}
