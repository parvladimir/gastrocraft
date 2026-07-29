"use client";

import { LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

const inputClassName =
  "mt-2 min-h-12 w-full rounded border border-white/10 bg-midnight px-4 text-base text-warm-white transition-[border-color,box-shadow] duration-200 placeholder:text-slate-500 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25";

const goldButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded bg-premium-gold px-5 text-base font-semibold text-midnight transition-[background-color,transform,opacity] hover:bg-[#d6b238] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export function SalesLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const config = getSupabaseConfig();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(config.isConfigured);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/sales");
        return;
      }

      setLoading(false);
    });
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError("Supabase ist nicht konfiguriert.");
      return;
    }

    setError("");
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setSubmitting(false);
      setError(
        signInError.message.toLowerCase().includes("invalid")
          ? "E-Mail oder Passwort ist falsch."
          : "Die Anmeldung ist momentan nicht möglich. Bitte erneut versuchen."
      );
      return;
    }

    router.replace(searchParams.get("redirectTo") || "/sales");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-midnight px-4 py-10 text-warm-white">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-md place-items-center">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-white/10 bg-[#101a2c] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)]"
        >
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">
            DINEVIO Sales Manager
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">Anmelden</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Geschützter interner Bereich für Restaurantkontakte und Besuchsplanung.
          </p>

          {!config.isConfigured ? (
            <div className="mt-5 rounded border border-orange-300/35 bg-orange-400/10 p-4 text-sm leading-6 text-orange-100">
              <p className="font-semibold">Supabase ist nicht konfiguriert.</p>
              <p className="mt-1">Fehlende Variablen: {config.missing.join(", ")}</p>
            </div>
          ) : null}

          <label className="mt-6 block text-sm font-semibold" htmlFor="sales-email">
            E-Mail
          </label>
          <input
            id="sales-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClassName}
            autoComplete="email"
            required
          />

          <label className="mt-4 block text-sm font-semibold" htmlFor="sales-password">
            Passwort
          </label>
          <input
            id="sales-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClassName}
            autoComplete="current-password"
            required
          />

          {error ? (
            <p className="mt-4 rounded border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100">
              {error}
            </p>
          ) : null}

          <button className={`${goldButtonClassName} mt-6 w-full`} disabled={loading || submitting || !config.isConfigured} type="submit">
            <LogIn aria-hidden="true" className="h-4 w-4" />
            {submitting ? "Anmeldung läuft ..." : loading ? "Sitzung wird geprüft ..." : "Anmelden"}
          </button>
        </form>
      </div>
    </main>
  );
}
