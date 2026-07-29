type PdfLine = {
  size?: number;
  text: string;
  x?: number;
};

const pageWidth = 595;
const pageHeight = 842;

export function createOfferPdf({
  contactName,
  offerNumber,
  packageName,
  restaurantAddress,
  restaurantName,
  setupPrice,
  monthlyPrice,
  validUntil,
  website
}: {
  contactName: string;
  offerNumber: string;
  packageName: string;
  restaurantAddress: string;
  restaurantName: string;
  setupPrice: string;
  monthlyPrice: string;
  validUntil: string;
  website: string;
}) {
  const lines: PdfLine[] = [
    { text: "DINEVIO", size: 28 },
    { text: "Restaurant Digital Solutions", size: 11 },
    { text: "" },
    { text: `Angebot ${offerNumber}`, size: 18 },
    { text: `Restaurant: ${restaurantName}` },
    { text: restaurantAddress },
    { text: contactName ? `Kontakt: ${contactName}` : "" },
    { text: "" },
    { text: `Paket: ${packageName || "-"}`, size: 14 },
    { text: "Enthaltene Leistungen:" },
    { text: "Moderne Website, digitale Speisekarte, mobile Optimierung und persönliche Betreuung." },
    { text: "" },
    { text: `Einmalige Erstellungskosten: ${setupPrice || "-"}` },
    { text: `Monatliche Kosten: ${monthlyPrice || "-"}` },
    { text: `Gültig bis: ${validUntil || "-"}` },
    { text: "" },
    { text: "Die genauen Inhalte und Sonderwünsche werden gemeinsam final abgestimmt." },
    { text: "" },
    { text: "Viele Grüße" },
    { text: "DINEVIO" },
    { text: website }
  ].filter((line) => line.text !== "");

  const content = [
    "BT",
    "/F1 10 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) => {
      const leading = index === 0 ? 0 : -22;
      return [
        `${line.x ?? 0} ${leading} Td`,
        `/F1 ${line.size ?? 11} Tf`,
        `(${escapePdfText(line.text)}) Tj`
      ];
    }),
    "ET"
  ].join("\n");
  const contentObject = pdfObject(4, `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`);
  const objects = [
    pdfObject(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    pdfObject(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    pdfObject(
      3,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`
    ),
    contentObject,
    pdfObject(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
  ];
  const header = "%PDF-1.4\n";
  const offsets: number[] = [0];
  let body = "";

  for (const object of objects) {
    offsets.push(byteLength(header + body));
    body += object;
  }

  const xrefOffset = byteLength(header + body);
  const xref = [
    "xref",
    `0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    "trailer",
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF"
  ].join("\n");

  return Buffer.from(`${header}${body}${xref}`, "binary");
}

function pdfObject(id: number, body: string) {
  return `${id} 0 obj\n${body}\nendobj\n`;
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function byteLength(value: string) {
  return Buffer.byteLength(value, "binary");
}
