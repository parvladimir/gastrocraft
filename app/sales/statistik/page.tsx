import type { Metadata } from "next";
import { SalesManager } from "@/components/sales/sales-manager";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: "Sales Statistik"
};

export default function SalesStatisticsPage() {
  return <SalesManager initialView="statistics" />;
}
