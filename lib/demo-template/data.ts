import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { buildRestaurantDemoConfig } from "./config";
import type { DemoPageSnapshot, RestaurantDemoConfig } from "./types";

export async function getPublishedRestaurantDemo(slug: string): Promise<RestaurantDemoConfig | null> {
  const supabaseConfig = getSupabaseConfig();

  if (!supabaseConfig.isConfigured) {
    return null;
  }

  const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);
  const { data, error } = await supabase
    .from("demo_pages")
    .select(
      [
        "address",
        "category",
        "city",
        "content",
        "email",
        "gallery_config",
        "gallery_photo_paths",
        "google_maps_url",
        "hero_photo_path",
        "instagram",
        "legal_config",
        "logo_photo_path",
        "menu_config",
        "menu_items",
        "opening_hours",
        "phone",
        "postal_code",
        "restaurant_name",
        "reviews_config",
        "seo_config",
        "slug",
        "social_links",
        "special_offer",
        "status",
        "template_config",
        "template_key",
        "website"
      ].join(", ")
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return buildRestaurantDemoConfig(data as DemoPageSnapshot, slug);
}
