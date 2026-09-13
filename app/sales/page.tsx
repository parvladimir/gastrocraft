import type { Metadata } from "next";
import { SalesManager } from "@/components/sales/sales-manager";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: "DINEVIO · Продажи"
};

export default function SalesPage() {
  return <SalesManager />;
}
