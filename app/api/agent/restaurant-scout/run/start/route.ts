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
  const auth = await requireRestaurantScout({ requireBotEnabled: true });
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
  const { data, error } = await auth.supabase
    .from("agent_runs")
    .insert({
      agent_user_id: auth.user.id,
      city: parsed.data.city ?? null,
      max_leads: maxLeads,
      notes: parsed.data.notes ?? null,
      region: parsed.data.region ?? null,
      status: "running"
    })
    .select("*")
    .single();

  if (error || !data) {
    await writeAgentAudit(auth, {
      action: "run.start.failed",
      success: false,
      details: { message: error?.message }
    });
    return NextResponse.json(
      { error: "run_start_failed", message: error?.message ?? "Failed to start run." },
      { status: 500 }
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
