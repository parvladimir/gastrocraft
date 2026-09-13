import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "scout-id" } } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { role: "restaurant_scout_bot" } }) }) }) })
  })
}));

describe("outreach authorization", () => {
  it("never lets the scout read proposals or send email", async () => {
    const { GET, POST } = await import("@/app/api/sales/outreach/[restaurantId]/route");
    const context = { params: Promise.resolve({ restaurantId: "11111111-1111-4111-8111-111111111111" }) };
    const get = await GET(new Request("http://localhost/api/sales/outreach/1"), context);
    const post = await POST(new Request("http://localhost/api/sales/outreach/1", { method: "POST", body: JSON.stringify({ consentEvidence: "fake consent evidence here" }) }), context);
    expect(get.status).toBe(403);
    expect(post.status).toBe(403);
  });
});
