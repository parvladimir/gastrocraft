import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { DeviceFrame } from "@/components/references/device-frame";
import type { ReferenceProject, ReferenceTheme } from "@/data/reference-projects";

const themeAccentClasses: Record<ReferenceTheme, string> = {
  restaurant: "bg-premium-gold",
  rhodos: "bg-[#4c7da6]",
  schlemmerhus: "bg-[#c46b32]"
};

function publicAssetExists(src: string) {
  return existsSync(join(process.cwd(), "public", src.replace(/^\//, "")));
}

export function ReferenceShowcase({
  fallback,
  isFeatured,
  project
}: {
  fallback: ReactNode;
  isFeatured: boolean;
  project: ReferenceProject;
}) {
  const hasDesktopImage = publicAssetExists(project.desktopImage);
  const hasMobileImage = publicAssetExists(project.mobileImage);

  if (!hasDesktopImage) {
    return fallback;
  }

  return (
    <div
      className={`relative min-h-[22rem] min-w-0 overflow-hidden border-b border-white/10 p-5 sm:p-6 ${
        isFeatured ? "lg:border-b-0 lg:border-r" : ""
      } lg:border-white/10`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_52%)]" />
      <DeviceFrame
        accentClassName={themeAccentClasses[project.theme]}
        alt={project.imageAlt}
        desktopImage={project.desktopImage}
        hasMobileImage={hasMobileImage}
        mobileImage={project.mobileImage}
      />
    </div>
  );
}
