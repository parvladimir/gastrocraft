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
  const { error } = await ctx.supabase.from("agent_audit_log").insert({
    action: input.action,
    agent_run_id: input.runId ?? null,
    agent_user_id: ctx.user.id,
    details: scrubDetails(input.details),
    resource_id: input.resourceId ?? null,
    resource_type: input.resourceType ?? null,
    success: input.success ?? true
  });

  if (error) {
    console.error("agent_audit_log insert failed", error.message);
  }
}
