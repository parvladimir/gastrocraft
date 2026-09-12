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
    .select("response_status, response_body, request_hash")
    .eq("agent_user_id", ctx.user.id)
    .eq("idempotency_key", key)
    .maybeSingle();

  if (error) {
    return { hit: null, error };
  }

  if (!data) {
    return { hit: null, error: null };
  }

  return {
    hit: {
      body: data.response_body,
      path,
      requestHash: data.request_hash as string | null,
      status: data.response_status as number
    },
    error: null
  };
}

export async function storeIdempotentResponse(
  ctx: ScoutAuthContext,
  input: {
    body: unknown;
    key: string;
    path: string;
    requestHash: string;
    status: number;
  }
) {
  const { error } = await ctx.supabase.from("agent_idempotency_keys").upsert(
    {
      agent_user_id: ctx.user.id,
      idempotency_key: input.key,
      request_hash: input.requestHash,
      request_path: input.path,
      response_body: input.body as Record<string, unknown>,
      response_status: input.status
    },
    { onConflict: "agent_user_id,idempotency_key" }
  );

  if (error) {
    console.error("idempotency store failed", error.message);
  }
}
