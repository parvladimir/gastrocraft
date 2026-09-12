import { z } from "zod";
import { MAX_TEXT_LONG, MAX_TEXT_MEDIUM, MAX_TEXT_SHORT } from "./constants";

const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must be http or https");

const optionalHttpUrl = z.union([httpUrlSchema, z.literal("")]).optional();

export const startRunSchema = z
  .object({
    city: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    region: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    notes: z.string().trim().max(MAX_TEXT_MEDIUM).optional(),
    max_leads: z.number().int().min(1).max(3).optional()
  })
  .strict();

export const duplicateCheckSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_TEXT_SHORT),
    street: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    house_number: z.string().trim().max(40).optional(),
    postal_code: z.string().trim().max(20).optional(),
    city: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    phone: z.string().trim().max(40).optional()
  })
  .strict();

export const createLeadSchema = z
  .object({
    run_id: z.string().uuid(),
    name: z.string().trim().min(1).max(MAX_TEXT_SHORT),
    category: z.string().trim().max(80).optional(),
    street: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    house_number: z.string().trim().max(40).optional(),
    postal_code: z.string().trim().max(20).optional(),
    city: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    phone: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(MAX_TEXT_SHORT).optional().or(z.literal("")),
    website: z.literal("").optional(),
    google_maps_url: optionalHttpUrl,
    google_place_id: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    latitude: z.string().trim().max(40).optional(),
    longitude: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(MAX_TEXT_LONG).optional(),
    source_url: httpUrlSchema,
    source_name: z.string().trim().max(MAX_TEXT_SHORT).optional(),
    website_status: z.literal("missing"),
    lead_score: z.number().int().min(0).max(100),
    selection_reason: z.string().trim().min(10).max(MAX_TEXT_MEDIUM),
    discovered_at: z.string().datetime().optional()
  })
  .strict();

export const finishRunSchema = z
  .object({
    status: z.enum(["finished", "failed", "cancelled"]).default("finished"),
    error_message: z.string().trim().max(MAX_TEXT_MEDIUM).optional()
  })
  .strict();

export const visitPlanSchema = z.object({}).strict();

export type StartRunInput = z.infer<typeof startRunSchema>;
export type DuplicateCheckInput = z.infer<typeof duplicateCheckSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type FinishRunInput = z.infer<typeof finishRunSchema>;
