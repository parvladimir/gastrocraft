import { NextResponse } from "next/server";
import {
  finishRunSchema,
  isAuthFailure,
  loadActiveRun,
  requireRestaurantScout,
  validationErrorResponse,
  writeAgentAudit
} from "@/lib/agent/restaurant-scout";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRestaurantScout({ requireBotEnabled: true });
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const { id } = await context.params;
  const raw = await request.json().catch(() => ({}));
  const parsed = finishRunSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed.error.flatten()), {
      status: 400
    });
  }

  const { run, error: loadError } = await loadActiveRun(auth, id);
  if (loadError) {
    return NextResponse.json(
      { error: "run_lookup_failed", message: loadError.message },
      { status: 500 }
    );
  }

  if (!run) {
    return NextResponse.json(
      { error: "not_found", message: "Run not found." },
      { status: 404 }
    );
  }

  if (run.status !== "running") {
    return NextResponse.json(
      { error: "invalid_state", message: "Only running runs can be finished." },
      { status: 409 }
    );
  }

  const { data, error } = await auth.supabase
    .from("agent_runs")
    .update({
      error_message: parsed.data.error_message ?? null,
      finished_at: new Date().toISOString(),
      status: parsed.data.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .eq("agent_user_id", auth.user.id)
    .eq("status", "running")
    .select("*")
    .single();

  if (error || !data) {
    await writeAgentAudit(auth, {
      action: "run.finish.failed",
      runId: id,
      success: false,
      details: { message: error?.message }
    });
    return NextResponse.json(
      { error: "run_finish_failed", message: error?.message ?? "Failed to finish run." },
      { status: 500 }
    );
  }

  await writeAgentAudit(auth, {
    action: "run.finish",
    runId: id,
    resourceType: "agent_run",
    resourceId: id,
    details: { status: data.status, leads_created: data.leads_created }
  });

  return NextResponse.json({ run: data });
}
