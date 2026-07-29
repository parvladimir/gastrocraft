import type { Metadata } from "next";
import { SalesManager } from "@/components/sales/sales-manager";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: "Sales Pipeline"
};

export default function SalesPipelinePage() {
  return <SalesManager initialView="pipeline" />;
}
