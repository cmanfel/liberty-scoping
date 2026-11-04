import { beforeEach, describe, expect, it } from "vitest";
import { COLLECTIONS } from "@/lib/inquiries/constants";
import type { InquiryConfig } from "@/lib/inquiries/config";
import { handleInquiryRequest, handleRetryRequest, type HandlerDeps } from "@/lib/inquiries/http";
import { MailerError, MailerNotConfiguredError, MockMailer } from "@/lib/inquiries/mailer";
import { clearEmulator, emulatorAvailable, testDb } from "./emulator";

const config: InquiryConfig = {
  businessEmail: "business@example.com",
  fromEmail: "contact@libertyscoping.com",
  mailProvider: "mock",
  hashSalt: "test-salt",
  retryToken: "retry-secret",
  siteOrigin: "https://libertyscoping.com",
};

let counter = 0;
function body(over: Record<string, unknown> = {}) {
  counter += 1;
  return {
    email: `customer${counter}@example.com`,
    message: "I need assistance with a transcript.",
    idempotencyKey: `idem${String(counter).padStart(24, "0")}`,
    website: "",
    fillMillis: 15_000,
    ...over,
  };
}

function post(payload: unknown, headers: Record<string, string> = {}, raw?: string) {
  return new Request("https://libertyscoping.com/api/inquiries", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://libertyscoping.com",
      "x-forwarded-for": `198.51.100.${(counter % 200) + 1}`,
      ...headers,
    },
    body: raw ?? JSON.stringify(payload),
  });
}

