import type { CreateLeadInput, DuplicateCheckInput } from "./schemas";

export function emptyToUndefined(value: string | undefined | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

export function mapLeadPayload(input: CreateLeadInput) {
  return {
    category: emptyToUndefined(input.category),
    city: emptyToUndefined(input.city),
    discovered_at: input.discovered_at,
    email: emptyToUndefined(input.email),
    google_maps_url: emptyToUndefined(input.google_maps_url),
    google_place_id: emptyToUndefined(input.google_place_id),
    house_number: emptyToUndefined(input.house_number),
    latitude: emptyToUndefined(input.latitude),
    lead_score: input.lead_score,
    longitude: emptyToUndefined(input.longitude),
    name: input.name.trim(),
    notes: emptyToUndefined(input.notes),
    phone: emptyToUndefined(input.phone),
    postal_code: emptyToUndefined(input.postal_code),
    selection_reason: emptyToUndefined(input.selection_reason),
    source_name: emptyToUndefined(input.source_name),
    source_url: emptyToUndefined(input.source_url),
    street: emptyToUndefined(input.street),
    website: emptyToUndefined(input.website),
    website_status: input.website_status
  };
}

export function mapDuplicatePayload(input: DuplicateCheckInput) {
  return {
    p_city: emptyToUndefined(input.city) ?? null,
    p_house_number: emptyToUndefined(input.house_number) ?? null,
    p_name: input.name.trim(),
    p_phone: emptyToUndefined(input.phone) ?? null,
    p_postal_code: emptyToUndefined(input.postal_code) ?? null,
    p_street: emptyToUndefined(input.street) ?? null
  };
}

export function validationErrorResponse(issues: unknown) {
  return {
    error: "validation_error",
    message: "Request failed schema validation.",
    issues
  };
}
