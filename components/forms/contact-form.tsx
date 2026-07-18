"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

const contactFormEndpoint =
  process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT?.trim() ?? "";

const messageMaxLength = 2000;
const minimumInteractionMs = 2000;

const inputClasses =
  "mt-2 min-h-12 w-full rounded border border-white/10 bg-midnight px-4 text-base text-warm-white transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-slate-500 focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/25 aria-[invalid=true]:border-red-300/70 aria-[invalid=true]:focus:ring-red-300/20";

type FormStatus = "idle" | "submitting" | "success" | "error" | "notConfigured";

type ContactFormPayload = {
  business: string;
  city: string;
  consent: boolean;
  contact: string;
  message: string;
  name: string;
  sourceUrl: string;
  submittedAt: string;
};

type FieldName = "business" | "city" | "consent" | "contact" | "message" | "name";

const statusMessages: Record<Exclude<FormStatus, "idle" | "submitting">, string> = {
  error:
    "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per Telefon oder WhatsApp.",
  notConfigured:
    "Das Kontaktformular ist noch nicht aktiviert. Bitte kontaktieren Sie uns direkt per Telefon oder WhatsApp.",
  success:
    "Vielen Dank. Ihre Anfrage wurde erfolgreich gesendet. Wir melden uns so schnell wie möglich."
};

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [messageLength, setMessageLength] = useState(0);
  const formStartedAt = useRef(0);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const isSubmitting = status === "submitting";
  const visibleStatus =
    status === "success" || status === "error" || status === "notConfigured"
      ? status
      : null;

  useEffect(() => {
    formStartedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (visibleStatus) {
      statusRef.current?.focus();
    }
  }, [visibleStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const fields = getTrimmedFields(formData);

    clearCustomValidity(form);

    const nextInvalidFields = getInvalidFieldNames(fields);
    setInvalidFields(nextInvalidFields);

    if (nextInvalidFields.length > 0) {
      setCustomValidity(form, nextInvalidFields);
      form.reportValidity();
      return;
    }

    if (fields.website || Date.now() - formStartedAt.current < minimumInteractionMs) {
      setStatus("success");
      form.reset();
      setMessageLength(0);
      setInvalidFields([]);
      formStartedAt.current = Date.now();
      return;
    }

    if (!contactFormEndpoint) {
      setStatus("notConfigured");
      return;
    }

    setStatus("submitting");

    const payload: ContactFormPayload = {
      business: fields.business,
      city: fields.city,
      consent: fields.consent,
      contact: fields.contact,
      message: fields.message,
      name: fields.name,
      sourceUrl: window.location.href,
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(contactFormEndpoint, {
        body: JSON.stringify(payload),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Contact form request failed");
      }

      setStatus("success");
      form.reset();
      setMessageLength(0);
      setInvalidFields([]);
      formStartedAt.current = Date.now();
    } catch {
      setStatus("error");
    }
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      target.setCustomValidity("");
      setInvalidFields((current) => current.filter((field) => field !== target.name));

      if (target.name === "message") {
        setMessageLength(target.value.length);
      }
    }
  }

  return (
    <form
      className="rounded-lg border border-white/10 bg-[#101a2c] p-6 shadow-[0_12px_34px_rgba(0,0,0,0.14)] sm:p-7"
      onInput={handleInput}
      onSubmit={handleSubmit}
      noValidate={false}
    >
      <div className="pointer-events-none absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="contact-form-website">
          Dieses Feld bitte leer lassen
        </label>
        <input
          id="contact-form-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          autoComplete="name"
          invalid={invalidFields.includes("name")}
          label="Name"
          maxLength={100}
          name="name"
          required
        />
        <FormField
          autoComplete="organization"
          invalid={invalidFields.includes("business")}
          label="Restaurant / Betrieb"
          maxLength={150}
          name="business"
          required
        />
        <FormField
          autoComplete="tel"
          invalid={invalidFields.includes("contact")}
          label="Telefon oder WhatsApp"
          maxLength={100}
          name="contact"
          required
        />
        <FormField
          autoComplete="address-level2"
          invalid={invalidFields.includes("city")}
          label="Ort"
          maxLength={100}
          name="city"
        />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="message"
            className="text-sm font-semibold text-warm-white"
          >
            Wobei können wir helfen?
          </label>
          <span className="shrink-0 text-xs text-slate-500">
            {messageLength} / {messageMaxLength}
          </span>
        </div>
        <textarea
          id="message"
          name="message"
          required
          maxLength={messageMaxLength}
          rows={5}
          aria-invalid={invalidFields.includes("message")}
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
          value="true"
          aria-invalid={invalidFields.includes("consent")}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-midnight accent-[var(--brand-premium-gold)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
        />
        <label htmlFor="consent" className="text-sm leading-6 text-slate-300">
          Ich stimme zu, dass meine Angaben zur Bearbeitung meiner Anfrage
          verwendet werden.
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded bg-premium-gold px-6 text-base font-semibold text-midnight shadow-[inset_0_-1px_0_rgba(15,23,42,0.18)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-out hover:bg-[#d6b238] hover:shadow-[inset_0_-2px_0_rgba(15,23,42,0.22)] active:translate-y-px active:bg-[#b8921f] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-premium-gold disabled:hover:shadow-[inset_0_-1px_0_rgba(15,23,42,0.18)] disabled:active:translate-y-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-focus-ring)]"
      >
        {isSubmitting ? "Anfrage wird gesendet …" : "Kostenlose Beratung anfragen"}
      </button>

      <div aria-live="polite" aria-atomic="true">
        {isSubmitting ? (
          <p className="sr-only">Anfrage wird gesendet …</p>
        ) : null}
        {visibleStatus ? (
          <p
            ref={statusRef}
            tabIndex={-1}
            className="mt-5 rounded border border-premium-gold/25 px-4 py-3 text-sm leading-6 text-slate-300 focus:outline-none"
          >
            {statusMessages[visibleStatus]}
          </p>
        ) : null}
      </div>
    </form>
  );
}

function FormField({
  autoComplete,
  invalid,
  label,
  maxLength,
  name,
  required = false
}: {
  autoComplete: string;
  invalid: boolean;
  label: string;
  maxLength: number;
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
        maxLength={maxLength}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className={inputClasses}
      />
    </div>
  );
}

function getTrimmedFields(formData: FormData) {
  return {
    business: String(formData.get("business") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    consent: formData.get("consent") === "true",
    contact: String(formData.get("contact") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim()
  };
}

function clearCustomValidity(form: HTMLFormElement) {
  form.querySelectorAll("input, textarea").forEach((field) => {
    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.setCustomValidity("");
    }
  });
}

function getInvalidFieldNames(fields: ReturnType<typeof getTrimmedFields>) {
  const requiredFields = ["name", "business", "contact", "message"] as const;
  const invalidFieldNames: FieldName[] = requiredFields.filter(
    (fieldName) => !fields[fieldName]
  );

  if (!fields.consent) {
    invalidFieldNames.push("consent");
  }

  return invalidFieldNames;
}

function setCustomValidity(form: HTMLFormElement, invalidFieldNames: FieldName[]) {
  invalidFieldNames.forEach((fieldName) => {
    const field = form.elements.namedItem(fieldName);

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
      field.setCustomValidity("Bitte füllen Sie dieses Feld aus.");
    }
  });
}
