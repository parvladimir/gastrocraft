import type { MetadataRoute } from "next";
import { getAbsoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "monthly",
      priority: 1,
      url: getAbsoluteUrl("/")
    },
    {
      changeFrequency: "yearly",
      priority: 0.2,
      url: getAbsoluteUrl("/impressum")
    },
    {
      changeFrequency: "yearly",
      priority: 0.2,
      url: getAbsoluteUrl("/datenschutz")
    }
  ];
}
