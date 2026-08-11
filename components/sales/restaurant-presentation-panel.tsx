"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Clipboard, Download, ExternalLink, FileText, Printer, RefreshCw, Share2, X } from "lucide-react";
import type { Restaurant, SalesUser } from "@/lib/sales-types";

type PresentationContent = {
  cta: string;
  headline: string;
  intro: string;
  showBenefits: boolean;
  showServices: boolean;
};

type PresentationState = {
  created_at: string;
  downloadUrl: string;
  generated_at: string;
  id: string;
  isStale: boolean;
  presentationDemoVersion: number;
  version: number;
};

type DemoState = {
  id: string;
  slug: string;
  url: string;
  version: number;
};

const defaultContent = (restaurantName: string): PresentationContent => ({
  cta: "Lassen Sie uns kurz darüber sprechen.",
  headline: `So könnte ${restaurantName || "Ihr Restaurant"} digital auftreten.`,
  intro: "Wir haben bereits eine unverbindliche Website-Demo für Ihr Restaurant vorbereitet.",
  showBenefits: true,
  showServices: true
});

export function RestaurantPresentationPanel({
  currentUser,
  onCreateDemo,
  onCopy,
  initialResponsibleUserId,
  restaurantId,
  restaurantName,
  users
}: {
  currentUser: SalesUser;
  onCreateDemo: () => void;
  onCopy: (value: string) => void;
  initialResponsibleUserId: string;
  restaurantId: string;
  restaurantName: string;
  users: SalesUser[];
}) {
  const [demo, setDemo] = useState<DemoState | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [presentation, setPresentation] = useState<PresentationState | null>(null);
  const [content, setContent] = useState<PresentationContent>(() => defaultContent(restaurantName));
  const [responsibleUserId, setResponsibleUserId] = useState(initialResponsibleUserId || currentUser.id);

  const activeResponsibleId = responsibleUserId || currentUser.id;
  const responsibleName = users.find((user) => user.id === activeResponsibleId)?.name || currentUser.name;

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/sales/restaurants/${restaurantId}/presentation`, { cache: "no-store" });
      const payload = (await response.json()) as {
        demo?: DemoState | null;
        message?: string;
        presentation?: PresentationState | null;
      };
      if (!response.ok) {
        setError(payload.message || "Präsentationsmaterial konnte nicht geladen werden.");
        return;
      }
      setDemo(payload.demo ?? null);
      setPresentation(payload.presentation ?? null);
      if (payload.demo) {
        setResponsibleUserId((current) => current || initialResponsibleUserId || currentUser.id);
      }
    } catch {
      setError("Präsentationsmaterial konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
    // The panel remounts when the active restaurant changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  async function generate() {
    if (isGenerating) {
      return;
    }
    setIsGenerating(true);
    setError("");
    try {
      const response = await fetch(`/api/sales/restaurants/${restaurantId}/presentation`, {
        body: JSON.stringify({ content, responsibleUserId: activeResponsibleId }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = (await response.json()) as {
        downloadUrl?: string;
        message?: string;
        presentation?: PresentationState;
      };
      if (!response.ok || !payload.presentation) {
        setError(payload.message || "Präsentationsblatt konnte nicht erstellt werden.");
        return;
      }
      setPresentation({ ...payload.presentation, downloadUrl: payload.downloadUrl || "", isStale: false, presentationDemoVersion: demo?.version || 0 });
      setPreviewOpen(false);
      await load();
    } catch {
      setError("Präsentationsblatt konnte nicht erstellt werden.");
    } finally {
      setIsGenerating(false);
    }
  }

  function openPdf(mode: "open" | "download" | "print") {
    if (!presentation?.downloadUrl) {
      return;
    }
    void logActivity(mode === "download" ? "downloaded" : mode === "print" ? "printed" : "");
    const popup = window.open(presentation.downloadUrl, "_blank");
    if (popup) {
      popup.opener = null;
    }
    if (mode === "print" && popup) {
      window.setTimeout(() => popup.print(), 700);
    }
  }

  async function logActivity(action: "downloaded" | "printed" | "shared" | "") {
    if (!action || !presentation) {
      return;
    }
    await fetch(`/api/sales/restaurants/${restaurantId}/presentation`, {
      body: JSON.stringify({ action, presentationId: presentation.id }),
      headers: { "Content-Type": "application/json" },
      method: "PATCH"
    }).catch(() => undefined);
  }

  function shareDemo() {
    if (!demo) {
      return;
    }
    const message = [
      "Hallo,",
      "",
      `wir haben eine unverbindliche digitale Demo speziell für ${restaurantName} vorbereitet:`,
      "",
      demo.url,
      "",
      "Zusätzlich haben wir eine kurze Übersicht vorbereitet, wie wir Ihren digitalen Auftritt modernisieren könnten.",
      "",
      `Viele Grüße\n${responsibleName}\nDINEVIO\nwww.dinevio.de`
    ].join("\n");
    if (presentation?.downloadUrl) {
      window.open(presentation.downloadUrl, "_blank");
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    void logActivity("shared");
  }

  const status = useMemo(() => {
    if (!demo) {
      return { label: "DEMO FEHLT", tone: "text-orange-200" };
    }
    if (!presentation) {
      return { label: "PRÄSENTATION FEHLT", tone: "text-orange-200" };
    }
    if (presentation.isStale) {
      return { label: "PRÄSENTATION NICHT AKTUELL", tone: "text-amber-200" };
    }
    return { label: "BESUCHSBEREIT", tone: "text-emerald-200" };
  }, [demo, presentation]);

  return (
    <section className="mt-5 rounded-lg border border-premium-gold/30 bg-midnight/50 p-4" aria-labelledby="presentation-heading">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-gold">Präsentationsmaterial</p>
          <h2 id="presentation-heading" className="mt-1 font-heading text-xl font-semibold">Persönliche Präsentation</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {demo
              ? "Ein druckbares A4-Blatt mit persönlicher Live-Demo und QR-Code für den Besuch vor Ort."
              : "Für dieses Restaurant muss zuerst ein persönliches Demo erstellt werden."}
          </p>
        </div>
        <span className={`w-fit rounded border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold ${status.tone}`}>{status.label}</span>
      </div>

      {error ? <p className="mt-4 rounded border border-red-300/35 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</p> : null}
      {isLoading ? <p className="mt-4 text-sm text-slate-400">Präsentationsmaterial wird geladen …</p> : null}

      {!isLoading && !demo ? (
        <button className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded bg-premium-gold px-4 text-sm font-semibold text-midnight transition-colors hover:bg-[#e0b936]" type="button" onClick={onCreateDemo}>
          <FileText aria-hidden="true" className="h-4 w-4" />
          Demo erstellen
        </button>
      ) : null}

      {!isLoading && demo ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-premium-gold px-4 text-sm font-semibold text-midnight transition-colors hover:bg-[#e0b936]" type="button" onClick={() => setPreviewOpen(true)}>
            <FileText aria-hidden="true" className="h-4 w-4" />
            {presentation ? "Neu generieren" : "Präsentationsblatt erstellen"}
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-premium-gold/50 hover:text-premium-gold disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={!presentation?.downloadUrl} onClick={() => openPdf("open")}>
            <ExternalLink aria-hidden="true" className="h-4 w-4" /> PDF ansehen
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-premium-gold/50 hover:text-premium-gold disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={!presentation?.downloadUrl} onClick={() => openPdf("download")}>
            <Download aria-hidden="true" className="h-4 w-4" /> PDF herunterladen
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-premium-gold/50 hover:text-premium-gold disabled:cursor-not-allowed disabled:opacity-45" type="button" disabled={!presentation?.downloadUrl} onClick={() => openPdf("print")}>
            <Printer aria-hidden="true" className="h-4 w-4" /> Drucken
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-premium-gold/50 hover:text-premium-gold" type="button" onClick={() => onCopy(demo.url)}>
            <Clipboard aria-hidden="true" className="h-4 w-4" /> Link kopieren
          </button>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-white/15 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-premium-gold/50 hover:text-premium-gold" type="button" onClick={shareDemo}>
            <Share2 aria-hidden="true" className="h-4 w-4" /> Per WhatsApp senden
          </button>
        </div>
      ) : null}

      {presentation ? (
        <p className="mt-4 text-sm text-slate-400">
          Präsentationsblatt erstellt: {formatDate(presentation.generated_at)} · Version {presentation.version}
          {presentation.isStale ? " · Die Demo wurde danach geändert." : ""}
        </p>
      ) : null}

      {previewOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-midnight/90 p-3 sm:p-6">
          <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="overflow-hidden rounded-lg border border-white/15 bg-[#0f172a] p-3 shadow-2xl sm:p-6">
              <div className="mx-auto aspect-[210/297] w-full max-w-[34rem] bg-[#0f172a] p-5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.4)] sm:p-8">
                <div className="border-t-4 border-premium-gold pt-4">
                  <p className="font-heading text-lg font-semibold">DINE<span className="text-premium-gold">V</span>IO</p>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-premium-gold">Restaurant Digital Solutions</p>
                </div>
                <p className="mt-8 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-premium-gold">Persönliche Idee für {restaurantName}</p>
                <h3 className="mt-3 font-heading text-3xl font-semibold leading-tight sm:text-4xl">{content.headline}</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">{content.intro}</p>
                <div className="mt-6 grid grid-cols-[1.4fr_0.8fr] gap-3">
                  <div className="rounded border border-premium-gold/45 bg-[#14213a] p-3">
                    <div className="h-24 rounded border border-premium-gold/45 bg-[#1b2a45]" />
                    <p className="mt-3 text-sm font-semibold">{restaurantName}</p>
                    <p className="text-xs text-slate-400">Persönliche Live-Demo</p>
                  </div>
                  <div className="rounded border border-premium-gold/45 bg-warm-white p-3 text-midnight">
                    <div className="aspect-square bg-white p-1">
                      <Image src={`/api/demo-qr?data=${encodeURIComponent(demo?.url || "")}`} alt="QR-Code zur persönlichen Live-Demo" width={144} height={144} unoptimized className="h-full w-full" />
                    </div>
                    <p className="mt-2 text-center text-[0.55rem] font-semibold">QR-Code scannen</p>
                  </div>
                </div>
                {content.showBenefits ? <div className="mt-6 grid grid-cols-2 gap-2 text-[0.6rem]"><div className="rounded border border-white/10 p-2"><b className="text-premium-gold">MEHR SICHTBARKEIT</b><br />Professioneller Auftritt für neue Gäste.</div><div className="rounded border border-white/10 p-2"><b className="text-premium-gold">MOBIL PERFEKT</b><br />Alles direkt auf dem Smartphone.</div></div> : null}
                {content.showServices ? <div className="mt-4 rounded bg-premium-gold p-3 text-xs text-midnight"><b>Keine Website von der Stange.</b><br />Eine digitale Lösung, die zu Ihrem Restaurant passt.</div> : null}
                <p className="mt-5 text-xs font-semibold text-premium-gold">{content.cta}</p>
                <p className="mt-2 text-[0.55rem] text-slate-400">Ihr Ansprechpartner: {responsibleName} · www.dinevio.de</p>
              </div>
            </div>
            <aside className="rounded-lg border border-white/12 bg-[#101a2c] p-4 shadow-xl">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-premium-gold">A4 Vorschau</p><h3 className="mt-1 font-heading text-xl font-semibold">Inhalte anpassen</h3></div><button className="rounded border border-white/10 p-2 text-slate-300 hover:text-premium-gold" type="button" aria-label="Vorschau schließen" onClick={() => setPreviewOpen(false)}><X className="h-4 w-4" /></button></div>
              <label className="mt-5 block text-sm font-semibold">Headline<textarea value={content.headline} maxLength={100} onChange={(event) => setContent((current) => ({ ...current, headline: event.target.value }))} className="mt-2 min-h-20 w-full rounded border border-white/15 bg-midnight/60 p-3 text-sm font-normal text-white outline-none focus:border-premium-gold" /></label>
              <label className="mt-4 block text-sm font-semibold">Einleitung<textarea value={content.intro} maxLength={240} onChange={(event) => setContent((current) => ({ ...current, intro: event.target.value }))} className="mt-2 min-h-24 w-full rounded border border-white/15 bg-midnight/60 p-3 text-sm font-normal text-white outline-none focus:border-premium-gold" /></label>
              <label className="mt-4 block text-sm font-semibold">CTA<textarea value={content.cta} maxLength={150} onChange={(event) => setContent((current) => ({ ...current, cta: event.target.value }))} className="mt-2 min-h-16 w-full rounded border border-white/15 bg-midnight/60 p-3 text-sm font-normal text-white outline-none focus:border-premium-gold" /></label>
              <label className="mt-4 block text-sm font-semibold">Ansprechpartner<select value={activeResponsibleId} onChange={(event) => setResponsibleUserId(event.target.value)} className="mt-2 min-h-11 w-full rounded border border-white/15 bg-midnight/60 px-3 text-sm font-normal text-white outline-none focus:border-premium-gold">{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
              <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={content.showBenefits} onChange={(event) => setContent((current) => ({ ...current, showBenefits: event.target.checked }))} /> Nutzenkarten zeigen</label>
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={content.showServices} onChange={(event) => setContent((current) => ({ ...current, showServices: event.target.checked }))} /> Leistungsblock zeigen</label>
              <button disabled={isGenerating} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-premium-gold px-4 text-sm font-semibold text-midnight transition-colors hover:bg-[#e0b936] disabled:opacity-60" type="button" onClick={() => void generate()}>{isGenerating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Wird erstellt …</> : <><FileText className="h-4 w-4" /> Präsentationsblatt erstellen</>}</button>
            </aside>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function VisitReadinessBadge({ restaurant }: { restaurant: Restaurant }) {
  const [presentationState, setPresentationState] = useState<"loading" | "missing" | "ready" | "stale">("loading");
  const hasDemo = restaurant.selected_demo === "custom" && Boolean(restaurant.custom_demo_url);

  useEffect(() => {
    let active = true;
    if (!hasDemo) {
      return () => {
        active = false;
      };
    }

    void fetch(`/api/sales/restaurants/${restaurant.id}/presentation`, { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, payload: (await response.json()) as { presentation?: PresentationState | null } }))
      .then(({ ok, payload }) => {
        if (!active) {
          return;
        }
        if (!ok || !payload.presentation) {
          setPresentationState("missing");
          return;
        }
        setPresentationState(payload.presentation.isStale ? "stale" : "ready");
      })
      .catch(() => {
        if (active) {
          setPresentationState("missing");
        }
      });

    return () => {
      active = false;
    };
  }, [hasDemo, restaurant.id]);

  if (!hasDemo) {
    return <span className="mt-2 inline-flex rounded border border-orange-300/30 bg-orange-400/10 px-2 py-1 text-xs font-semibold text-orange-100">Demo fehlt</span>;
  }

  if (presentationState === "loading") {
    return <span className="mt-2 inline-flex rounded border border-white/10 px-2 py-1 text-xs font-semibold text-slate-400">Vorbereitung wird geprüft …</span>;
  }

  if (presentationState === "ready") {
    return <span className="mt-2 inline-flex rounded border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-100">Besuchsbereit</span>;
  }

  return <span className="mt-2 inline-flex rounded border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-100">{presentationState === "stale" ? "Präsentation nicht aktuell" : "Präsentation fehlt"}</span>;
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(date);
}
