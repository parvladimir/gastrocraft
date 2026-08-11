import QRCode from "qrcode";
import {
  PDFDocument,
  StandardFonts,
  clip,
  endPath,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage
} from "pdf-lib";

export type PresentationContact = {
  name: string;
  phone: string;
  whatsapp: string;
};

export type PresentationContent = {
  cta: string;
  headline: string;
  intro: string;
  showBenefits: boolean;
  showServices: boolean;
};

export type PresentationPdfInput = {
  category: string;
  contact: PresentationContact;
  demoUrl: string;
  heroImageUrl: string;
  restaurantAddress: string;
  restaurantName: string;
  templateKey: string;
  website: string;
  content: PresentationContent;
};

const A4 = { height: 841.89, width: 595.28 };
const colors = {
  gold: rgb(0.788, 0.635, 0.153),
  goldSoft: rgb(0.935, 0.848, 0.65),
  navy: rgb(0.059, 0.09, 0.165),
  navyCard: rgb(0.09, 0.137, 0.235),
  slate: rgb(0.57, 0.647, 0.737),
  white: rgb(0.98, 0.98, 0.97)
};

export function createPresentationDefaults(restaurantName: string): PresentationContent {
  return {
    cta: "Lassen Sie uns kurz darüber sprechen.",
    headline: `So könnte ${restaurantName || "Ihr Restaurant"} digital auftreten.`,
    intro: "Wir haben bereits eine unverbindliche Website-Demo für Ihr Restaurant vorbereitet.",
    showBenefits: true,
    showServices: true
  };
}

export async function createRestaurantPresentationPdf(input: PresentationPdfInput) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([A4.width, A4.height]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const qrDataUrl = await QRCode.toDataURL(input.demoUrl, {
    color: { dark: "#0F172A", light: "#FFFFFF" },
    errorCorrectionLevel: "H",
    margin: 4,
    width: 720
  });
  const qr = await pdf.embedPng(decodeDataUrl(qrDataUrl));
  const hero = await embedHeroImage(pdf, input.heroImageUrl);

  page.drawRectangle({ color: colors.navy, height: A4.height, width: A4.width, x: 0, y: 0 });
  page.drawRectangle({ color: colors.gold, height: 5, width: A4.width, x: 0, y: A4.height - 5 });

  drawBrand(page, bold);
  drawTopCopy(page, input, bold, serif, font);
  drawDemoVisual(page, hero, qr, input, bold, serif, font);

  let cursorY = 364;
  if (input.content.showBenefits) {
    drawBenefits(page, bold, font, cursorY);
    cursorY -= 132;
  }

  if (input.content.showServices) {
    drawServices(page, bold, font, cursorY);
    cursorY -= 102;
  }

  drawFooter(page, input, bold, font, cursorY);

  const bytes = await pdf.save({ useObjectStreams: false });
  const validation = await validatePresentationPdf(bytes, input);

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  return bytes;
}

export async function validatePresentationPdf(
  bytes: Uint8Array,
  input: Pick<PresentationPdfInput, "contact" | "demoUrl" | "restaurantName">
) {
  if (bytes.byteLength < 1_000) {
    return { message: "PDF-Datei ist leer.", ok: false };
  }

  const document = await PDFDocument.load(bytes);

  if (document.getPageCount() !== 1) {
    return { message: "Das Präsentationsblatt muss genau eine A4-Seite enthalten.", ok: false };
  }

  const page = document.getPage(0);
  const { height, width } = page.getSize();

  if (Math.abs(width - A4.width) > 2 || Math.abs(height - A4.height) > 2) {
    return { message: "Das Präsentationsblatt hat nicht das A4-Format.", ok: false };
  }

  if (!input.demoUrl.startsWith("https://www.dinevio.de/demo/") || !input.restaurantName.trim()) {
    return { message: "Die Demo- oder Restaurantdaten sind nicht vollständig.", ok: false };
  }

  if (!input.contact.name.trim()) {
    return { message: "Ein Ansprechpartner für das Präsentationsblatt fehlt.", ok: false };
  }

  return { message: "", ok: true };
}

