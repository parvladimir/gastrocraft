import { NextResponse } from "next/server";
import { normalizeTemplateKey } from "@/lib/demo-template/config";
import type { DemoTemplateKey } from "@/lib/demo-template/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const demoThemeKeys: DemoTemplateKey[] = [
  "premium-dark",
  "cocktail-neon",
  "imbiss-pro",
  "cafe-minimal",
  "german-gasthaus"
];

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ canSave: false });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ canSave: false });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ canSave: false });
  }

  const { data } = await supabase
    .from("demo_pages")
    .select("id")
    .eq("slug", slug)
    .neq("status", "archived")
    .maybeSingle();

  return NextResponse.json({ canSave: Boolean(data) });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase ist nicht konfiguriert." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Nicht angemeldet." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    slug?: string;
    theme?: string;
  };
  const slug = payload.slug?.trim();
  const theme = normalizeTemplateKey(payload.theme ?? "");

  if (!slug || !demoThemeKeys.includes(theme)) {
    return NextResponse.json({ message: "Ungültige Demo oder Theme." }, { status: 400 });
  }

  const { data: demoPage, error: loadError } = await supabase
    .from("demo_pages")
    .select("id, restaurant_id, status, template_config, template_key, version")
    .eq("slug", slug)
    .neq("status", "archived")
    .maybeSingle();

  if (loadError || !demoPage) {
    return NextResponse.json({ message: "Demo konnte nicht geladen werden." }, { status: 404 });
  }

  const templateConfig =
    demoPage.template_config && typeof demoPage.template_config === "object" && !Array.isArray(demoPage.template_config)
      ? demoPage.template_config
      : {};
  const now = new Date().toISOString();
  const version = Number(demoPage.version ?? 1) + 1;
  const oldTheme = String(demoPage.template_key ?? "");

  const { error: updateError } = await supabase
    .from("demo_pages")
    .update({
      template_config: {
        ...templateConfig,
        theme
      },
      template_key: theme,
      updated_at: now,
      updated_by: user.id,
      version
    })
    .eq("id", demoPage.id);

  if (updateError) {
    return NextResponse.json(
      {
        details: updateError.details,
        hint: updateError.hint,
        message: "Theme konnte nicht gespeichert werden.",
        operation: "demo_pages.update",
        supabaseCode: updateError.code,
        technicalMessage: updateError.message
      },
      { status: 500 }
    );
  }

  await supabase.from("contact_history").insert({
    action_type: "demo_theme_changed",
    contact_at: now,
    created_at: now,
    id: crypto.randomUUID(),
    metadata: {
      new_theme: theme,
      old_theme: oldTheme,
      version
    },
    note: `Demo-Theme geändert: ${oldTheme || "unbekannt"} → ${theme}.`,
    restaurant_id: demoPage.restaurant_id,
    user_id: user.id
  });

  return NextResponse.json({ theme, version });
}
