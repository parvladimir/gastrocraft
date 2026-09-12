import { NextResponse } from "next/server";
import { isAuthFailure, requireRestaurantScout } from "@/lib/agent/restaurant-scout";

export async function GET() {
  const auth = await requireRestaurantScout();
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("restaurants")
    .select(
      "id, name, city, postal_code, website, lead_score, lead_status, visit_status, source_name, source_url, discovered_at, agent_run_id, created_at"
    )
    .eq("created_by", auth.user.id)
    .eq("created_by_agent", true)
    .order("discovered_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "leads_lookup_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ leads: data ?? [] });
}