function drawBrand(page: PDFPage, bold: PDFFont) {
  page.drawText("DINE", { color: colors.white, font: bold, size: 18, x: 42, y: 798 });
  page.drawText("V", { color: colors.gold, font: bold, size: 18, x: 84, y: 798 });
  page.drawText("IO", { color: colors.white, font: bold, size: 18, x: 96, y: 798 });
  page.drawText("RESTAURANT DIGITAL SOLUTIONS", {
    color: colors.gold,
    font: bold,
    size: 6.8,
    x: 42,
    y: 786
  });
  page.drawText("PERSÖNLICHE IDEE FÜR", {
    color: colors.goldSoft,
    font: bold,
    size: 7.5,
    x: 407,
    y: 798
  });
}

function drawTopCopy(
  page: PDFPage,
  input: PresentationPdfInput,
  bold: PDFFont,
  serif: PDFFont,
  font: PDFFont
) {
  page.drawText(truncate(input.restaurantName, 40), {
    color: colors.white,
    font: bold,
    size: 10,
    x: 407,
    y: 784
  });
  drawLines(page, splitText(input.content.headline, serif, 28, 490, 2), {
    color: colors.white,
    font: serif,
    lineHeight: 31,
    size: 28,
    x: 42,
    y: 740
  });
  page.drawText("Ihr Restaurant. Digital sichtbar.", {
    color: colors.gold,
    font: bold,
    size: 11,
    x: 42,
    y: 665
  });
  drawLines(page, splitText(input.content.intro, font, 11, 255, 3), {
    color: colors.slate,
    font,
    lineHeight: 15,
    size: 11,
    x: 42,
    y: 643
  });
}

function drawDemoVisual(
  page: PDFPage,
  hero: PDFImage | null,
  qr: PDFImage,
  input: PresentationPdfInput,
  bold: PDFFont,
  serif: PDFFont,
  font: PDFFont
) {
  const mockup = { h: 210, w: 292, x: 42, y: 388 };
  const qrCard = { h: 210, w: 172, x: 360, y: 388 };
  page.drawRectangle({
    borderColor: colors.gold,
    borderWidth: 0.8,
    color: colors.navyCard,
    height: mockup.h,
    width: mockup.w,
    x: mockup.x,
    y: mockup.y
  });
  page.drawRectangle({ color: colors.gold, height: 12, width: mockup.w, x: mockup.x, y: mockup.y + mockup.h - 12 });
  page.drawCircle({ color: colors.navy, size: 2.2, x: mockup.x + 9, y: mockup.y + mockup.h - 6 });
  page.drawCircle({ color: colors.navy, size: 2.2, x: mockup.x + 16, y: mockup.y + mockup.h - 6 });
  page.drawCircle({ color: colors.navy, size: 2.2, x: mockup.x + 23, y: mockup.y + mockup.h - 6 });

  if (hero) {
    page.drawRectangle({ color: colors.navy, height: 118, width: mockup.w - 24, x: mockup.x + 12, y: mockup.y + 75 });
    drawCoverImage(page, hero, mockup.x + 12, mockup.y + 75, mockup.w - 24, 118);
  } else {
    page.drawRectangle({ color: colors.goldSoft, height: 118, width: mockup.w - 24, x: mockup.x + 12, y: mockup.y + 75 });
    page.drawText("Live-Demo", { color: colors.navy, font: bold, size: 14, x: mockup.x + 28, y: mockup.y + 126 });
    page.drawText("für Ihr Restaurant", { color: colors.navyCard, font: serif, size: 18, x: mockup.x + 28, y: mockup.y + 102 });
  }

  page.drawText(truncate(input.restaurantName, 28), { color: colors.white, font: bold, size: 12, x: mockup.x + 12, y: mockup.y + 53 });
  page.drawText(truncate(input.category || "Restaurant", 38), { color: colors.slate, font, size: 8, x: mockup.x + 12, y: mockup.y + 39 });
  if (input.restaurantAddress) {
    page.drawText(truncate(input.restaurantAddress, 54), { color: colors.slate, font, size: 6.7, x: mockup.x + 12, y: mockup.y + 28 });
  }
  page.drawRectangle({ color: colors.gold, height: 16, width: 102, x: mockup.x + 12, y: mockup.y + 14 });
  page.drawText("DEMO ÖFFNEN", { color: colors.navy, font: bold, size: 7, x: mockup.x + 29, y: mockup.y + 19 });

  page.drawRectangle({
    borderColor: colors.gold,
    borderWidth: 0.8,
    color: colors.white,
    height: qrCard.h,
    width: qrCard.w,
    x: qrCard.x,
    y: qrCard.y
  });
  page.drawText("PERSÖNLICHE", { color: colors.navy, font: bold, size: 7, x: qrCard.x + 22, y: qrCard.y + 191 });
  page.drawText("LIVE-DEMO", { color: colors.gold, font: bold, size: 11, x: qrCard.x + 22, y: qrCard.y + 176 });
  page.drawImage(qr, { height: 109, width: 109, x: qrCard.x + 31, y: qrCard.y + 55 });
  page.drawText("QR-Code scannen", { color: colors.navy, font: bold, size: 7.6, x: qrCard.x + 34, y: qrCard.y + 40 });
  page.drawText("und direkt ansehen.", { color: colors.navyCard, font, size: 7.2, x: qrCard.x + 31, y: qrCard.y + 29 });
  page.drawText(truncate(input.demoUrl.replace("https://", ""), 34), { color: colors.navyCard, font, size: 5.5, x: qrCard.x + 16, y: qrCard.y + 15 });
}

