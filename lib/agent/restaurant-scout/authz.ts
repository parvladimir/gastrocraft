import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SCOUT_ROLE } from "./constants";

export type ScoutProfile = {
  bot_enabled: boolean;
  email: string | null;
  id: string;
  name: string;
  role: string;
};

export type ScoutAuthContext = {
  profile: ScoutProfile;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  user: User;
};

export type ScoutAuthFailure = {
  response: NextResponse;
};

export async function requireRestaurantScout(
  options: { requireBotEnabled?: boolean } = {}
): Promise<ScoutAuthContext | ScoutAuthFailure> {
  const requireBotEnabled = options.requireBotEnabled ?? false;
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      response: NextResponse.json(
        { error: "supabase_not_configured", message: "Supabase is not configured." },
        { status: 503 }
      )
    };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { error: "unauthorized", message: "Authentication required." },
        { status: 401 }
      )
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, role, bot_enabled")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      response: NextResponse.json(
        { error: "forbidden", message: "Scout profile not found." },
        { status: 403 }
      )
    };
  }

  if (profile.role !== SCOUT_ROLE) {
    return {
      response: NextResponse.json(
        { error: "forbidden", message: "restaurant_scout_bot role required." },
        { status: 403 }
      )
    };
  }

  if (requireBotEnabled && profile.bot_enabled === false) {
    return {
      response: NextResponse.json(
        { error: "bot_disabled", message: "Bot is disabled (bot_enabled=false)." },
        { status: 403 }
      )
    };
  }

  return {
    profile: profile as ScoutProfile,
    supabase,
    user
  };
}

export function isAuthFailure(
  value: ScoutAuthContext | ScoutAuthFailure
): value is ScoutAuthFailure {
  return "response" in value;
}
