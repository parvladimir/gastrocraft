export const DINEVIO_URL = "https://www.dinevio.de/";
export const SCHNELL_UND_LECKER_MAPS_URL = "https://maps.app.goo.gl/Euovi4vfygsEgNjk9";
export const SCHNELL_UND_LECKER_DEMO_URL = "http://schnellundlecker.dinevio.de/";
export const SCHNELL_UND_LECKER_PREVIEW_URL = DINEVIO_URL + "images/references/restaurant-demo-desktop.webp";

export type ProposalInput = {
  restaurantName: string;
  googleMapsUrl?: string | null;
};

export function createProposal(input: ProposalInput) {
  const name = input.restaurantName.trim().replace(/\s+/g, " ").slice(0, 150) || "Ihr Restaurant";
  const safeName = escapeHtml(name);
  const mapsUrl = safeGoogleMapsUrl(input.googleMapsUrl);
  const subject = "Eine Website-Idee für " + name + " – mit Live-Beispiel";
  const text = [
    "Guten Tag liebes Team von " + name + ",",
    "",
    "wie wäre es, wenn Gäste Ihre Speisekarte, Öffnungszeiten und den direkten Weg zu Ihnen auf einer eigenen, übersichtlichen Seite finden? Google Maps bleibt dafür ein guter Startpunkt. Eine eigene Website gibt Ihrem Restaurant zusätzlich Raum, sich so zu zeigen, wie Sie es möchten.",
    "",
    "Ein Beispiel aus Dorsten-Wulfen – vergleichen Sie selbst:",
    "Schnell & Lecker auf Google Maps: " + SCHNELL_UND_LECKER_MAPS_URL,
    "Unser fertiges Website-Demo für Schnell & Lecker: " + SCHNELL_UND_LECKER_DEMO_URL,
    "",
    "Das Website-Demo ist ein DINEVIO-Gestaltungsbeispiel, nicht die offizielle Website des Restaurants.",
    "",
    "Wenn Ihnen die Idee gefällt, erstellen wir für " + name + " kostenlos und unverbindlich ein persönliches Demo. Sie erhalten einen Link und können in Ruhe ansehen, wie Ihr eigener Auftritt aussehen könnte. Antworten Sie einfach mit „Demo“ – wir kümmern uns um den Rest.",
    "",
    "Mehr über DINEVIO: " + DINEVIO_URL,
    ...(mapsUrl ? ["Ihr Google-Maps-Eintrag: " + mapsUrl] : []),
    "",
    "Herzliche Grüße",
    "Vladimir Paraschak",
    "DINEVIO",
    "",
    "Impressum: " + DINEVIO_URL + "impressum",
    "Wenn Sie keine weiteren Nachrichten wünschen, antworten Sie bitte mit „Keine E-Mails“."
  ].join("\n");

  // Tables and inline styles keep this readable in Gmail and Outlook, even with remote images blocked.
  const html = [
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>', escapeHtml(subject), '</title></head>',
    '<body style="margin:0;padding:0;background:#f3f0e9;color:#1b2937;font-family:Arial,Helvetica,sans-serif">',
    '<div style="display:none;font-size:1px;line-height:1px;color:#f3f0e9;max-height:0;max-width:0;opacity:0;overflow:hidden">Schnell & Lecker auf Google Maps und als Website-Demo. Auf Wunsch gestalten wir Ihres kostenlos.</div>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#f3f0e9"><tr><td align="center" style="padding:28px 12px 36px">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse:collapse;width:100%;max-width:600px;background:#fff;border:1px solid #e7e0d5">',
    '<tr><td style="height:5px;background:#c69a51;font-size:1px;line-height:5px">&nbsp;</td></tr>',
    '<tr><td style="background:#142235;padding:30px 34px 32px">',
    '<p style="margin:0 0 18px;color:#d5af6c;font-size:13px;font-weight:700;letter-spacing:3px">DINEVIO</p>',
    '<p style="margin:0 0 9px;color:#d5af6c;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Eine Idee für ', safeName, '</p>',
    '<h1 style="margin:0;color:#fff;font-family:Georgia,serif;font-size:32px;font-weight:400;line-height:1.22">Ihr Restaurant.<br>Ihr eigener Auftritt.</h1>',
    '</td></tr><tr><td style="padding:34px 34px 10px">',
    '<p style="margin:0 0 20px;font-size:16px;line-height:25px">Guten Tag liebes Team von <strong>', safeName, '</strong>,</p>',
    '<p style="margin:0 0 20px;font-size:16px;line-height:26px">wie wäre es, wenn Gäste Ihre Speisekarte, Öffnungszeiten und den direkten Weg zu Ihnen auf <strong>einer eigenen, übersichtlichen Seite</strong> finden? Google Maps bleibt dafür ein guter Startpunkt. Eine eigene Website gibt Ihrem Restaurant zusätzlich Raum, sich so zu zeigen, wie Sie es möchten.</p>',
    '<p style="margin:0 0 12px;color:#9a6e31;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Ein Beispiel aus Dorsten-Wulfen</p>',
    '<h2 style="margin:0 0 22px;color:#17283b;font-family:Georgia,serif;font-size:25px;font-weight:400;line-height:32px">Von der Karte zur eigenen Website.</h2>',
    '</td></tr><tr><td style="padding:0 34px">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">',
    '<tr><td style="padding:18px 20px;background:#f6f3ed;border-left:3px solid #d0aa6a">',
    '<p style="margin:0 0 6px;color:#9a6e31;font-size:11px;font-weight:700;letter-spacing:1.5px">01 · HEUTE AUF GOOGLE MAPS</p>',
    '<p style="margin:0 0 10px;color:#17283b;font-family:Georgia,serif;font-size:19px;line-height:25px">Schnell & Lecker finden</p>',
    '<a href="', SCHNELL_UND_LECKER_MAPS_URL, '" style="color:#17435c;font-size:15px;font-weight:700;text-decoration:underline">Google-Maps-Eintrag ansehen →</a>',
    '</td></tr><tr><td style="height:10px;font-size:1px;line-height:10px">&nbsp;</td></tr>',
    '<tr><td style="padding:18px 20px;background:#eef2f0;border-left:3px solid #17435c">',
    '<p style="margin:0 0 6px;color:#17435c;font-size:11px;font-weight:700;letter-spacing:1.5px">02 · ALS DINEVIO-DEMO</p>',
    '<p style="margin:0 0 10px;color:#17283b;font-family:Georgia,serif;font-size:19px;line-height:25px">Schnell & Lecker erleben</p>',
    '<a href="', SCHNELL_UND_LECKER_DEMO_URL, '" style="color:#17435c;font-size:15px;font-weight:700;text-decoration:underline">Fertiges Website-Demo öffnen →</a>',
    '</td></tr></table></td></tr>',
    '<tr><td style="padding:22px 34px 0">',
    '<a href="', SCHNELL_UND_LECKER_DEMO_URL, '" style="text-decoration:none"><img src="', SCHNELL_UND_LECKER_PREVIEW_URL, '" width="532" alt="Vorschau des DINEVIO-Website-Demos für Schnell & Lecker" style="display:block;width:100%;max-width:532px;height:auto;border:0"></a>',
    '<p style="margin:9px 0 0;color:#687387;font-size:12px;line-height:18px">DINEVIO-Gestaltungsbeispiel – keine offizielle Website des Restaurants.</p>',
    '</td></tr><tr><td style="padding:30px 34px 0">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#142235"><tr><td style="padding:27px 27px 28px">',
    '<p style="margin:0 0 8px;color:#d5af6c;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Für ', safeName, '</p>',
    '<h2 style="margin:0 0 12px;color:#fff;font-family:Georgia,serif;font-size:25px;font-weight:400;line-height:31px">Ihr eigenes Demo – kostenlos.</h2>',
    '<p style="margin:0 0 18px;color:#ecf0f3;font-size:15px;line-height:24px">Wenn Ihnen die Idee gefällt, gestalten wir für Ihr Restaurant unverbindlich eine persönliche Vorschau. Sie bekommen einen Link und können in Ruhe sehen, wie Ihr Auftritt aussehen könnte.</p>',
    '<p style="margin:0;color:#fff;font-size:15px;line-height:24px"><strong>Antworten Sie einfach mit „Demo“.</strong> Wir kümmern uns um den Rest.</p>',
    '</td></tr></table>',
    ...(mapsUrl ? ['<p style="margin:20px 0 0;color:#687387;font-size:13px;line-height:20px">P.S. <a href="', escapeHtml(mapsUrl), '" style="color:#17435c;text-decoration:underline">Hier ist auch Ihr Google-Maps-Eintrag</a> – so können Sie die Perspektive Ihrer Gäste direkt vergleichen.</p>'] : []),
    '<p style="margin:28px 0 6px;color:#1b2937;font-size:15px;line-height:24px">Herzliche Grüße<br><strong>Vladimir Paraschak</strong><br>DINEVIO</p>',
    '<p style="margin:0 0 30px;font-size:14px"><a href="', DINEVIO_URL, '" style="color:#17435c;font-weight:700;text-decoration:underline">Mehr über DINEVIO erfahren →</a></p>',
    '</td></tr><tr><td style="padding:20px 34px;background:#f8f6f2;border-top:1px solid #e7e0d5;color:#6a7280;font-size:12px;line-height:19px">',
    '<a href="', DINEVIO_URL, 'impressum" style="color:#596472;text-decoration:underline">Impressum</a><span style="padding:0 8px">·</span>Wenn Sie keine weiteren Nachrichten wünschen, antworten Sie bitte mit „Keine E-Mails“.',
    '</td></tr></table></td></tr></table></body></html>'
  ].join("");
  return { subject, text, html };
}

export function safeGoogleMapsUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /(^|\.)google\.(com|de)$/.test(url.hostname)
      && url.pathname.startsWith("/maps") ? url.toString() : null;
  } catch { return null; }
}

export function classifyReply(text: string) {
  const firstPart = text.split(/\n(?:Am .+schrieb|On .+wrote|Von:|From:)/i)[0].slice(0, 4000).trim();
  const normalized = firstPart.toLocaleLowerCase("de-DE");
  const optedOut = /\b(keine e-mails|keine emails|nicht mehr (anschreiben|kontaktieren)|unsubscribe|abmelden|bitte löschen)\b/i.test(normalized);
  const rejectsDemo = /\b(kein(?:e|en)? demo|demo nicht|nicht.{0,30}demo)\b/i.test(normalized);
  const wantsDemo = !optedOut && !rejectsDemo && /\b(bitte (ein )?demo (schicken|senden|erstellen)|schicken sie (uns )?(bitte )?(ein )?demo|wir (möchten|wollen) (ein )?demo|interesse an (einem )?demo|yes.{0,20}demo)\b/i.test(normalized);
  return { excerpt: firstPart.slice(0, 1000), optedOut, wantsDemo };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] || char);
}
