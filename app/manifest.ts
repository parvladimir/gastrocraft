import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#0F172A",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml"
      }
    ],
    lang: siteConfig.language,
    name: `${siteConfig.name} – ${siteConfig.descriptor}`,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#0F172A"
  };
}
