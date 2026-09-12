import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser },
    from
  }))
}));

describe("requireRestaurantScout", () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
    from.mockClear();
  });

  it("returns 401 when user is missing", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    const { requireRestaurantScout, isAuthFailure } = await import(
      "@/lib/agent/restaurant-scout/authz"
    );
    const result = await requireRestaurantScout();
    expect(isAuthFailure(result)).toBe(true);
    if (isAuthFailure(result)) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when role is not scout", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "u1" } },
      error: null
    });
    maybeSingle.mockResolvedValue({
      data: { id: "u1", role: "sales", bot_enabled: true, name: "Sales", email: "s@x" },
      error: null
    });
    const { requireRestaurantScout, isAuthFailure } = await import(
      "@/lib/agent/restaurant-scout/authz"
    );
    const result = await requireRestaurantScout();
    expect(isAuthFailure(result)).toBe(true);
    if (isAuthFailure(result)) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.error).toBe("forbidden");
    }
  });

  it("returns 403 on writes when bot_enabled is false", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "bot1" } },
      error: null
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "bot1",
        role: "restaurant_scout_bot",
        bot_enabled: false,
        name: "Scout",
        email: "bot@x"
      },
      error: null
    });
    const { requireRestaurantScout, isAuthFailure } = await import(
      "@/lib/agent/restaurant-scout/authz"
    );
    const result = await requireRestaurantScout({ requireBotEnabled: true });
    expect(isAuthFailure(result)).toBe(true);
    if (isAuthFailure(result)) {
      expect(result.response.status).toBe(403);
      const body = await result.response.json();
      expect(body.error).toBe("bot_disabled");
    }
  });

  it("allows authenticated scout when enabled", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "bot1" } },
      error: null
    });
    maybeSingle.mockResolvedValue({
      data: {
        id: "bot1",
        role: "restaurant_scout_bot",
        bot_enabled: true,
        name: "Scout",
        email: "bot@x"
      },
      error: null
    });
    const { requireRestaurantScout, isAuthFailure } = await import(
      "@/lib/agent/restaurant-scout/authz"
    );
    const result = await requireRestaurantScout({ requireBotEnabled: true });
    expect(isAuthFailure(result)).toBe(false);
  });
});
