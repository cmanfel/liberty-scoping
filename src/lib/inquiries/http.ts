import type { Firestore } from "@google-cloud/firestore";
import { LIMITS, RATE_LIMITS } from "./constants";
import type { InquiryConfig } from "./config";
import { saltedHash } from "./hash";
import type { Mailer } from "./mailer";
import { consumeRateLimit } from "./rate-limit";
import {
  IdempotencyConflictError,
  createInquiry,
  deliverInquiryEmails,
  findByIdempotencyKey,
  retryUnsentEmails,
  type DeliveryDeps,
} from "./service";
import { looksLikeBot, validateInquiryPayload } from "./validation";

export interface HandlerDeps {
  getDb: () => Firestore;
  getConfig: () => InquiryConfig;
  getMailer: (provider: string | null) => Mailer;
  emailTimeoutMillis?: number;
}

const GENERIC_ERROR =
  "We could not submit your inquiry right now. Please try again in a moment or email us directly.";

function json(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function failure(
  status: number,
  code: string,
  message: string,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return json(status, { ok: false, code, message, ...extra }, headers);
}

export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || null;
}

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function isAllowedOrigin(request: Request, config: InquiryConfig): boolean {
  const originHost = hostOf(request.headers.get("origin"));
  if (!originHost) return false;
  const requestHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const siteHost = new URL(config.siteOrigin).host;
  return (
    originHost === requestHost ||
    originHost === siteHost ||
    originHost === `www.${siteHost}`
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function deliveryDeps(deps: HandlerDeps, config: InquiryConfig): DeliveryDeps {
  return {
    businessEmail: config.businessEmail,
    fromEmail: config.fromEmail,
    getMailer: () => deps.getMailer(config.mailProvider),
  };
}

export async function handleInquiryRequest(
  request: Request,
  deps: HandlerDeps,
): Promise<Response> {
  try {
    const config = deps.getConfig();

    if (!isAllowedOrigin(request, config)) {
      return failure(403, "forbidden", "This request could not be accepted.");
    }
    if (!(request.headers.get("content-type") ?? "").includes("application/json")) {
      return failure(415, "unsupported_media_type", "This request could not be accepted.");
    }
    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > LIMITS.requestBodyMaxBytes) {
      return failure(413, "too_large", "Your inquiry is too large to submit.");
    }
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > LIMITS.requestBodyMaxBytes) {
      return failure(413, "too_large", "Your inquiry is too large to submit.");
    }

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return failure(400, "invalid_json", "This request could not be accepted.");
    }

    const validation = validateInquiryPayload(payload);
    if (!validation.ok) {
      return failure(400, "validation_failed", "Please check the highlighted fields.", {
        fieldErrors: validation.fieldErrors,
      });
    }
    const { input, signals } = validation;
    if (looksLikeBot(signals)) {
      return failure(
        400,
        "rejected",
        "We could not submit your inquiry. Please reload the page and try again.",
      );
    }

    const db = deps.getDb();
    const delivery = deliveryDeps(deps, config);
    const timeout = deps.emailTimeoutMillis ?? 10_000;

    const existing = await findByIdempotencyKey(db, input, config.hashSalt);
    if (existing) {
      await withTimeout(deliverInquiryEmails(db, existing.inquiryId, delivery), timeout);
      return json(200, {
        ok: true,
        referenceNumber: existing.referenceNumber,
        duplicate: true,
      });
    }

    const ip = clientIp(request);
    const ipLimit = await consumeRateLimit(
      db,
      "ip",
      saltedHash(config.hashSalt, `ip:${ip ?? "unknown"}`),
      RATE_LIMITS.perIp,
    );
    const emailLimit = ipLimit.allowed
      ? await consumeRateLimit(
          db,
          "email",
          saltedHash(config.hashSalt, `email:${input.email}`),
          RATE_LIMITS.perEmail,
        )
      : ipLimit;
    if (!ipLimit.allowed || !emailLimit.allowed) {
      const retryAfter = Math.max(ipLimit.retryAfterSeconds, emailLimit.retryAfterSeconds);
      return failure(
        429,
        "rate_limited",
        "You have submitted several inquiries recently. Please try again later or email us directly.",
        {},
        { "Retry-After": String(retryAfter) },
      );
    }

    const created = await createInquiry(db, input, {
      salt: config.hashSalt,
      clientIp: ip,
      userAgent: request.headers.get("user-agent"),
    });

    await withTimeout(deliverInquiryEmails(db, created.inquiryId, delivery), timeout);

    return json(created.duplicate ? 200 : 201, {
      ok: true,
      referenceNumber: created.referenceNumber,
      duplicate: created.duplicate,
    });
  } catch (error) {
    if (error instanceof IdempotencyConflictError) {
      return failure(
        409,
        "idempotency_conflict",
        "This submission could not be accepted. Please reload the page and try again.",
      );
    }
    console.error("[inquiries] submission failed", {
      name: error instanceof Error ? error.name : "unknown",
    });
    return failure(500, "server_error", GENERIC_ERROR);
  }
}

/** Protected re-send of unsent notification emails. Never creates inquiries. */
export async function handleRetryRequest(
  request: Request,
  deps: HandlerDeps,
): Promise<Response> {
  const config = deps.getConfig();
  if (!config.retryToken) return new Response(null, { status: 404 });
  const supplied = request.headers.get("authorization") ?? "";
  if (supplied !== `Bearer ${config.retryToken}`) {
    return new Response(null, { status: 401 });
  }
  try {
    const result = await retryUnsentEmails(deps.getDb(), deliveryDeps(deps, config));
    return json(200, { ok: true, ...result });
  } catch {
    console.error("[inquiries] retry failed");
    return failure(500, "server_error", GENERIC_ERROR);
  }
}
