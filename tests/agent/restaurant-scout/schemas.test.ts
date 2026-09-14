import { describe, expect, it } from "vitest";
import {
  createLeadSchema,
  duplicateCheckSchema,
  finishRunSchema,
  startRunSchema,
  visitPlanSchema
} from "@/lib/agent/restaurant-scout/schemas";
import { resolveMaxLeadsPerRun } from "@/lib/agent/restaurant-scout/rate-limits";
import { mapLeadPayload } from "@/lib/agent/restaurant-scout/normalize";

describe("restaurant scout schemas", () => {
  it("rejects unknown fields on start run", () => {
    const result = startRunSchema.safeParse({ city: "Berlin", agent_id: "spoof" });
    expect(result.success).toBe(false);
  });

  it("rejects lead_score above 100", () => {
    const result = createLeadSchema.safeParse({
      run_id: "11111111-1111-4111-8111-111111111111",
      name: "Test Imbiss",
      lead_score: 101
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-http URLs", () => {
    const result = createLeadSchema.safeParse({
      run_id: "11111111-1111-4111-8111-111111111111",
      name: "Test Imbiss",
      lead_score: 50,
      website: "ftp://evil.example"
    });
    expect(result.success).toBe(false);
  });

  it("rejects a lead with its own website or no source evidence", () => {
    const base = {
      run_id: "11111111-1111-4111-8111-111111111111",
      name: "Test Imbiss",
      lead_score: 50,
      source_url: "https://example.com/listing",
      website_status: "missing",
      selection_reason: "Active restaurant with no own website"
    };
    expect(createLeadSchema.safeParse({ ...base, website: "https://test.example" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...base, source_url: "" }).success).toBe(false);
  });

  it("accepts valid lead payload and maps allowlisted fields only", () => {
    const parsed = createLeadSchema.parse({
      run_id: "11111111-1111-4111-8111-111111111111",
      name: "Test Imbiss",
      city: "Berlin",
      lead_score: 77,
      source_url: "https://example.com/listing",
      website_status: "missing",
      selection_reason: "Confirmed active and no own website"
    });
    const mapped = mapLeadPayload(parsed);
    expect(mapped).toMatchObject({
      name: "Test Imbiss",
      city: "Berlin",
      lead_score: 77,
      source_url: "https://example.com/listing",
      website_status: "missing"
    });
    expect(mapped).not.toHaveProperty("created_by");
    expect(mapped).not.toHaveProperty("role");
    expect(mapped).not.toHaveProperty("planned_visit_at");
  });

  it("requires name for duplicate check", () => {
    expect(duplicateCheckSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects unknown finish fields", () => {
    expect(finishRunSchema.safeParse({ status: "finished", role: "admin" }).success).toBe(
      false
    );
  });

  it("rejects visit-plan body fields", () => {
    expect(visitPlanSchema.safeParse({ planned_visit_at: "2026-01-01" }).success).toBe(
      false
    );
  });

  it("caps max leads per run by configuration", () => {
    expect(resolveMaxLeadsPerRun(99)).toBeLessThanOrEqual(6);
    expect(resolveMaxLeadsPerRun(1)).toBe(1);
  });

  it("requires a public source URL when claiming a restaurant email", () => {
    const lead = {
      run_id: "11111111-1111-4111-8111-111111111111",
      name: "Test Imbiss",
      lead_score: 75,
      source_url: "https://example.com/listing",
      website_status: "missing",
      selection_reason: "Confirmed active and no own website",
      email: "kontakt@example.com"
    };
    expect(createLeadSchema.safeParse(lead).success).toBe(false);
    expect(createLeadSchema.safeParse({ ...lead, email_source_url: "https://example.com/contact" }).success).toBe(true);
    expect(createLeadSchema.safeParse({ ...lead, email_source_url: "file:///private/contact" }).success).toBe(false);
  });
});
