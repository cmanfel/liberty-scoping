import { describe, expect, it, vi } from "vitest";
import type { Firestore } from "@google-cloud/firestore";
import { readConfig } from "@/lib/inquiries/config";
import { handleStatusRequest, type StatusDeps } from "@/lib/inquiries/status";

const KEY = `re_${"a".repeat(8)}_${"b".repeat(24)}`;
const TOKEN = "retry-token-value-123";
const baseEnv = {
  INQUIRY_MAIL_PROVIDER: "resend",
  INQUIRY_MAIL_API_KEY: KEY,
  INQUIRY_FROM_EMAIL: "contact@libertyscoping.com",
  INQUIRY_BUSINESS_EMAIL: "owner@example.test",
  INQUIRY_RETRY_TOKEN: TOKEN,
  VERCEL_ENV: "production",
};

function fakeDb(behavior: "ok" | "fail" = "ok") {
  const get = vi.fn(async () => {
    if (behavior === "fail") throw Object.assign(new Error("PERMISSION_DENIED for owner@example.test"), { code: 7 });
    return { exists: false };
  });
  const set = vi.fn();
  const db = { collection: () => ({ doc: () => ({ get, set }) }) } as unknown as Firestore;
  return { db, get, set };
}

function resendFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

function deps(over: Partial<StatusDeps> & { env?: Record<string, string | undefined> } = {}) {
  const env = over.env ?? baseEnv;
  const { db } = fakeDb();
  return {
    getDb: () => db,
    getConfig: () => readConfig(env),
    env,
    fetch: resendFetch(200, { data: [{ name: "libertyscoping.com", status: "verified" }] }) as unknown as typeof fetch,
    ...over,
  } satisfies StatusDeps;
}

const get = (token: string | null = TOKEN) =>
  new Request("https://www.libertyscoping.com/api/inquiries/status", {
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
  });

async function run(d: StatusDeps, token: string | null = TOKEN) {
  const res = await handleStatusRequest(get(token), d);
  return { res, body: res.status === 200 ? await res.json() : null };
}

describe("GET /api/inquiries/status handler (mock fetch, no real Resend)", () => {
  it("returns 404 when no retry token is configured and 401 for wrong/missing tokens", async () => {
    const noToken = { ...baseEnv, INQUIRY_RETRY_TOKEN: undefined };
    expect((await run(deps({ env: noToken }))).res.status).toBe(404);
    const wrong = await run(deps(), "nope");
    expect(wrong.res.status).toBe(401);
    expect(wrong.res.headers.get("cache-control")).toBe("no-store");
    expect((await run(deps(), null)).res.status).toBe(401);
  });

  it("reports everything ok with a verified domain, never calls /emails, never writes", async () => {
    const fetchMock = resendFetch(200, {
      data: [
        { name: "libertyscoping.com", status: "verified" },
        { name: "other.example", status: "pending" },
      ],
    });
    const { db, set } = fakeDb();
    const { res, body } = await run(deps({ fetch: fetchMock as unknown as typeof fetch, getDb: () => db }));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.checks.config).toMatchObject({ ok: true, reason: "ok" });
    expect(body.checks.resendKey).toMatchObject({ ok: true, httpStatus: 200 });
    expect(body.checks.resendDomain).toMatchObject({
      ok: true,
      fromDomain: "libertyscoping.com",
      fromDomainStatus: "verified",
      libertyscopingDomain: "verified",
    });
    expect(body.checks.firestore).toMatchObject({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/domains");
    expect(init.method).toBe("GET");
    expect(set).not.toHaveBeenCalled();
  });

  it("contains no secrets or addresses in the output", async () => {
    const { res } = await run(deps());
    const text = JSON.stringify(await (await handleStatusRequest(get(), deps())).json());
    expect(res.status).toBe(200);
    for (const secret of [KEY, TOKEN, "owner@example.test", "aaaaaaaa"]) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain('"INQUIRY_MAIL_API_KEY":true');
  });

  it("flags a pending sending domain", async () => {
    const { body } = await run(
      deps({ fetch: resendFetch(200, { data: [{ name: "libertyscoping.com", status: "pending" }] }) as unknown as typeof fetch }),
    );
    expect(body.ok).toBe(false);
    expect(body.checks.resendKey.ok).toBe(true);
    expect(body.checks.resendDomain).toMatchObject({ ok: false, reason: "from_domain_pending", fromDomainStatus: "pending" });
  });

  it("flags a from address whose domain is not in Resend, and accepts verified parent domains", async () => {
    const missing = await run(
      deps({
        env: { ...baseEnv, INQUIRY_FROM_EMAIL: "contact@elsewhere.example" },
        fetch: resendFetch(200, { data: [{ name: "libertyscoping.com", status: "verified" }] }) as unknown as typeof fetch,
      }),
    );
    expect(missing.body.checks.resendDomain).toMatchObject({ ok: false, reason: "from_domain_not_in_resend" });

    const sub = await run(
      deps({
        env: { ...baseEnv, INQUIRY_FROM_EMAIL: "contact@mail.libertyscoping.com" },
        fetch: resendFetch(200, { data: [{ name: "libertyscoping.com", status: "verified" }] }) as unknown as typeof fetch,
      }),
    );
    expect(sub.body.checks.resendDomain.ok).toBe(true);
  });

  it("reports an invalid key as resend_auth and skips the domain check", async () => {
    const { body } = await run(
      deps({ fetch: resendFetch(401, { name: "validation_error", message: "API key is invalid" }) as unknown as typeof fetch }),
    );
    expect(body.ok).toBe(false);
    expect(body.checks.resendKey).toMatchObject({ ok: false, reason: "resend_auth", httpStatus: 401 });
    expect(body.checks.resendDomain).toMatchObject({ ok: null, reason: "key_not_verified" });
  });

  it("treats a send-only key as unknown rather than failed", async () => {
    const { body } = await run(
      deps({
        fetch: resendFetch(401, { name: "restricted_api_key", message: "This API key is restricted to only send emails" }) as unknown as typeof fetch,
      }),
    );
    expect(body.checks.resendKey).toMatchObject({ ok: null, reason: "send_only_key_cannot_list_domains" });
    expect(body.checks.resendDomain.ok).toBeNull();
  });

  it("detects a malformed (truncated) key and a missing provider without echoing the key", async () => {
    const truncated = await run(deps({ env: { ...baseEnv, INQUIRY_MAIL_API_KEY: "re_abcd..." } }));
    expect(truncated.body.checks.config).toMatchObject({ ok: false, reason: "malformed_api_key" });
    expect(truncated.body.checks.config.apiKeyShape).toMatchObject({ startsWithRe: true, hasEllipsis: true, looksValid: false });
    expect(JSON.stringify(truncated.body)).not.toContain("re_abcd");

    const noProvider = await run(deps({ env: { ...baseEnv, INQUIRY_MAIL_PROVIDER: undefined } }));
    expect(noProvider.body.checks.config.reason).toBe("missing_provider");
    expect(noProvider.body.checks.resendKey).toMatchObject({ ok: null, reason: "provider_not_resend" });
  });

  it("reports network failures and Firestore errors with short reason codes", async () => {
    const down = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const { db } = fakeDb("fail");
    const { body } = await run(deps({ fetch: down, getDb: () => db }));
    expect(body.checks.resendKey).toMatchObject({ ok: false, reason: "resend_network" });
    expect(body.checks.firestore).toMatchObject({ ok: false, reason: "firestore_error", errorCode: 7 });
    expect(JSON.stringify(body)).not.toContain("owner@example.test");
  });
});
