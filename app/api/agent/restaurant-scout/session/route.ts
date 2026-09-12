import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SCOUT_ROLE } from "@/lib/agent/restaurant-scout/constants";

const credentialsSchema = z.object({
  email: z.email().max(320),
  password: z.string().min(1).max(1024)
}).strict();

export async function POST(request: Request) {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return NextResponse.json(
      { error: "supabase_not_configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const rawText = await request.text();
  if (rawText.length > 2048) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(rawText);
  } catch {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }
  const parsed = credentialsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 400 });
  }

  const supabase = createClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user || !data.session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, bot_enabled")
    .eq("id", data.user.id)
    .maybeSingle();
  if (profile?.role !== SCOUT_ROLE || profile.bot_enabled !== true) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      access_token: data.session.access_token,
      expires_at: data.session.expires_at
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
