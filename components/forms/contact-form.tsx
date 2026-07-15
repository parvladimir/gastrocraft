"use client";

import { useState } from "react";

const inputClasses =
  "mt-2 min-h-12 w-full rounded border border-white/10 bg-midnight px-4 text-base text-warm-white transition-colors placeholder:text-slate-500 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25";

export function ContactForm() {
  const [message, setMessage] = useState("");

  return (
    <form
      className="rounded-lg border border-white/10 bg-[#101a2c] p-6 sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(
          "Das Formular ist technisch vorbereitet. Bitte kontaktieren Sie uns aktuell direkt per Telefon oder WhatsApp."
        );
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          autoComplete="name"
          label="Name"
          name="name"
          required
        />
        <FormField
          autoComplete="organization"
          label="Restaurant / Betrieb"
          name="business"
          required
        />
        <FormField
          autoComplete="tel"
          label="Telefon oder WhatsApp"
          name="contact"
          required
        />
        <FormField autoComplete="address-level2" label="Ort" name="city" />
      </div>

      <div className="mt-5">
        <label
          htmlFor="message"
          className="text-sm font-semibold text-warm-white"
        >
          Wobei können wir helfen?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Zum Beispiel: neue Website, digitale Speisekarte, Google Business oder laufende Betreuung."
          className={`${inputClasses} min-h-36 resize-y py-3 leading-7`}
        />
      </div>

      <div className="mt-5 flex gap-3">
        <input
          id="consent"
          name="consent"
          required
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-white/20 bg-midnight accent-[var(--brand-premium-gold)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
        />
        <label htmlFor="consent" className="text-sm leading-6 text-slate-300">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage
          verwendet werden.
        </label>
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded bg-premium-gold px-6 text-base font-semibold text-midnight shadow-[inset_0_-1px_0_rgba(15,23,42,0.18)] transition-[background-color,box-shadow] duration-200 hover:bg-[#d6b238] hover:shadow-[inset_0_-2px_0_rgba(15,23,42,0.22)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)] active:bg-[#b8921f]"
      >
        Kostenlose Beratung anfragen
      </button>

      <div aria-live="polite">
        {message ? (
          <p className="mt-5 rounded border border-premium-gold/25 px-4 py-3 text-sm leading-6 text-slate-300">
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function FormField({
  autoComplete,
  label,
  name,
  required = false
}: {
  autoComplete: string;
  label: string;
  name: string;
  required?: boolean;
}) {
  const fieldId = `contact-form-${name}`;

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-semibold text-warm-white">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        required={required}
        autoComplete={autoComplete}
        className={inputClasses}
      />
    </div>
  );
}
