import { NextResponse } from "next/server";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-config";
import {
  createPresentationDefaults,
  createRestaurantPresentationPdf,
  type PresentationContent
} from "@/lib/sales/presentation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ restaurantId: string }>;
};

type DbRecord = Record<string, unknown>;

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return messageResponse("Supabase ist nicht konfiguriert.", 503);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return messageResponse("Nicht angemeldet.", 401);
  }

  const { restaurantId } = await context.params;
  const { data: demo } = await supabase
    .from("demo_pages")
    .select("id, slug, version, status")
    .eq("restaurant_id", restaurantId)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: presentation, error } = await supabase
    .from("restaurant_presentations")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("presentation_type", "a4_sales_sheet")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return presentationSchemaError(error);
  }

  const signedUrl = presentation
    ? await createSignedPresentationUrl(supabase, toString(presentation.pdf_storage_path))
    : "";
  const snapshot = toRecord(presentation?.theme_snapshot);
  const demoVersion = Number(demo?.version ?? 0);
  const presentationDemoVersion = Number(snapshot.demo_version ?? 0);

  return NextResponse.json({
    demo: demo
      ? {
          id: demo.id,
          slug: demo.slug,
          url: getAbsoluteUrl(`/demo/${demo.slug}`),
          version: demoVersion
        }
      : null,
    presentation: presentation
      ? {
          ...presentation,
          downloadUrl: signedUrl,
          isStale: Boolean(demoVersion && presentationDemoVersion && demoVersion !== presentationDemoVersion),
          presentationDemoVersion
        }
      : null
  });
}

