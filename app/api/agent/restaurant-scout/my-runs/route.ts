import { NextResponse } from "next/server";
import { isAuthFailure, requireRestaurantScout } from "@/lib/agent/restaurant-scout";

export async function GET(request: Request) {
  const auth = await requireRestaurantScout({ request });
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const { data, error } = await auth.supabase
    .from("agent_runs")
    .select(
      "id, status, started_at, finished_at, leads_created, max_leads, city, region, notes, error_message, created_at"
    )
    .eq("agent_user_id", auth.user.id)
    .order("started_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "runs_lookup_failed", message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ runs: data ?? [] });
}
