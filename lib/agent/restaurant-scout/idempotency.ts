import { createHash } from "crypto";
import type { ScoutAuthContext } from "./authz";

export function getIdempotencyKey(request: Request) {
  const key = request.headers.get("Idempotency-Key")?.trim();
  return key && key.length > 0 && key.length <= 200 ? key : null;
}

export function hashRequestBody(body: unknown) {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}

export async function findIdempotentResponse(
  ctx: ScoutAuthContext,
  key: string,
  path: string
) {
  const { data, error } = await ctx.supabase
    .from("agent_idempotency_keys")
    .select("response_status, response_body, request_hash, request_path")
    .eq("agent_user_id", ctx.user.id)
    .eq("idempotency_key", key)
    .maybeSingle();

  if (error) {
    return { hit: null, error };
  }

  if (!data) {
    return { hit: null, error: null };
  }
  if (data.request_path !== path) {
    return { hit: null, error: new Error("Idempotency-Key belongs to a different path.") };
  }

  return {
    hit: {
      body: data.response_body,
      path: data.request_path,
      requestHash: data.request_hash as string | null,
      status: data.response_status as number
    },
    error: null
  };
}
