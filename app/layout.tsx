import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { StructuredData } from "@/components/seo/structured-data";
import { getSiteUrl, siteConfig } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  alternates: {
    canonical: "/"
  },
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.name }],
  category: "Restaurant Digital Solutions",
  creator: siteConfig.name,
  description: siteConfig.description,
  icons: {
    apple: [{ type: "image/svg+xml", url: "/apple-icon.svg" }],
    icon: [
      { type: "image/x-icon", url: "/favicon.ico" },
      { type: "image/svg+xml", url: "/favicon.svg" },
      { type: "image/svg+xml", url: "/icon.svg" }
    ]
  },
  keywords: [
    "Restaurant Website",
    "Digitale Speisekarte",
    "Gastronomie Website",
    "QR Speisekarte",
    "Google Business Restaurant",
    "Restaurant Digitalisierung",
    "Webdesign Gastronomie",
    "Restaurant Marketing",
    "Gastronomie Dorsten",
    "Gastronomie NRW"
  ],
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: `${siteConfig.name} – ${siteConfig.descriptor}`,
        height: 630,
        url: "/opengraph-image",
        width: 1200
      }
    ],
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: "DINEVIO | Restaurant Digital Solutions",
    type: "website",
    url: "/"
  },
  publisher: siteConfig.name,
  robots: {
    follow: true,
    index: true
  },
  title: {
    default: "DINEVIO | Restaurant Digital Solutions",
    template: "%s | DINEVIO"
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: [
      {
        alt: `${siteConfig.name} – ${siteConfig.descriptor}`,
        url: "/twitter-image"
      }
    ],
    title: "DINEVIO | Restaurant Digital Solutions"
  }
};

export const viewport: Viewport = {
  colorScheme: "dark",
  initialScale: 1,
  themeColor: "#0F172A",
  width: "device-width"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang={siteConfig.language} className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <StructuredData />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