function drawBenefits(page: PDFPage, bold: PDFFont, font: PDFFont, y: number) {
  const benefits = [
    ["MEHR SICHTBARKEIT", "Professioneller Auftritt für neue Gäste."],
    ["MOBIL PERFEKT", "Wichtige Infos direkt auf dem Smartphone."],
    ["SCHNELL ERREICHBAR", "Anruf, WhatsApp und Route ohne Umwege."],
    ["MEHR VERTRAUEN", "Ein moderner Eindruck vor dem ersten Besuch."]
  ];
  page.drawText("WAS IHR RESTAURANT DAVON HAT", { color: colors.gold, font: bold, size: 8.5, x: 42, y: y + 11 });
  benefits.forEach(([title, text], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 42 + column * 249;
    const cardY = y - 42 - row * 48;
    page.drawRectangle({ borderColor: rgb(0.23, 0.29, 0.39), borderWidth: 0.7, color: colors.navyCard, height: 39, width: 220, x, y: cardY });
    page.drawRectangle({ color: colors.gold, height: 3, width: 3, x: x + 12, y: cardY + 23 });
    page.drawText(title, { color: colors.white, font: bold, size: 7.1, x: x + 22, y: cardY + 24 });
    page.drawText(text, { color: colors.slate, font, size: 6.9, x: x + 12, y: cardY + 11 });
  });
}

function drawServices(page: PDFPage, bold: PDFFont, font: PDFFont, y: number) {
  page.drawRectangle({ color: colors.gold, height: 62, width: 511, x: 42, y: y - 55 });
  page.drawText("Keine Website von der Stange.", { color: colors.navy, font: bold, size: 14, x: 57, y: y - 25 });
  page.drawText("Eine digitale Lösung, die zu Ihrem Restaurant passt.", { color: colors.navyCard, font, size: 8.5, x: 57, y: y - 41 });
  const services = ["Individuelles Webdesign", "Digitale Speisekarte", "Google & lokale Sichtbarkeit", "WhatsApp & Kontakt", "Mobile Optimierung", "Persönliche Betreuung"];
  services.forEach((service, index) => {
    const x = 330 + (index % 2) * 108;
    const row = Math.floor(index / 2);
    page.drawText(`• ${service}`, { color: colors.navy, font: bold, size: 6.8, x, y: y - 18 - row * 14 });
  });
}

