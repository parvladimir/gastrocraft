import { ImageResponse } from "next/og";
import { OpenGraphCard } from "@/components/seo/open-graph-card";

export const alt =
  "GastroCraft – Restaurant Digital Solutions. Ihre Gäste suchen online. Wir sorgen dafür, dass sie Sie finden.";
export const contentType = "image/png";
export const size = {
  height: 630,
  width: 1200
};

export default function OpenGraphImage() {
  return new ImageResponse(<OpenGraphCard />, {
    ...size
  });
}
