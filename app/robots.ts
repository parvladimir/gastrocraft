import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      userAgent: "*"
    },
    sitemap: getAbsoluteUrl("/sitemap.xml")
  };
}
