import { LIMITS } from "./constants";

export interface InquiryInput {
  email: string;
  message: string;
  idempotencyKey: string;
}

export interface BotSignals {
  honeypot: string;
  fillMillis: number | null;
}

export type FieldErrors = Partial<
  Record<"email" | "message" | "idempotencyKey", string>
>;

export type ValidationResult =
  | { ok: true; input: InquiryInput; signals: BotSignals }
  | { ok: false; fieldErrors: FieldErrors };

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;
// Control characters other than tab / newline / carriage return.
const DISALLOWED_CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > LIMITS.emailMaxLength) return false;
  if (/[\r\n\s]/.test(email)) return false;
  const [local] = email.split("@");
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith("."))
    return false;
  if (email.includes("..")) return false;
  return EMAIL_PATTERN.test(email);
}

export function normalizeMessage(raw: string): string {
  return raw.replace(/\r\n?/g, "\n").trim();
}

export function validateInquiryPayload(payload: unknown): ValidationResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return {
      ok: false,
      fieldErrors: { email: "Enter your email address.", message: "Enter your inquiry." },
    };
  }
  const record = payload as Record<string, unknown>;
  const fieldErrors: FieldErrors = {};

  const rawEmail = typeof record.email === "string" ? record.email : "";
  const email = normalizeEmail(rawEmail);
  if (email.length === 0) {
    fieldErrors.email = "Enter your email address.";
  } else if (!isValidEmail(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  const rawMessage = typeof record.message === "string" ? record.message : "";
  const message = normalizeMessage(rawMessage);
  if (message.length === 0) {
    fieldErrors.message = "Enter your inquiry.";
  } else if (message.length < LIMITS.messageMinLength) {
    fieldErrors.message = "Please tell us a little more about your inquiry.";
  } else if (message.length > LIMITS.messageMaxLength) {
    fieldErrors.message = `Please keep your inquiry under ${LIMITS.messageMaxLength.toLocaleString("en-US")} characters.`;
  } else if (DISALLOWED_CONTROL.test(message)) {
    fieldErrors.message = "Your inquiry contains unsupported characters.";
  }

  const idempotencyKey =
    typeof record.idempotencyKey === "string" ? record.idempotencyKey : "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    fieldErrors.idempotencyKey = "Invalid submission. Please reload the page and try again.";
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const honeypot = typeof record.website === "string" ? record.website : "";
  const fillMillis =
    typeof record.fillMillis === "number" && Number.isFinite(record.fillMillis)
      ? record.fillMillis
      : null;

  return {
    ok: true,
    input: { email, message, idempotencyKey },
    signals: { honeypot, fillMillis },
  };
}

export function looksLikeBot(signals: BotSignals): boolean {
  if (signals.honeypot.trim().length > 0) return true;
  if (signals.fillMillis === null) return true;
  return (
    signals.fillMillis < LIMITS.minFillMillis ||
    signals.fillMillis > LIMITS.maxFillMillis
  );
}
