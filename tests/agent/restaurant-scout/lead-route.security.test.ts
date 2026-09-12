import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
const maybeSingle = vi.fn();
const single = vi.fn();
const insert = vi.fn(() => ({ select: () => ({ single }) }));
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn((table: string) => {
  if (table === "agent_runs") {
    return { select };
  }
  if (table === "agent_audit_log" || table === "agent_idempotency_keys") {
    return { insert, upsert: vi.fn(async () => ({ error: null })), select };
  }
  if (table === "restaurants") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            gte: async () => ({ count: 0, error: null })
          })
        })
      })
    };
  }
  return { select, insert };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: { user: { id: "bot-user" } },
        error: null
      })
    },
    from,
    rpc
  }))
}));

describe("POST /api/agent/restaurant-scout/lead security", () => {
  beforeEach(() => {
    rpc.mockReset();
    maybeSingle.mockReset();
    single.mockReset();
    from.mockClear();
  });

  it("rejects spoofed identity fields", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: "bot-user",
        role: "restaurant_scout_bot",
        bot_enabled: true,
        name: "Scout",
        email: "bot@x"
      },
      error: null
    });

    // profile lookup uses maybeSingle via from().select().eq().maybeSingle()
    // first call is profile; configure from for profiles
    from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "bot-user",
                  role: "restaurant_scout_bot",
                  bot_enabled: true,
                  name: "Scout",
                  email: "bot@x"
                },
                error: null
              })
            })
          })
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        upsert: async () => ({ error: null })
      };
    });

    const { POST } = await import("@/app/api/agent/restaurant-scout/lead/route");
    const response = await POST(
      new Request("http://localhost/api/agent/restaurant-scout/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          run_id: "11111111-1111-4111-8111-111111111111",
          name: "Cafe",
          lead_score: 40,
          created_by: "victim-user",
          role: "admin"
        })
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("forbidden_field");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects lead outside active run", async () => {
    from.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  id: "bot-user",
                  role: "restaurant_scout_bot",
                  bot_enabled: true,
                  name: "Scout",
                  email: "bot@x"
                },
                error: null
              })
            })
          })
        };
      }
      if (table === "agent_runs") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "11111111-1111-4111-8111-111111111111",
                    agent_user_id: "bot-user",
                    status: "finished",
                    leads_created: 0,
                    max_leads: 3
                  },
                  error: null
                })
              })
            })
          })
        };
      }
      if (table === "agent_audit_log") {
        return { insert: async () => ({ error: null }) };
      }
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              gte: async () => ({ count: 0, error: null })
            })
          })
        }),
        insert: async () => ({ error: null }),
        upsert: async () => ({ error: null })
      };
    });

    const { POST } = await import("@/app/api/agent/restaurant-scout/lead/route");
    const response = await POST(
      new Request("http://localhost/api/agent/restaurant-scout/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          run_id: "11111111-1111-4111-8111-111111111111",
          name: "Cafe",
          lead_score: 40,
          source_url: "https://example.com/cafe",
          website_status: "missing",
          selection_reason: "Active cafe with no own website"
        })
      })
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe("run_not_active");
  });
});
