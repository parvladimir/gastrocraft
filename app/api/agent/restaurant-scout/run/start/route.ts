import { NextResponse } from "next/server";
import {
  assertRunRateLimits,
  isAuthFailure,
  requireRestaurantScout,
  resolveMaxLeadsPerRun,
  startRunSchema,
  validationErrorResponse,
  writeAgentAudit
} from "@/lib/agent/restaurant-scout";

export async function POST(request: Request) {
  const auth = await requireRestaurantScout({ requireBotEnabled: true, request });
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const raw = await request.json().catch(() => null);
  const parsed = startRunSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed.error.flatten()), {
      status: 400
    });
  }

  const rate = await assertRunRateLimits(auth);
  if (!rate.ok) {
    await writeAgentAudit(auth, {
      action: "run.start.rate_limited",
      success: false,
      details: { message: rate.message }
    });
    return NextResponse.json(
      { error: rate.error, message: rate.message },
      { status: rate.status }
    );
  }

  const maxLeads = resolveMaxLeadsPerRun(parsed.data.max_leads);
  const { data, error } = await auth.supabase.rpc("scout_start_run", {
    p_city: parsed.data.city ?? null,
    p_max_leads: maxLeads,
    p_notes: parsed.data.notes ?? null,
    p_region: parsed.data.region ?? null
  });

  if (error || !data) {
    const paused = /Scout paused at 50 total leads/i.test(error?.message ?? "");
    await writeAgentAudit(auth, {
      action: "run.start.failed",
      success: false,
      details: { message: error?.message }
    });
    return NextResponse.json(
      {
        error: paused ? "owner_approval_required" : "run_start_failed",
        message: error?.message ?? "Failed to start run."
      },
      { status: paused ? 409 : 500 }
    );
  }

  await writeAgentAudit(auth, {
    action: "run.start",
    runId: data.id,
    resourceType: "agent_run",
    resourceId: data.id,
    details: { city: data.city, max_leads: data.max_leads }
  });

  return NextResponse.json({ run: data }, { status: 201 });
}