export async function POST(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return messageResponse("Supabase ist nicht konfiguriert.", 503);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return messageResponse("Nicht angemeldet.", 401);
  }

  const { restaurantId } = await context.params;
  const payload = (await request.json().catch(() => ({}))) as {
    content?: Partial<PresentationContent>;
    responsibleUserId?: string;
  };
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError || !restaurant) {
    return messageResponse("Restaurant konnte nicht geladen werden.", 404);
  }

  const { data: demo, error: demoError } = await supabase
    .from("demo_pages")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("status", "published")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (demoError || !demo) {
    return messageResponse("Für dieses Restaurant muss zuerst ein persönliches Demo erstellt werden.", 409);
  }

  const responsibleId = payload.responsibleUserId?.trim() || toString(restaurant.responsible_user_id) || user.id;
  const { data: responsibleProfile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", responsibleId)
    .maybeSingle();
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .maybeSingle();
  const { data: settings } = await supabase.from("sales_settings").select("key, value");
  const contact = resolvePresentationContact(
    (responsibleProfile as DbRecord | null) || (currentProfile as DbRecord | null),
    (settings ?? []) as DbRecord[]
  );

  if (!contact.name) {
    return messageResponse("Ein Ansprechpartner für das Präsentationsblatt fehlt.", 422);
  }

  const { data: latestPresentation, error: latestError } = await supabase
    .from("restaurant_presentations")
    .select("generated_by, version")
    .eq("restaurant_id", restaurantId)
    .eq("presentation_type", "a4_sales_sheet")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return presentationSchemaError(latestError);
  }

  if (
    latestPresentation &&
    toString(latestPresentation.generated_by) !== user.id &&
    toString(currentProfile?.role) !== "admin"
  ) {
    return messageResponse("Nur der Ersteller oder ein Administrator kann dieses Präsentationsblatt neu generieren.", 403);
  }

  const version = Number(latestPresentation?.version ?? 0) + 1;
  const demoUrl = getAbsoluteUrl(`/demo/${demo.slug}`);
  const defaults = createPresentationDefaults(toString(restaurant.name));
  const content = normalizePresentationContent(defaults, payload.content);
  const templateConfig = toRecord(demo.template_config);
  const templateKey = toString(demo.template_key) || toString(templateConfig.theme) || "german-gasthaus";
  const heroPath = toString(demo.hero_photo_path) || templateHeroUrl(templateKey);
  const now = new Date().toISOString();
  const storagePath = `presentations/${restaurantId}/a4/v${version}/presentation.pdf`;

  let pdf: Uint8Array;
  try {
    pdf = await createRestaurantPresentationPdf({
      category: toString(restaurant.category) || "Restaurant",
      contact,
      content,
      demoUrl,
      heroImageUrl: absoluteAssetUrl(heroPath),
      restaurantAddress: formatAddress(restaurant as DbRecord),
      restaurantName: toString(restaurant.name),
      templateKey,
      website: getWebsiteSetting((settings ?? []) as DbRecord[])
    });
  } catch (error) {
    return messageResponse(error instanceof Error ? error.message : "PDF konnte nicht erstellt werden.", 500);
  }

  const uploadResult = await supabase.storage.from("presentations").upload(storagePath, pdf, {
    cacheControl: "31536000",
    contentType: "application/pdf",
    upsert: false
  });

  if (uploadResult.error) {
    return messageResponse("PDF konnte nicht in der privaten Ablage gespeichert werden.", 500, uploadResult.error);
  }

  const themeSnapshot = {
    content,
    demo_version: Number(demo.version ?? 1),
    generated_from: "restaurant_demo",
    hero_image_url: heroPath,
    template_key: templateKey
  };
  const { data: presentation, error: presentationError } = await supabase
    .from("restaurant_presentations")
    .insert({
      demo_page_id: demo.id,
      demo_url: demoUrl,
      generated_at: now,
      generated_by: user.id,
      pdf_storage_path: storagePath,
      presentation_type: "a4_sales_sheet",
      qr_target_url: demoUrl,
      restaurant_id: restaurantId,
      theme_snapshot: themeSnapshot,
      updated_at: now,
      version
    })
    .select("*")
    .single();

  if (presentationError || !presentation) {
    await supabase.storage.from("presentations").remove([storagePath]);
    return presentationSchemaError(presentationError);
  }

  const historyResult = await supabase.from("contact_history").insert({
    action_type: version > 1 ? "presentation_regenerated" : "presentation_generated",
    contact_at: now,
    created_at: now,
    metadata: {
      demo_version: Number(demo.version ?? 1),
      presentation_id: presentation.id,
      presentation_version: version,
      qr_target_url: demoUrl
    },
    new_status: restaurant.status,
    note: `Präsentationsblatt ${version > 1 ? "neu generiert" : "erstellt"}: Version ${version}.`,
    restaurant_id: restaurantId,
    title: "Präsentationsblatt erstellt",
    user_id: user.id
  });

  if (historyResult.error) {
    return messageResponse("PDF wurde erstellt, aber der Kontaktverlauf konnte nicht aktualisiert werden.", 500, historyResult.error);
  }

  const downloadUrl = await createSignedPresentationUrl(supabase, storagePath);
  return NextResponse.json({
    demoVersion: Number(demo.version ?? 1),
    downloadUrl,
    presentation,
    success: true
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return messageResponse("Supabase ist nicht konfiguriert.", 503);
  }
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return messageResponse("Nicht angemeldet.", 401);
  }

  const payload = (await request.json().catch(() => ({}))) as { action?: string; presentationId?: string };
  const actionLabels: Record<string, string> = {
    downloaded: "presentation_downloaded",
    printed: "presentation_printed",
    shared: "presentation_shared"
  };
  const actionType = actionLabels[payload.action ?? ""];
  if (!actionType) {
    return messageResponse("Ungültige Präsentationsaktion.", 400);
  }

  const { restaurantId } = await context.params;
  const { error } = await supabase.from("contact_history").insert({
    action_type: actionType,
    contact_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    metadata: { presentation_id: payload.presentationId || "" },
    note: "Präsentationsblatt wurde geöffnet.",
    restaurant_id: restaurantId,
    title: "Präsentationsblatt",
    user_id: user.id
  });

  if (error) {
    return messageResponse("Aktivität konnte nicht gespeichert werden.", 500, error);
  }

  return NextResponse.json({ success: true });
}

