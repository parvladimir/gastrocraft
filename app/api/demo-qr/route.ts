import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data")?.trim();

  if (!data) {
    return new Response("Missing QR data", { status: 400 });
  }

  const svg = await QRCode.toString(data, {
    color: {
      dark: "#0F172A",
      light: "#FAFAF8"
    },
    errorCorrectionLevel: "M",
    margin: 1,
    type: "svg",
    width: 220
  });

  return new Response(svg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8"
    }
  });
}
