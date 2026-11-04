import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { COLLECTIONS } from "@/lib/inquiries/constants";
import { clearEmulator, emulatorAvailable, testDb } from "./emulator";

/**
 * Runs the real production build (`next build` output) over the Firestore REST
 * transport against the emulator. Unit/integration tests run unbundled and
 * cannot see bundler-only bugs, e.g. minification renaming protobuf's `Long`
 * class, which broke every integer write on Vercel.
 *
 * Needs a prior `npm run build`. Enabled with BUNDLE_E2E=1 (see `npm run test:e2e`).
 */
const enabled = emulatorAvailable && process.env.BUNDLE_E2E === "1";
const PORT = 3999;
const BASE = `http://127.0.0.1:${PORT}`;

describe.skipIf(!enabled)("production bundle + Firestore REST (emulator, mock mailer)", () => {
  let server: ChildProcess;
  const db = enabled ? testDb() : (null as never);

  beforeAll(async () => {
    await clearEmulator();
    server = spawn("npx", ["next", "start", "-p", String(PORT)], {
      env: {
        ...process.env,
        FIREBASE_PROJECT_ID: "demo-liberty-scoping",
        INQUIRY_MAIL_PROVIDER: "mock",
        INQUIRY_BUSINESS_EMAIL: "business@example.test",
        INQUIRY_FROM_EMAIL: "contact@libertyscoping.com",
        INQUIRY_HASH_SALT: "bundle-e2e",
        NEXT_PUBLIC_SITE_URL: BASE,
      },
      stdio: "ignore",
    });
    for (let i = 0; i < 60; i += 1) {
      try {
        await fetch(`${BASE}/contact`);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error("next start did not become ready (run `npm run build` first)");
  }, 60_000);

  afterAll(() => {
    server?.kill();
  });

  const submit = (over: Record<string, unknown> = {}) =>
    fetch(`${BASE}/api/inquiries`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE, "x-forwarded-for": "198.51.100.7" },
      body: JSON.stringify({
        email: "bundle@example.test",
        message: "Bundle end-to-end inquiry.",
        idempotencyKey: "bundlee2ekey0000000000000001",
        website: "",
        fillMillis: 10_000,
        ...over,
      }),
    });

  it("stores an inquiry with counter, idempotency, rate limit and email status writes", async () => {
    const response = await submit();
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(json.referenceNumber).toMatch(/^LS-\d{4}-000001$/);

    const docs = await db.collection(COLLECTIONS.inquiries).get();
    expect(docs.size).toBe(1);
    expect(docs.docs[0].get("businessEmailStatus")).toBe("sent");
    expect(docs.docs[0].get("confirmationEmailStatus")).toBe("sent");
    expect(docs.docs[0].get("referenceSequence")).toBe(1);
    expect((await db.collection(COLLECTIONS.rateLimits).get()).size).toBe(2);
    expect((await db.collection(COLLECTIONS.counters).get()).size).toBe(1);
    expect((await db.collection(COLLECTIONS.idempotency).get()).size).toBe(1);
  });

  it("returns the same reference for a repeated submission", async () => {
    const response = await submit();
    const json = await response.json();
    expect(response.status).toBe(200);
    expect(json.duplicate).toBe(true);
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(1);
  });

  it("issues the next sequential reference for a new submission", async () => {
    const response = await submit({ email: "second@example.test", idempotencyKey: "bundlee2ekey0000000000000002" });
    const json = await response.json();
    expect(response.status).toBe(201);
    expect(json.referenceNumber).toMatch(/^LS-\d{4}-000002$/);
  });
});
