import { describe, expect, it } from "vitest";
import { assertLeadRateLimits } from "@/lib/agent/restaurant-scout/rate-limits";
import type { ScoutAuthContext } from "@/lib/agent/restaurant-scout/authz";

function contextWithCounts(counts: number[]): ScoutAuthContext {
  let query = 0;
  const supabase = {
    from: () => ({
      select: () => {
        const index = query++;
        const builder = {
          eq: () => builder,
          is: () => builder,
          gte: () => builder,
          then: (resolve: (value: { count: number; error: null }) => void) =>
            resolve({ count: counts[index], error: null })
        };
        return builder;
      }
    })
  };
  return {
    supabase,
    user: { id: "scout" },
    profile: { id: "scout", name: "Scout", email: null, role: "restaurant_scout_bot", bot_enabled: true }
  } as unknown as ScoutAuthContext;
}

describe("restaurant scout lead quotas", () => {
  it("reserves the remaining three daily places for sourced-email leads", async () => {
    const counts = [3, 3, 3, 12];
    expect(await assertLeadRateLimits(contextWithCounts(counts), false)).toMatchObject({
      ok: false,
      error: "email_slots_reserved",
      status: 429
    });
    expect(await assertLeadRateLimits(contextWithCounts(counts), true)).toEqual({ ok: true });
  });

  it("blocks all new leads at 50 bot-created restaurants", async () => {
    expect(await assertLeadRateLimits(contextWithCounts([6, 6, 3, 50]), true)).toMatchObject({
      ok: false,
      error: "owner_approval_required",
      status: 409
    });
  });

  it("caps the rolling day at six even when every lead has email", async () => {
    expect(await assertLeadRateLimits(contextWithCounts([2, 6, 0, 20]), true)).toMatchObject({
      ok: false,
      error: "rate_limited",
      status: 429
    });
  });
});
