import { NextRequest, NextResponse } from "next/server";

const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY ?? "";

export async function GET(request: NextRequest) {
  const photoName = request.nextUrl.searchParams.get("name")?.trim() ?? "";

  if (!photoName || !googlePlacesApiKey) {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  url.searchParams.set("maxWidthPx", "360");
  url.searchParams.set("maxHeightPx", "240");
  url.searchParams.set("skipHttpRedirect", "true");
  url.searchParams.set("key", googlePlacesApiKey);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      return new NextResponse(null, { status: 404 });
    }

    const payload = (await response.json()) as { photoUri?: string };

    if (!payload.photoUri) {
      return new NextResponse(null, { status: 404 });
    }

    return NextResponse.redirect(payload.photoUri, 307);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
