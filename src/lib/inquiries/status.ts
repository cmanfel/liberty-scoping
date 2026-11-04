import type { Firestore } from "@google-cloud/firestore";
import { COLLECTIONS } from "./constants";
import type { InquiryConfig } from "./config";
import {
  describeKeyShape,
  domainOf,
  logEvent,
  sanitizeDiagnostic,
  tokenMatches,
} from "./diagnostics";
import { referenceYearFor } from "./reference";

const RESEND_DOMAINS_ENDPOINT = "https://api.resend.com/domains";
const BUSINESS_DOMAIN = "libertyscoping.com";

export interface StatusDeps {
  getDb: () => Firestore;
  getConfig: () => InquiryConfig;
  env?: Record<string, string | undefined>;
  fetch?: typeof fetch;
  timeoutMillis?: number;
}

interface Check {
  ok: boolean | null;
  reason: string;
  [extra: string]: unknown;
}

function noStoreJson(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function checkConfig(
  config: InquiryConfig,
  env: Record<string, string | undefined>,
): Check {
  const key = describeKeyShape(env.INQUIRY_MAIL_API_KEY);
  const presence = {
    INQUIRY_MAIL_PROVIDER: config.mailProvider !== null,
    INQUIRY_MAIL_API_KEY: key.present,
    INQUIRY_FROM_EMAIL: config.fromEmail !== null,
    INQUIRY_BUSINESS_EMAIL: config.businessEmail !== null,
    INQUIRY_RETRY_TOKEN: config.retryToken !== null,
  };
  let reason = "ok";
  if (!presence.INQUIRY_MAIL_PROVIDER) reason = "missing_provider";
  else if (config.mailProvider !== "resend") reason = "provider_not_resend";
  else if (!presence.INQUIRY_MAIL_API_KEY) reason = "missing_api_key";
  else if (!key.looksValid) reason = "malformed_api_key";
  else if (!presence.INQUIRY_FROM_EMAIL) reason = "missing_from_email";
  else if (!presence.INQUIRY_BUSINESS_EMAIL) reason = "missing_business_email";
  return {
    ok: reason === "ok",
    reason,
    provider: config.mailProvider,
    present: presence,
    apiKeyShape: key,
    vercelEnv: env.VERCEL_ENV ?? null,
  };
}

interface DomainRecord {
  name: string;
  status: string;
}

async function checkResend(
  config: InquiryConfig,
  env: Record<string, string | undefined>,
  deps: StatusDeps,
): Promise<{ key: Check; domain: Check }> {
  const apiKey = env.INQUIRY_MAIL_API_KEY?.trim();
  const skipped = (reason: string): { key: Check; domain: Check } => ({
    key: { ok: null, reason },
    domain: { ok: null, reason },
  });
  if (config.mailProvider !== "resend") return skipped("provider_not_resend");
  if (!apiKey) return skipped("missing_api_key");

  const doFetch = deps.fetch ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMillis ?? 8000);
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await doFetch(RESEND_DOMAINS_ENDPOINT, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    const reason = aborted ? "resend_timeout" : "resend_network";
    return {
      key: { ok: false, reason },
      domain: { ok: null, reason: "key_not_verified" },
    };
  } finally {
    clearTimeout(timer);
  }

  let payload: { name?: unknown; message?: unknown; data?: unknown } | null = null;
  try {
    const data: unknown = await response.json();
    payload = typeof data === "object" && data !== null ? data : null;
  } catch {
    payload = null;
  }
  const durationMs = Date.now() - startedAt;
  const providerCode =
    typeof payload?.name === "string" ? payload.name.replace(/[^a-z0-9_]/gi, "").slice(0, 60) : null;

  if (!response.ok) {
    // A send-only key is valid for sending but cannot list domains.
    if (response.status === 401 && providerCode === "restricted_api_key") {
      return {
        key: {
          ok: null,
          reason: "send_only_key_cannot_list_domains",
          httpStatus: response.status,
          providerCode,
          durationMs,
        },
        domain: { ok: null, reason: "cannot_verify_with_send_only_key" },
      };
    }
    const reason =
      response.status === 401 || response.status === 403
        ? "resend_auth"
        : response.status === 429
          ? "resend_rate_limited"
          : response.status >= 500
            ? "resend_server_error"
            : "resend_rejected";
    return {
      key: {
        ok: false,
        reason,
        httpStatus: response.status,
        providerCode,
        message: sanitizeDiagnostic(payload?.message),
        durationMs,
      },
      domain: { ok: null, reason: "key_not_verified" },
    };
  }

  const list = Array.isArray(payload?.data) ? (payload.data as unknown[]) : [];
  const domains: DomainRecord[] = list
    .map((item) => item as { name?: unknown; status?: unknown })
    .filter((item) => typeof item.name === "string" && typeof item.status === "string")
    .map((item) => ({
      name: (item.name as string).toLowerCase(),
      status: item.status as string,
    }));

  const fromDomain = domainOf(config.fromEmail);
  const business = domains.find((d) => d.name === BUSINESS_DOMAIN);
  const match = fromDomain
    ? domains.find((d) => fromDomain === d.name || fromDomain.endsWith(`.${d.name}`))
    : undefined;

  let domainReason = "ok";
  if (!fromDomain) domainReason = "missing_from_email";
  else if (!match) domainReason = "from_domain_not_in_resend";
  else if (match.status !== "verified") domainReason = `from_domain_${match.status}`;

  return {
    key: { ok: true, reason: "ok", httpStatus: response.status, durationMs },
    domain: {
      ok: domainReason === "ok",
      reason: domainReason,
      fromDomain,
      fromDomainStatus: match?.status ?? null,
      libertyscopingDomain: business ? business.status : "not_found",
      domainCount: domains.length,
    },
  };
}

async function checkFirestore(deps: StatusDeps): Promise<Check> {
  try {
    const year = referenceYearFor(new Date());
    await deps
      .getDb()
      .collection(COLLECTIONS.counters)
      .doc(`inquiries-${year}`)
      .get();
    return { ok: true, reason: "ok" };
  } catch (error) {
    const e = error as { name?: unknown; code?: unknown; message?: unknown } | null;
    return {
      ok: false,
      reason: "firestore_error",
      errorName: typeof e?.name === "string" ? e.name : typeof error,
      errorCode:
        typeof e?.code === "string" || typeof e?.code === "number" ? e.code : null,
      message: sanitizeDiagnostic(e?.message),
    };
  }
}

/**
 * Protected, read-only diagnostics. Verifies configuration presence, that the
 * Resend key authenticates and the sending domain is verified (GET /domains),
 * and that Firestore is reachable. Never sends email and never writes data.
 */
export async function handleStatusRequest(
  request: Request,
  deps: StatusDeps,
): Promise<Response> {
  const config = deps.getConfig();
  if (!config.retryToken) return new Response(null, { status: 404 });
  if (!tokenMatches(request.headers.get("authorization"), config.retryToken)) {
    return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const env = deps.env ?? process.env;
  const [resend, firestore] = await Promise.all([
    checkResend(config, env, deps),
    checkFirestore(deps),
  ]);
  const checks = {
    config: checkConfig(config, env),
    resendKey: resend.key,
    resendDomain: resend.domain,
    firestore,
  };
  const ok = Object.values(checks).every((check) => check.ok === true);
  logEvent("status_check", {
    ok,
    results: Object.fromEntries(
      Object.entries(checks).map(([name, check]) => [name, `${check.ok}:${check.reason}`]),
    ),
  });
  return noStoreJson(200, { ok, checkedAt: new Date().toISOString(), checks });
}
