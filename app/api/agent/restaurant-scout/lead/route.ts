import { NextResponse } from "next/server";
import {
  assertLeadRateLimits,
  createLeadSchema,
  findIdempotentResponse,
  getIdempotencyKey,
  hashRequestBody,
  isAuthFailure,
  loadActiveRun,
  mapLeadPayload,
  requireRestaurantScout,
  validationErrorResponse,
  writeAgentAudit
} from "@/lib/agent/restaurant-scout";

export async function POST(request: Request) {
  const auth = await requireRestaurantScout({ requireBotEnabled: true, request });
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const raw = await request.json().catch(() => null);

  // Reject identity / privilege spoofing before schema parse so clients get a clear error.
  const forbidden = [
    "created_by",
    "updated_by",
    "agent_id",
    "role",
    "responsible_user_id",
    "status",
    "archived",
    "planned_visit_at",
    "created_by_agent",
    "source_type",
    "lead_status",
    "visit_status"
  ];
  if (raw && typeof raw === "object") {
    for (const key of forbidden) {
      if (Object.prototype.hasOwnProperty.call(raw, key)) {
        return NextResponse.json(
          {
            error: "forbidden_field",
            message: `Field '${key}' is not allowed.`
          },
          { status: 400 }
        );
      }
    }
  }

  const parsed = createLeadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed.error.flatten()), {
      status: 400
    });
  }

  const idempotencyKey = getIdempotencyKey(request);
  const requestHash = hashRequestBody(parsed.data);
  const path = "/api/agent/restaurant-scout/lead";

  if (idempotencyKey) {
    const { hit, error } = await findIdempotentResponse(auth, idempotencyKey, path);
    if (error) {
      return NextResponse.json(
        { error: "idempotency_lookup_failed", message: error.message },
        { status: 500 }
      );
    }
    if (hit) {
      if (hit.requestHash !== requestHash) {
        return NextResponse.json(
          {
            error: "idempotency_conflict",
            message: "Idempotency-Key reused with a different payload."
          },
          { status: 409 }
        );
      }
      return NextResponse.json(hit.body, { status: hit.status });
    }
  }

  const { run, error: runError } = await loadActiveRun(auth, parsed.data.run_id);
  if (runError) {
    return NextResponse.json(
      { error: "run_lookup_failed", message: runError.message },
      { status: 500 }
    );
  }
  if (!run) {
    return NextResponse.json(
      { error: "run_not_found", message: "Run not found for this agent." },
      { status: 404 }
    );
  }
  if (run.status !== "running") {
    return NextResponse.json(
      { error: "run_not_active", message: "Leads can only be created in a running run." },
      { status: 409 }
    );
  }
  if ((run.leads_created ?? 0) >= (run.max_leads ?? 6)) {
    return NextResponse.json(
      {
        error: "run_lead_limit",
        message: `Run lead limit (${run.max_leads}) reached.`
      },
      { status: 429 }
    );
  }

  const rate = await assertLeadRateLimits(auth, Boolean(parsed.data.email));
  if (!rate.ok) {
    await writeAgentAudit(auth, {
      action: "lead.create.rate_limited",
      runId: parsed.data.run_id,
      success: false,
      details: { message: rate.message }
    });
    return NextResponse.json(
      { error: rate.error, message: rate.message },
      { status: rate.status }
    );
  }

  const leadPayload = {
    ...mapLeadPayload(parsed.data),
    ...(idempotencyKey
      ? { _idempotency_key: idempotencyKey, _request_hash: requestHash }
      : {})
  };
  const { data, error } = await auth.supabase.rpc("create_scout_lead", {
    p_lead: leadPayload,
    p_run_id: parsed.data.run_id
  });

  if (error || !data) {
    const message = error?.message ?? "Lead creation failed.";
    const isDuplicate = /duplicate/i.test(message);
    const isIdempotencyConflict = /Idempotency-Key conflict/i.test(message);
    const isPaused = /Scout paused at 50 total leads/i.test(message);
    const emailSlotsReserved = /Email lead slots reserved/i.test(message);
    await writeAgentAudit(auth, {
      action: "lead.create.failed",
      runId: parsed.data.run_id,
      success: false,
      details: { message }
    });
    let errorCode = "lead_create_failed";
    let status = 400;
    if (isPaused) {
      errorCode = "owner_approval_required";
      status = 409;
    } else if (emailSlotsReserved) {
      errorCode = "email_slots_reserved";
      status = 429;
    } else if (isIdempotencyConflict) {
      errorCode = "idempotency_conflict";
      status = 409;
    } else if (isDuplicate) {
      errorCode = "duplicate";
      status = 409;
    }
    return NextResponse.json({ error: errorCode, message }, { status });
  }

  const body = {
    lead: {
      agent_run_id: data.agent_run_id,
      city: data.city,
      created_by_agent: data.created_by_agent,
      id: data.id,
      lead_score: data.lead_score,
      lead_status: data.lead_status,
      name: data.name,
      source_type: data.source_type,
      visit_status: data.visit_status,
      website: data.website
    }
  };

  await writeAgentAudit(auth, {
    action: "lead.create",
    runId: parsed.data.run_id,
    resourceType: "restaurant",
    resourceId: data.id,
    details: {
      name: data.name,
      city: data.city,
      lead_score: data.lead_score
    }
  });

  return NextResponse.json(body, { status: 201 });
}
