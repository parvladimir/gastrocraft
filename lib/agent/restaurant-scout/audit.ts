import type { ScoutAuthContext } from "./authz";

type AuditInput = {
  action: string;
  details?: Record<string, unknown>;
  resourceId?: string | null;
  resourceType?: string;
  runId?: string | null;
  success?: boolean;
};

function scrubDetails(details: Record<string, unknown> = {}) {
  const blocked = new Set([
    "password",
    "token",
    "access_token",
    "refresh_token",
    "service_role",
    "anon_key",
    "authorization",
    "cookie",
    "secret"
  ]);

  return Object.fromEntries(
    Object.entries(details).filter(([key]) => !blocked.has(key.toLowerCase()))
  );
}

export async function writeAgentAudit(
  ctx: ScoutAuthContext,
  input: AuditInput
) {
  // Successful mutations are logged atomically by the database RPCs. A bot
  // cannot write audit rows directly; failed requests stay in server logs.
  if (input.success === false) {
    console.warn("restaurant scout request failed", {
      action: input.action,
      agentUserId: ctx.user.id,
      details: scrubDetails(input.details),
      resourceId: input.resourceId ?? null,
      runId: input.runId ?? null
    });
  }
}