function drawFooter(page: PDFPage, input: PresentationPdfInput, bold: PDFFont, font: PDFFont, y: number) {
  const footerY = Math.max(48, y - 74);
  page.drawLine({ color: rgb(0.23, 0.29, 0.39), end: { x: 553, y: footerY + 66 }, start: { x: 42, y: footerY + 66 }, thickness: 0.7 });
  page.drawText(input.content.cta, { color: colors.white, font: bold, size: 12, x: 42, y: footerY + 46 });
  page.drawText("Keine Verpflichtung. Keine lange Präsentation.", { color: colors.slate, font, size: 8.4, x: 42, y: footerY + 31 });
  page.drawText("Ihr Ansprechpartner", { color: colors.gold, font: bold, size: 7.1, x: 42, y: footerY + 14 });
  page.drawText(input.contact.name, { color: colors.white, font: bold, size: 9, x: 42, y: footerY + 2 });
  const contactLine = [input.contact.phone, input.contact.whatsapp ? `WhatsApp ${input.contact.whatsapp}` : ""].filter(Boolean).join(" · ");
  if (contactLine) {
    page.drawText(truncate(contactLine, 57), { color: colors.slate, font, size: 7.3, x: 132, y: footerY + 3 });
  }
  page.drawText(input.website.replace(/^https?:\/\//, ""), { color: colors.goldSoft, font: bold, size: 8.1, x: 429, y: footerY + 3 });
  page.drawText("Unverbindliche Design-Demo – Texte, Bilder, Speisekarte, Preise und Funktionen können individuell angepasst werden.", {
    color: colors.slate,
    font,
    size: 5.8,
    x: 42,
    y: footerY - 15
  });
}

function drawLines(page: PDFPage, lines: string[], options: { color: ReturnType<typeof rgb>; font: PDFFont; lineHeight: number; size: number; x: number; y: number }) {
  lines.forEach((line, index) => page.drawText(line, { color: options.color, font: options.font, size: options.size, x: options.x, y: options.y - index * options.lineHeight }));
}

function splitText(value: string, font: PDFFont, size: number, maxWidth: number, limit: number) {
  const words = safeText(value).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === limit) {
        break;
      }
    } else {
      line = candidate;
    }
  }

  if (line && lines.length < limit) {
    lines.push(line);
  }

  return lines.length > 0 ? lines : ["DINEVIO"];
}

function drawCoverImage(page: PDFPage, image: PDFImage, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;
  page.pushOperators(pushGraphicsState(), rectangle(x, y, width, height), clip(), endPath());
  page.drawImage(image, { height: imageHeight, width: imageWidth, x: x + (width - imageWidth) / 2, y: y + (height - imageHeight) / 2 });
  page.pushOperators(popGraphicsState());
}

async function embedHeroImage(pdf: PDFDocument, heroUrl: string) {
  if (!heroUrl || !/^https?:\/\//.test(heroUrl)) {
    return null;
  }

  try {
    const response = await fetch(heroUrl, { signal: AbortSignal.timeout(4_000) });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || (!contentType.includes("jpeg") && !contentType.includes("png"))) {
      return null;
    }
    const data = await response.arrayBuffer();
    return contentType.includes("png") ? pdf.embedPng(data) : pdf.embedJpg(data);
  } catch {
    return null;
  }
}

function decodeDataUrl(value: string) {
  const [, payload = ""] = value.split(",", 2);
  return Buffer.from(payload, "base64");
}

function safeText(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

function truncate(value: string, limit: number) {
  const text = safeText(value);
  return text.length > limit ? `${text.slice(0, Math.max(1, limit - 1))}…` : text;
}
