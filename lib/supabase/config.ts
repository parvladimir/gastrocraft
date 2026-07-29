export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return {
    anonKey,
    isConfigured: Boolean(url && anonKey),
    missing: [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
      !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : ""
    ].filter(Boolean),
    url
  };
}