function normalizePresentationContent(defaults: PresentationContent, input: Partial<PresentationContent> | undefined) {
  return {
    cta: limitedText(input?.cta, defaults.cta, 150),
    headline: limitedText(input?.headline, defaults.headline, 100),
    intro: limitedText(input?.intro, defaults.intro, 240),
    showBenefits: input?.showBenefits !== false,
    showServices: input?.showServices !== false
  };
}

function resolvePresentationContact(profile: DbRecord | null, settings: DbRecord[]) {
  const name = toString(profile?.name) || "DINEVIO";
  const contactData = getSettingRecord(settings, "contact_data");
  const contacts = Array.isArray(contactData.contacts) ? contactData.contacts.map(toRecord) : [];
  const normalizedName = name.toLowerCase();
  const configured = contacts.find((entry) => toString(entry.name).toLowerCase() === normalizedName) ||
    toRecord(contactData[normalizedName]) ||
    toRecord(contactData[name]);

  return {
    name,
    phone: toString(configured.phone) || toString(contactData.phone),
    whatsapp: toString(configured.whatsapp) || toString(configured.phone) || toString(contactData.whatsapp)
  };
}

function getWebsiteSetting(settings: DbRecord[]) {
  const setting = settings.find((entry) => toString(entry.key) === "website");
  const website = typeof setting?.value === "string" ? setting.value : toString(toRecord(setting?.value).url);
  return website || getSiteUrl();
}

function getSettingRecord(settings: DbRecord[], key: string) {
  return toRecord(settings.find((entry) => toString(entry.key) === key)?.value);
}

async function createSignedPresentationUrl(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  storagePath: string
) {
  if (!storagePath) {
    return "";
  }
  const { data } = await supabase.storage.from("presentations").createSignedUrl(storagePath, 60 * 30);
  return data?.signedUrl || "";
}

function absoluteAssetUrl(path: string) {
  if (!path) {
    return "";
  }
  return /^https?:\/\//.test(path) ? path : getAbsoluteUrl(path);
}

function templateHeroUrl(templateKey: string) {
  const paths: Record<string, string> = {
    "cafe-minimal": "/demo-template/assets/img/hero-cafe-minimal.jpg",
    "cocktail-neon": "/demo-template/assets/img/hero-cocktail-neon.jpg",
    "german-gasthaus": "/demo-template/assets/img/hero-german-gasthaus.jpg",
    "imbiss-pro": "/demo-template/assets/img/hero-imbiss-pro.jpg",
    "premium-dark": "/demo-template/assets/img/hero-premium-dark.jpg"
  };
  return paths[templateKey] || paths["german-gasthaus"];
}

function formatAddress(restaurant: DbRecord) {
  return [
    [toString(restaurant.street), toString(restaurant.house_number)].filter(Boolean).join(" "),
    [toString(restaurant.postal_code), toString(restaurant.city)].filter(Boolean).join(" ")
  ]
    .filter(Boolean)
    .join(", ");
}

function limitedText(value: unknown, fallback: string, limit: number) {
  const text = toString(value).replace(/\s+/g, " ").trim();
  return text ? text.slice(0, limit) : fallback;
}

function toRecord(value: unknown): DbRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as DbRecord) : {};
}

function toString(value: unknown) {
  return typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
}

function messageResponse(message: string, status: number, error?: { code?: string | null; details?: string | null; hint?: string | null; message?: string | null } | null) {
  return NextResponse.json(
    {
      details: error?.details || "",
      hint: error?.hint || "",
      message,
      operation: "restaurant_presentations",
      supabaseCode: error?.code || "",
      technicalMessage: error?.message || ""
    },
    { status }
  );
}

function presentationSchemaError(error: { code?: string | null; details?: string | null; hint?: string | null; message?: string | null } | null) {
  return messageResponse("Präsentationsmaterial ist noch nicht eingerichtet. Bitte führen Sie die neue Supabase-Migration aus.", 503, error);
}
