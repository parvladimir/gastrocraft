import { NextResponse } from "next/server";

const resendApiUrl =
  process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails";
const minimumSubmitTimeMs = 2000;

type ContactRequestBody = {
  business?: unknown;
  city?: unknown;
  consent?: unknown;
  email?: unknown;
  formStartedAt?: unknown;
  message?: unknown;
  name?: unknown;
  phone?: unknown;
  sourceUrl?: unknown;
  submittedAt?: unknown;
  website?: unknown;
};

type ContactPayload = {
  business: string;
  city: string;
  consent: boolean;
  email: string;
  formStartedAt: string;
  message: string;
  name: string;
  phone: string;
  sourceUrl: string;
  submittedAt: string;
  website: string;
};

type ValidationResult =
  | {
      payload: ContactPayload;
      success: true;
    }
  | {
      errors: string[];
      success: false;
    };

export async function POST(request: Request) {
  let body: ContactRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload.", success: false },
      { status: 400 }
    );
  }

  const validation = validateContactPayload(body);

  if (!validation.success) {
    return NextResponse.json(
      { errors: validation.errors, message: "Invalid contact request.", success: false },
      { status: 400 }
    );
  }

  const { payload } = validation;

  if (isLikelySpam(payload)) {
    return NextResponse.json({ success: true });
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL?.trim();
  const toEmail = process.env.CONTACT_FORM_TO_EMAIL?.trim();

  if (!resendApiKey || !fromEmail || !toEmail) {
    return NextResponse.json(
      {
        message: "Contact form email delivery is not configured.",
        success: false
      },
      { status: 503 }
    );
  }

  const mailPayload = createResendMailPayload({
    fromEmail,
    payload,
    toEmail
  });

  try {
    const response = await fetch(resendApiUrl, {
      body: JSON.stringify(mailPayload),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: "Contact form email delivery failed.", success: false },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { message: "Contact form email delivery failed.", success: false },
      { status: 502 }
    );
  }
}

function validateContactPayload(body: ContactRequestBody): ValidationResult {
  const payload: ContactPayload = {
    business: getTrimmedString(body.business),
    city: getTrimmedString(body.city),
    consent: body.consent === true,
    email: getTrimmedString(body.email),
    formStartedAt: getTrimmedString(body.formStartedAt),
    message: getTrimmedString(body.message),
    name: getTrimmedString(body.name),
    phone: getTrimmedString(body.phone),
    sourceUrl: getTrimmedString(body.sourceUrl),
    submittedAt: getTrimmedString(body.submittedAt),
    website: getTrimmedString(body.website)
  };
  const errors: string[] = [];

  if (!payload.name) {
    errors.push("name");
  } else if (payload.name.length > 100) {
    errors.push("nameLength");
  }

  if (!payload.business) {
    errors.push("business");
  } else if (payload.business.length > 150) {
    errors.push("businessLength");
  }

  if (!payload.email || !isValidEmail(payload.email)) {
    errors.push("email");
  } else if (payload.email.length > 150) {
    errors.push("emailLength");
  }

  if (!payload.phone) {
    errors.push("phone");
  } else if (payload.phone.length > 100) {
    errors.push("phoneLength");
  }

  if (!payload.message) {
    errors.push("message");
  } else if (payload.message.length > 2000) {
    errors.push("messageLength");
  }

  if (payload.city.length > 100) {
    errors.push("cityLength");
  }

  if (payload.sourceUrl.length > 500) {
    errors.push("sourceUrlLength");
  }

  if (payload.website.length > 250) {
    errors.push("websiteLength");
  }

  if (!payload.consent) {
    errors.push("consent");
  }

  if (!payload.formStartedAt || Number.isNaN(Date.parse(payload.formStartedAt))) {
    errors.push("formStartedAt");
  }

  if (!payload.submittedAt || Number.isNaN(Date.parse(payload.submittedAt))) {
    errors.push("submittedAt");
  }

  if (errors.length > 0) {
    return { errors, success: false };
  }

  return { payload, success: true };
}

function createResendMailPayload({
  fromEmail,
  payload,
  toEmail
}: {
  fromEmail: string;
  payload: ContactPayload;
  toEmail: string;
}) {
  const recipients = toEmail
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  return {
    from: fromEmail,
    html: createHtmlMessage(payload),
    reply_to: payload.email,
    subject: `Neue GastroCraft Anfrage von ${payload.name}`,
    text: createTextMessage(payload),
    to: recipients
  };
}

function createTextMessage(payload: ContactPayload) {
  return [
    "Neue Kontaktanfrage über GastroCraft",
    "",
    `Name: ${payload.name}`,
    `Restaurant / Betrieb: ${payload.business}`,
    `E-Mail: ${payload.email}`,
    `Telefon: ${payload.phone}`,
    `Ort: ${payload.city || "-"}`,
    "",
    "Nachricht:",
    payload.message,
    "",
    `Quelle: ${payload.sourceUrl || "-"}`,
    `Gesendet am: ${payload.submittedAt}`
  ].join("\n");
}

function createHtmlMessage(payload: ContactPayload) {
  return `
    <h1>Neue Kontaktanfrage über GastroCraft</h1>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Restaurant / Betrieb:</strong> ${escapeHtml(payload.business)}</p>
    <p><strong>E-Mail:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Ort:</strong> ${escapeHtml(payload.city || "-")}</p>
    <h2>Nachricht</h2>
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br>")}</p>
    <hr>
    <p><strong>Quelle:</strong> ${escapeHtml(payload.sourceUrl || "-")}</p>
    <p><strong>Gesendet am:</strong> ${escapeHtml(payload.submittedAt)}</p>
  `;
}

function isLikelySpam(payload: ContactPayload) {
  const startedAt = Date.parse(payload.formStartedAt);
  const submittedAt = Date.parse(payload.submittedAt);

  return (
    Boolean(payload.website) ||
    Number.isNaN(startedAt) ||
    Number.isNaN(submittedAt) ||
    submittedAt - startedAt < minimumSubmitTimeMs
  );
}

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