describe.skipIf(!emulatorAvailable)("POST /api/inquiries handler (Firestore emulator, mock mailer)", () => {
  const db = emulatorAvailable ? testDb() : (null as never);
  let mailer: MockMailer;
  let deps: HandlerDeps;

  beforeEach(async () => {
    await clearEmulator();
    mailer = new MockMailer();
    deps = {
      getDb: () => db,
      getConfig: () => config,
      getMailer: () => mailer,
      emailTimeoutMillis: 5000,
    };
  });

  it("persists, emails both parties, and returns the reference number", async () => {
    const payload = body();
    const response = await handleInquiryRequest(post(payload), deps);
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(json).toMatchObject({ ok: true, duplicate: false });
    expect(json.referenceNumber).toMatch(/^LS-\d{4}-000001$/);

    expect(mailer.outbox).toHaveLength(2);
    const [bizMail] = mailer.outbox.filter((m) => m.to === "business@example.com");
    const [custMail] = mailer.outbox.filter((m) => m.to === payload.email);
    expect(bizMail.subject).toContain(json.referenceNumber);
    expect(custMail.subject).toContain(json.referenceNumber);
    expect(bizMail.replyTo).toBe(payload.email);

    const docs = await db.collection(COLLECTIONS.inquiries).get();
    expect(docs.size).toBe(1);
    expect(docs.docs[0].get("businessEmailStatus")).toBe("sent");
    expect(docs.docs[0].get("confirmationEmailStatus")).toBe("sent");
  });

  it("treats a repeated submission as a duplicate without a new inquiry or emails", async () => {
    const payload = body();
    const first = await (await handleInquiryRequest(post(payload), deps)).json();
    const second = await handleInquiryRequest(post(payload), deps);
    const secondJson = await second.json();
    expect(second.status).toBe(200);
    expect(secondJson.duplicate).toBe(true);
    expect(secondJson.referenceNumber).toBe(first.referenceNumber);
    expect(mailer.outbox).toHaveLength(2);
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(1);
  });

  it("returns the reference even when email fails, and a retry sends only what is missing", async () => {
    mailer.failWith = () => new MailerError("down", "provider_error");
    const payload = body();
    const first = await handleInquiryRequest(post(payload), deps);
    const firstJson = await first.json();
    expect(first.status).toBe(201);
    expect(firstJson.referenceNumber).toBeTruthy();
    expect((await db.collection(COLLECTIONS.inquiries).get()).docs[0].get("businessEmailStatus")).toBe("failed");

    mailer.failWith = null;
    const retry = await handleInquiryRequest(post(payload), deps);
    expect((await retry.json()).duplicate).toBe(true);
    expect(mailer.outbox).toHaveLength(2);
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(1);
  });

  it("still succeeds when no mail provider is configured", async () => {
    deps.getMailer = () => {
      throw new MailerNotConfiguredError("INQUIRY_MAIL_PROVIDER is not set");
    };
    const response = await handleInquiryRequest(post(body()), deps);
    expect(response.status).toBe(201);
    const doc = (await db.collection(COLLECTIONS.inquiries).get()).docs[0];
    expect(doc.get("businessEmailStatus")).toBe("failed");
    expect(doc.get("businessEmailLastError")).toContain("mailer_not_configured");
  });

  it("rejects invalid, oversized, bot and cross-origin requests without storing", async () => {
    const cases: Array<[Request, number]> = [
      [post(body({ email: "nope" })), 400],
      [post(body({ message: "" })), 400],
      [post(body({ message: "x".repeat(5001) })), 400],
      [post(body({ website: "http://spam.example" })), 400],
      [post(body({ fillMillis: 50 })), 400],
      [post(null, {}, "{not json"), 400],
      [post(body({ message: "y".repeat(20_000) })), 413],
      [post(body(), { origin: "https://evil.example" }), 403],
      [post(body(), { "content-type": "text/plain" }), 415],
    ];
    for (const [request, status] of cases) {
      const response = await handleInquiryRequest(request, deps);
      expect(response.status).toBe(status);
    }
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(0);
    expect(mailer.outbox).toHaveLength(0);
  });

  it("returns field errors for validation failures", async () => {
    const response = await handleInquiryRequest(post(body({ email: "bad" })), deps);
    const json = await response.json();
    expect(json.ok).toBe(false);
    expect(json.fieldErrors.email).toBeTruthy();
  });

  it("rate limits per IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      const response = await handleInquiryRequest(post(body(), { "x-forwarded-for": "192.0.2.77" }), deps);
      statuses.push(response.status);
      if (response.status === 429) expect(response.headers.get("retry-after")).toBeTruthy();
    }
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses.slice(5)).toEqual([429, 429]);
  });

  it("rate limits per email address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const response = await handleInquiryRequest(post(body({ email: "same@example.com" })), deps);
      statuses.push(response.status);
    }
    expect(statuses).toEqual([201, 201, 201, 429]);
  });

  it("issues unique reference numbers for concurrent requests", async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        handleInquiryRequest(post(body(), { "x-forwarded-for": `10.0.0.${i + 1}` }), deps).then((r) => r.json()),
      ),
    );
    const refs = responses.map((r) => r.referenceNumber);
    expect(new Set(refs).size).toBe(6);
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(6);
  });

  it("does not leak internal errors", async () => {
    deps.getDb = () => {
      throw new Error("secret internal detail: credentials at /path");
    };
    const response = await handleInquiryRequest(post(body()), deps);
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain("secret internal detail");
  });

  describe("retry endpoint", () => {
    const retryRequest = (token?: string) =>
      new Request("https://libertyscoping.com/api/inquiries/retry", {
        method: "POST",
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

    it("requires the bearer token", async () => {
      expect((await handleRetryRequest(retryRequest(), deps)).status).toBe(401);
      expect((await handleRetryRequest(retryRequest("wrong"), deps)).status).toBe(401);
      const disabled = { ...deps, getConfig: () => ({ ...config, retryToken: null }) };
      expect((await handleRetryRequest(retryRequest("retry-secret"), disabled)).status).toBe(404);
    });

    it("succeeds with the token", async () => {
      const response = await handleRetryRequest(retryRequest("retry-secret"), deps);
      expect(response.status).toBe(200);
      expect((await response.json()).ok).toBe(true);
    });
  });
});
