import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Offer, Restaurant, SalesData } from "@/lib/sales-types";
import { normalizeSalesError, offersService, salesDataService } from "@/lib/sales/services";

const offer: Offer = {
  created_at: "2026-09-14T00:00:00.000Z",
  created_by: "00000000-0000-0000-0000-000000000001",
  discount_amount: "",
  discount_percent: "",
  id: "00000000-0000-0000-0000-000000000002",
  monthly_price: "",
  offer_date: "2026-09-14",
  package_name: "Basis",
  restaurant_id: "00000000-0000-0000-0000-000000000003",
  setup_price: "",
  special_requests: "",
  status: "draft",
  updated_at: "2026-09-14T00:00:00.000Z",
  valid_until: "",
  vat_rate: ""
};

describe("offer numeric serialization", () => {
  it("sends null for empty numeric fields when a Sales snapshot saves existing records", async () => {
    const writes = new Map<string, Record<string, unknown>[]>();
    const supabase = {
      from(table: string) {
        return {
          upsert(rows: Record<string, unknown>[]) {
            writes.set(table, rows);
            return Promise.resolve({ error: null });
          }
        };
      }
    } as unknown as SupabaseClient;
    const data: SalesData = {
      contact_history: [],
      message_templates: [],
      offers: [offer],
      package_templates: [],
      restaurant_photos: [],
      restaurants: [{
        id: offer.restaurant_id,
        google_rating: "",
        google_review_count: "",
        interest_level: ""
      } as unknown as Restaurant],
      sales_settings: [],
      tasks: [],
      tour_stops: [],
      tours: [],
      users: []
    };

    const result = await salesDataService.saveSnapshot(supabase, data);

    expect(result.error).toBeNull();
    expect(writes.get("offers")?.[0]).toMatchObject({
      discount_amount: null,
      discount_percent: null,
      vat_rate: null
    });
    expect(writes.get("restaurants")?.[0]).toMatchObject({
      google_rating: null,
      google_review_count: null,
      interest_level: null
    });
  });

  it("normalizes numeric values on direct offer updates without adding absent fields", async () => {
    let written: Record<string, unknown> = {};
    const supabase = {
      from() {
        return {
          update(row: Record<string, unknown>) {
            written = row;
            return {
              eq() {
                return {
                  select() {
                    return { single: async () => ({ data: { ...offer, ...row }, error: null }) };
                  }
                };
              }
            };
          }
        };
      }
    } as unknown as SupabaseClient;

    const result = await offersService.updateOffer(supabase, offer.id, {
      discount_amount: "",
      discount_percent: "12,5"
    });

    expect(result.error).toBeNull();
    expect(written.discount_amount).toBeNull();
    expect(written.discount_percent).toBe(12.5);
    expect(written).not.toHaveProperty("vat_rate");
  });

  it("explains numeric database errors in Russian while retaining technical details", () => {
    const error = normalizeSalesError('invalid input syntax for type numeric: ""');

    expect(error).toContain("В числовом поле");
    expect(error).toContain("Технические сведения: invalid input syntax for type numeric");
  });
});
