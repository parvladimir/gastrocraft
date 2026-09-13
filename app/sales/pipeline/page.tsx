import type { Metadata } from "next";
import { SalesManager } from "@/components/sales/sales-manager";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: "DINEVIO · Воронка продаж"
};

export default function SalesPipelinePage() {
  return <SalesManager initialView="pipeline" />;
}
