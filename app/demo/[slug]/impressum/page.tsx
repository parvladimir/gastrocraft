import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantDemoTemplate } from "@/components/demo-template/restaurant-demo-template";
import { getPublishedRestaurantDemo } from "@/lib/demo-template/data";

type DemoSubPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: DemoSubPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublishedRestaurantDemo(slug);

  return {
    robots: {
      follow: false,
      index: false
    },
    title: config ? `Impressum | ${config.restaurantName}` : "Impressum"
  };
}

export default async function RestaurantDemoImpressumPage({ params }: DemoSubPageProps) {
  const { slug } = await params;
  const config = await getPublishedRestaurantDemo(slug);

  if (!config) {
    notFound();
  }

  return <RestaurantDemoTemplate config={config} page="impressum" slug={slug} />;
}
