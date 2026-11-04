import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Helpers for operational diagnostics. Nothing here may ever emit a secret,
 * an email address or a message body: callers pass already-derived values and
 * free text goes through `sanitizeDiagnostic`.
 */

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const KEY_PATTERN = /\bre_[A-Za-z0-9_]{6,}/g;
const BEARER_PATTERN = /\bBearer\s+\S+/gi;

export function sanitizeDiagnostic(value: unknown, maxLength = 200): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(EMAIL_PATTERN, "[email]")
    .replace(KEY_PATTERN, "[key]")
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return cleaned || null;
}

export function lengthBucket(length: number): string {
  if (length === 0) return "0";
  if (length < 20) return "<20";
  if (length < 32) return "20-31";
  if (length <= 48) return "32-48";
  if (length <= 80) return "49-80";
  return ">80";
}

export interface KeyShape {
  present: boolean;
  startsWithRe: boolean;
  lengthBucket: string;
  hasWhitespace: boolean;
  hasQuotes: boolean;
  hasEllipsis: boolean;
  looksValid: boolean;
}

/**
 * Describes the shape of an API key without revealing any of it, so a
 * truncated or mis-pasted key ("re_abc...", quotes, whitespace) is detectable.
 * Resend keys start with "re_" and are well over 20 characters long.
 */
export function describeKeyShape(raw: string | undefined | null): KeyShape {
  const key = raw ?? "";
  const trimmed = key.trim();
  const startsWithRe = trimmed.startsWith("re_");
  const hasWhitespace = /\s/.test(trimmed) || trimmed.length !== key.length;
  const hasQuotes = /["'`]/.test(trimmed);
  const hasEllipsis = trimmed.includes("...") || trimmed.includes("\u2026");
  return {
    present: trimmed.length > 0,
    startsWithRe,
    lengthBucket: lengthBucket(trimmed.length),
    hasWhitespace,
    hasQuotes,
    hasEllipsis,
    looksValid:
      startsWithRe && trimmed.length >= 20 && !hasWhitespace && !hasQuotes && !hasEllipsis,
  };
}

export function tokenMatches(authorization: string | null, token: string): boolean {
  const expected = createHash("sha256").update(`Bearer ${token}`).digest();
  const actual = createHash("sha256").update(authorization ?? "").digest();
  return timingSafeEqual(expected, actual);
}

export function domainOf(address: string | null | undefined): string | null {
  if (!address) return null;
  const match = address.match(/@([^>\s]+)>?\s*$/);
  return match ? match[1].toLowerCase() : null;
}

export function logEvent(event: string, fields: Record<string, unknown>): void {
  console.info(`[inquiries] ${event} ${JSON.stringify(fields)}`);
}
