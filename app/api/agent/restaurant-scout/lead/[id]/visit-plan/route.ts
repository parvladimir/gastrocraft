import { NextResponse } from "next/server";
import {
  isAuthFailure,
  requireRestaurantScout,
  validationErrorResponse,
  visitPlanSchema,
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
  const parsed = visitPlanSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed.error.flatten()), {
      status: 400
    });
  }

  if (raw && typeof raw === "object") {
    if (
      Object.prototype.hasOwnProperty.call(raw, "planned_visit_at") ||
      Object.prototype.hasOwnProperty.call(raw, "tour_id") ||
      Object.prototype.hasOwnProperty.call(raw, "due_at")
    ) {
      return NextResponse.json(
        {
          error: "forbidden_field",
          message: "Visit plan cannot set dates or tours; use to_plan only."
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await auth.supabase.rpc("scout_plan_visit", {
    p_restaurant_id: id
  });

  if (error || !data) {
    await writeAgentAudit(auth, {
      action: "visit_plan.failed",
      resourceType: "restaurant",
      resourceId: id,
      success: false,
      details: { message: error?.message }
    });
    return NextResponse.json(
      {
        error: "visit_plan_failed",
        message: error?.message ?? "Visit plan failed."
      },
      { status: 400 }
    );
  }

  await writeAgentAudit(auth, {
    action: "visit_plan",
    resourceType: "restaurant",
    resourceId: id,
    details: data as Record<string, unknown>
  });

  return NextResponse.json({ result: data });
}
