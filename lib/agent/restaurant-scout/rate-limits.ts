import {
  MAX_AGENT_LEADS_PER_DAY,
  MAX_AGENT_LEADS_PER_MINUTE,
  MAX_AGENT_LEADS_PER_RUN,
  MAX_AGENT_LEADS_TOTAL,
  MAX_AGENT_LEADS_WITHOUT_EMAIL_PER_DAY,
  MAX_AGENT_RUNS_PER_DAY
} from "./constants";
import type { ScoutAuthContext } from "./authz";

export function resolveMaxLeadsPerRun(requested?: number) {
  const configured = Number.isFinite(MAX_AGENT_LEADS_PER_RUN)
    ? Math.max(1, Math.min(6, MAX_AGENT_LEADS_PER_RUN))
    : 6;
  if (typeof requested !== "number") {
    return configured;
  }
  return Math.max(1, Math.min(configured, requested));
}

export async function assertLeadRateLimits(ctx: ScoutAuthContext, hasEmail: boolean) {
  const now = Date.now();
  const minuteAgo = new Date(now - 60_000).toISOString();
  const dayAgo = new Date(now - 24 * 60 * 60_000).toISOString();

  const [
    { count: minuteCount, error: minuteError },
    { count: dayCount, error: dayError },
    { count: withoutEmailCount, error: withoutEmailError },
    { count: totalCount, error: totalError }
  ] =
    await Promise.all([
      ctx.supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("created_by", ctx.user.id)
        .eq("created_by_agent", true)
        .gte("created_at", minuteAgo),
      ctx.supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("created_by", ctx.user.id)
        .eq("created_by_agent", true)
        .gte("created_at", dayAgo),
      ctx.supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("created_by", ctx.user.id)
        .eq("created_by_agent", true)
        .is("email", null)
        .gte("created_at", dayAgo),
      ctx.supabase
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("created_by_agent", true)
    ]);

  if (minuteError || dayError || withoutEmailError || totalError) {
    return {
      ok: false as const,
      status: 500,
      error: "rate_limit_check_failed",
      message: minuteError?.message ?? dayError?.message ?? withoutEmailError?.message ?? totalError?.message ?? "Rate limit check failed."
    };
  }

  if ((totalCount ?? 0) >= MAX_AGENT_LEADS_TOTAL) {
    return {
      ok: false as const,
      status: 409,
      error: "owner_approval_required",
      message: `Scout paused at ${MAX_AGENT_LEADS_TOTAL} total leads; owner approval required.`
    };
  }

  if ((minuteCount ?? 0) >= MAX_AGENT_LEADS_PER_MINUTE) {
    return {
      ok: false as const,
      status: 429,
      error: "rate_limited",
      message: `Per-minute lead cap (${MAX_AGENT_LEADS_PER_MINUTE}) exceeded.`
    };
  }

  const dailyCap = Number.isFinite(MAX_AGENT_LEADS_PER_DAY)
    ? Math.max(1, Math.min(6, MAX_AGENT_LEADS_PER_DAY))
    : 6;
  if ((dayCount ?? 0) >= dailyCap) {
    return {
      ok: false as const,
      status: 429,
      error: "rate_limited",
      message: `Daily lead cap (${dailyCap}) exceeded.`
    };
  }

  if (!hasEmail && (withoutEmailCount ?? 0) >= MAX_AGENT_LEADS_WITHOUT_EMAIL_PER_DAY) {
    return {
      ok: false as const,
      status: 429,
      error: "email_slots_reserved",
      message: "Three remaining daily lead slots are reserved for verified email leads."
    };
  }

  return { ok: true as const };
}

export async function assertRunRateLimits(ctx: ScoutAuthContext) {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { count, error } = await ctx.supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("agent_user_id", ctx.user.id)
    .gte("started_at", dayAgo);

  if (error) {
    return {
      ok: false as const,
      status: 500,
      error: "rate_limit_check_failed",
      message: error.message
    };
  }

  if ((count ?? 0) >= MAX_AGENT_RUNS_PER_DAY) {
    return {
      ok: false as const,
      status: 429,
      error: "rate_limited",
      message: `Daily run cap (${MAX_AGENT_RUNS_PER_DAY}) exceeded.`
    };
  }

  return { ok: true as const };
}

export async function loadActiveRun(ctx: ScoutAuthContext, runId: string) {
  const { data, error } = await ctx.supabase
    .from("agent_runs")
    .select("*")
    .eq("id", runId)
    .eq("agent_user_id", ctx.user.id)
    .maybeSingle();

  if (error) {
    return { run: null, error };
  }

  return { run: data, error: null };
}
