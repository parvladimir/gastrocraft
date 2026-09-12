import { NextResponse } from "next/server";
import {
  duplicateCheckSchema,
  isAuthFailure,
  mapDuplicatePayload,
  requireRestaurantScout,
  validationErrorResponse,
  writeAgentAudit
} from "@/lib/agent/restaurant-scout";

export async function POST(request: Request) {
  const auth = await requireRestaurantScout();
  if (isAuthFailure(auth)) {
    return auth.response;
  }

  const raw = await request.json().catch(() => null);
  const parsed = duplicateCheckSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(validationErrorResponse(parsed.error.flatten()), {
      status: 400
    });
  }

  const payload = mapDuplicatePayload(parsed.data);
  const { data, error } = await auth.supabase.rpc(
    "scout_check_restaurant_duplicate",
    payload
  );

  if (error) {
    await writeAgentAudit(auth, {
      action: "duplicate_check.failed",
      success: false,
      details: { message: error.message }
    });
    return NextResponse.json(
      { error: "duplicate_check_failed", message: error.message },
      { status: 500 }
    );
  }

  const result = (data ?? {
    duplicate: false,
    restaurant_id: null,
    matched_on: null,
    confidence: 0
  }) as {
    confidence: number;
    duplicate: boolean;
    matched_on: string | null;
    restaurant_id: string | null;
  };

  await writeAgentAudit(auth, {
    action: "duplicate_check",
    details: {
      duplicate: result.duplicate,
      matched_on: result.matched_on,
      confidence: result.confidence
    },
    resourceId: result.restaurant_id,
    resourceType: result.duplicate ? "restaurant" : undefined
  });

  return NextResponse.json(result);
}
