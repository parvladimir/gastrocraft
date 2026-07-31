import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RestaurantDemoTemplate } from "@/components/demo-template/restaurant-demo-template";
import { getPublishedRestaurantDemo } from "@/lib/demo-template/data";

type DemoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: DemoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = await getPublishedRestaurantDemo(slug);

  if (!config) {
    return {
      title: "Demo nicht gefunden"
    };
  }

  return {
    alternates: {
      canonical: config.seo.canonicalUrl
    },
    description: config.seo.description,
    openGraph: {
      description: config.seo.description,
      images: [
        {
          alt: config.restaurantName,
          url: config.heroImagePath
        }
      ],
      title: config.seo.title,
      type: "website",
      url: config.seo.canonicalUrl
    },
    robots: {
      follow: false,
      index: false
    },
    title: config.seo.title
  };
}

export default async function RestaurantDemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  const config = await getPublishedRestaurantDemo(slug);

  if (!config) {
    notFound();
  }

  return <RestaurantDemoTemplate config={config} page="home" slug={slug} />;
}
