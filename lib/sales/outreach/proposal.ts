export const DINEVIO_URL = "https://www.dinevio.de/";
export const SCHNELL_UND_LECKER_DEMO_URL = "http://schnellundlecker.dinevio.de/";

export type ProposalInput = {
  restaurantName: string;
  googleMapsUrl?: string | null;
};

export function createProposal(input: ProposalInput) {
  const name = input.restaurantName.trim().slice(0, 150);
  const mapsUrl = safeGoogleMapsUrl(input.googleMapsUrl);
  const subject = `Eine Website-Idee für ${name.replace(/[\r\n]+/g, " ")} – mit Live-Beispiel`;
  const comparison = mapsUrl
    ? `Ihr aktueller Eintrag bei Google Maps: ${mapsUrl}\nEin Beispiel für einen eigenen Webauftritt: ${SCHNELL_UND_LECKER_DEMO_URL}`
    : `Ein Beispiel für einen eigenen Webauftritt: ${SCHNELL_UND_LECKER_DEMO_URL}`;
  const text = [
    `Guten Tag liebes Team von ${name},`,
    "",
    "viele Gäste entdecken Restaurants zuerst über Google Maps. Eine eigene Website ergänzt diesen Eintrag: Speisekarte, Bilder, Öffnungszeiten und Kontakt sind dort in Ihrem Stil an einem Ort erreichbar – auch auf dem Smartphone.",
    "",
    comparison,
    "",
    "Schnell & Lecker ist ein Demo-Projekt zur Veranschaulichung, kein Versprechen für Ihren Betrieb. So könnte ein moderner Auftritt mit digitaler Speisekarte und schnellen Wegen zu Anruf, Route und Bestellung aussehen.",
    "",
    `Wenn Sie möchten, gestalten wir unverbindlich ein eigenes Demo für ${name} und schicken Ihnen den Link. Dann sehen Sie vor einer Entscheidung, wie Ihr Restaurant online aussehen könnte. Eine kurze Antwort mit „Demo“ genügt.`,
    "",
    `Mehr über DINEVIO: ${DINEVIO_URL}`,
    "",
    "Viele Grüße",
    "Ihr DINEVIO Team",
    "",
    `Impressum: ${DINEVIO_URL}impressum`,
    "Wenn Sie keine weiteren Nachrichten wünschen, antworten Sie bitte mit „Keine E-Mails“; wir vermerken das sofort."
  ].join("\n");
  const mapsBlock = mapsUrl
    ? `<a href="${escapeHtml(mapsUrl)}" style="color:#d6ad66;text-decoration:underline">Google-Maps-Eintrag ansehen</a><span style="color:#8b96a8;padding:0 10px">→</span>`
    : "";
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f4f1eb;font-family:Arial,Helvetica,sans-serif;color:#182338"><div style="display:none;max-height:0;overflow:hidden">Eine persönliche Website-Idee für ${escapeHtml(name)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1eb;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e5ded1;border-radius:14px;overflow:hidden"><tr><td style="background:#111b2c;padding:28px 34px"><span style="color:#d6ad66;font-size:12px;letter-spacing:3px;font-weight:bold">DINEVIO</span><div style="color:#ffffff;font-size:25px;line-height:1.25;font-weight:bold;margin-top:12px">Ihr Restaurant. Ihr Auftritt.</div></td></tr><tr><td style="padding:34px"><p style="margin:0 0 20px">Guten Tag liebes Team von <strong>${escapeHtml(name)}</strong>,</p><p style="line-height:1.65">Viele Gäste entdecken Restaurants zuerst über Google Maps. Eine eigene Website ergänzt diesen Eintrag: Speisekarte, Bilder, Öffnungszeiten und Kontakt sind dort in Ihrem Stil an einem Ort erreichbar – auch auf dem Smartphone.</p><div style="background:#111b2c;color:#ffffff;border-radius:10px;padding:23px;margin:26px 0"><div style="color:#d6ad66;font-size:11px;font-weight:bold;letter-spacing:2px;margin-bottom:12px">VOM EINTRAG ZUM EIGENEN AUFTRITT</div><div style="line-height:2">${mapsBlock}<a href="${SCHNELL_UND_LECKER_DEMO_URL}" style="color:#d6ad66;text-decoration:underline">Live-Demo Schnell & Lecker ansehen</a></div></div><p style="line-height:1.65">Schnell & Lecker ist ein Demo-Projekt zur Veranschaulichung. So könnte ein moderner Auftritt mit digitaler Speisekarte und schnellen Wegen zu Anruf, Route und Bestellung aussehen.</p><p style="line-height:1.65"><strong>Wir können auch für ${escapeHtml(name)} ein unverbindliches eigenes Demo gestalten</strong> und Ihnen den Link schicken. Dann sehen Sie vor einer Entscheidung, wie Ihr Restaurant online aussehen könnte. Eine kurze Antwort mit <strong>„Demo“</strong> genügt.</p><p style="margin:28px 0"><a href="${DINEVIO_URL}" style="display:inline-block;background:#c69a51;color:#111b2c;padding:13px 20px;border-radius:7px;text-decoration:none;font-weight:bold">DINEVIO kennenlernen</a></p><p style="line-height:1.6">Viele Grüße<br><strong>Ihr DINEVIO Team</strong></p></td></tr><tr><td style="border-top:1px solid #ece6dc;background:#faf8f4;padding:20px 34px;color:#667184;font-size:12px;line-height:1.6"><a href="${DINEVIO_URL}impressum" style="color:#667184">Impressum</a> · Wenn Sie keine weiteren Nachrichten wünschen, antworten Sie bitte mit „Keine E-Mails“; wir vermerken das sofort.</td></tr></table></td></tr></table></body></html>`;
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
