import type { Metadata } from "next";
import { Suspense } from "react";
import { SalesLogin } from "@/components/sales/sales-login";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false
  },
  title: "Sales Login"
};

export default function SalesLoginPage() {
  return (
    <Suspense fallback={<SalesLoginFallback />}>
      <SalesLogin />
    </Suspense>
  );
}

function SalesLoginFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-midnight px-4 py-10 text-warm-white">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#101a2c] p-6">
        <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
          DINEVIO Sales Manager
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">Anmelden</h1>
        <p className="mt-3 text-sm text-slate-400">Sitzung wird geprüft …</p>
      </div>
    </main>
  );
}
