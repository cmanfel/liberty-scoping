import { beforeEach, describe, expect, it } from "vitest";
import { Timestamp } from "@google-cloud/firestore";
import { COLLECTIONS } from "@/lib/inquiries/constants";
import {
  IdempotencyConflictError,
  createInquiry,
  deliverInquiryEmails,
  findByIdempotencyKey,
  retryUnsentEmails,
  type DeliveryDeps,
} from "@/lib/inquiries/service";
import { MailerError, MockMailer } from "@/lib/inquiries/mailer";
import { consumeRateLimit } from "@/lib/inquiries/rate-limit";
import { clearEmulator, emulatorAvailable, testDb } from "./emulator";

const ctx = { salt: "test-salt", clientIp: "203.0.113.9", userAgent: "vitest" };
let n = 0;
const input = (over: Partial<{ email: string; message: string; idempotencyKey: string }> = {}) => ({
  email: "customer@example.com",
  message: "Hello there, I need a quote.",
  idempotencyKey: `key${String(++n).padStart(20, "0")}`,
  ...over,
});

describe.skipIf(!emulatorAvailable)("inquiry service (Firestore emulator)", () => {
  const db = emulatorAvailable ? testDb() : (null as never);
  beforeEach(clearEmulator);

  it("creates sequential reference numbers and the documented record", async () => {
    const a = await createInquiry(db, input(), { ...ctx, now: new Date("2026-05-01T00:00:00Z") });
    const b = await createInquiry(db, input(), { ...ctx, now: new Date("2026-05-02T00:00:00Z") });
    expect(a.referenceNumber).toBe("LS-2026-000001");
    expect(b.referenceNumber).toBe("LS-2026-000002");
    expect(a.duplicate).toBe(false);

    const doc = (await db.collection(COLLECTIONS.inquiries).doc(a.inquiryId).get()).data()!;
    expect(doc).toMatchObject({
      referenceNumber: "LS-2026-000001",
      email: "customer@example.com",
      message: "Hello there, I need a quote.",
      status: "new",
      businessEmailStatus: "pending",
      confirmationEmailStatus: "pending",
    });
    expect(doc.createdAt).toBeInstanceOf(Timestamp);
    expect(doc.clientIpHash).not.toContain("203.0.113.9");
    const counter = (await db.collection(COLLECTIONS.counters).doc("inquiries-2026").get()).data()!;
    expect(counter.lastSequence).toBe(2);
  });

  it("resets the sequence each calendar year", async () => {
    await createInquiry(db, input(), { ...ctx, now: new Date("2026-12-31T23:59:00Z") });
    const next = await createInquiry(db, input(), { ...ctx, now: new Date("2027-01-01T00:01:00Z") });
    expect(next.referenceNumber).toBe("LS-2027-000001");
  });

  it("never issues duplicate reference numbers under concurrency", async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, () => createInquiry(db, input(), { ...ctx, now: new Date("2026-06-01T00:00:00Z") })),
    );
    const refs = results.map((r) => r.referenceNumber);
    expect(new Set(refs).size).toBe(25);
    expect(refs.sort()[0]).toBe("LS-2026-000001");
    expect(refs.sort()[24]).toBe("LS-2026-000025");
    const count = (await db.collection(COLLECTIONS.inquiries).get()).size;
    expect(count).toBe(25);
  });

  it("is idempotent for repeated and concurrent identical submissions", async () => {
    const same = input();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => createInquiry(db, same, ctx)),
    );
    expect(new Set(results.map((r) => r.referenceNumber)).size).toBe(1);
    expect(results.filter((r) => !r.duplicate)).toHaveLength(1);
    expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(1);
    const found = await findByIdempotencyKey(db, same, ctx.salt);
    expect(found?.duplicate).toBe(true);
    expect(found?.referenceNumber).toBe(results[0].referenceNumber);
  });

  it("rejects an idempotency key reused with different content", async () => {
    const first = input();
    await createInquiry(db, first, ctx);
    await expect(
      createInquiry(db, { ...first, message: "A completely different message." }, ctx),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  describe("email delivery", () => {
    const makeDeps = (mailer: MockMailer, over: Partial<DeliveryDeps> = {}): DeliveryDeps => ({
      getMailer: () => mailer,
      businessEmail: "business@example.com",
      fromEmail: "contact@libertyscoping.com",
      ...over,
    });

    it("sends both emails with the same reference and records status", async () => {
      const created = await createInquiry(db, input(), ctx);
      const mailer = new MockMailer();
      const outcome = await deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer));
      expect(outcome).toEqual({ business: "sent", confirmation: "sent" });
      expect(mailer.outbox).toHaveLength(2);
      for (const mail of mailer.outbox) {
        expect(mail.subject).toContain(created.referenceNumber);
        expect(mail.text).toContain(created.referenceNumber);
      }
      const business = mailer.outbox.find((m) => m.to === "business@example.com")!;
      expect(business.replyTo).toBe("customer@example.com");
      expect(mailer.outbox.find((m) => m.to === "customer@example.com")).toBeTruthy();

      const doc = (await db.collection(COLLECTIONS.inquiries).doc(created.inquiryId).get()).data()!;
      expect(doc.businessEmailStatus).toBe("sent");
      expect(doc.confirmationEmailStatus).toBe("sent");
      expect(doc.businessEmailSentAt).toBeInstanceOf(Timestamp);
      expect(doc.businessEmailProviderMessageId).toMatch(/^mock-/);
    });

    it("keeps the inquiry when email fails and retries only the failed email", async () => {
      const created = await createInquiry(db, input(), ctx);
      const mailer = new MockMailer();
      mailer.failWith = (m) =>
        m.to === "business@example.com" ? new MailerError("provider down", "provider_error") : null;

      const first = await deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer));
      expect(first).toEqual({ business: "failed", confirmation: "sent" });
      const failed = (await db.collection(COLLECTIONS.inquiries).doc(created.inquiryId).get()).data()!;
      expect(failed.message).toBe("Hello there, I need a quote.");
      expect(failed.businessEmailLastError).toContain("provider_error");
      expect(failed.businessEmailAttempts).toBe(1);

      mailer.failWith = null;
      const second = await deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer));
      expect(second).toEqual({ business: "sent", confirmation: "sent" });
      expect(mailer.outbox).toHaveLength(2);
      expect(mailer.outbox.filter((m) => m.to === "customer@example.com")).toHaveLength(1);

      const third = await deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer));
      expect(third).toEqual({ business: "sent", confirmation: "sent" });
      expect(mailer.outbox).toHaveLength(2);
      expect((await db.collection(COLLECTIONS.inquiries).get()).size).toBe(1);
    });

    it("records not-configured failures without losing the inquiry", async () => {
      const created = await createInquiry(db, input(), ctx);
      const outcome = await deliverInquiryEmails(
        db,
        created.inquiryId,
        makeDeps(new MockMailer(), { businessEmail: null }),
      );
      expect(outcome).toEqual({ business: "failed", confirmation: "sent" });
      const doc = (await db.collection(COLLECTIONS.inquiries).doc(created.inquiryId).get()).data()!;
      expect(doc.businessEmailLastError).toContain("mailer_not_configured");
    });

    it("does not double-send when delivery runs concurrently", async () => {
      const created = await createInquiry(db, input(), ctx);
      const mailer = new MockMailer();
      await Promise.all(
        Array.from({ length: 5 }, () => deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer))),
      );
      expect(mailer.outbox).toHaveLength(2);
    });

    it("stops retrying after the maximum attempts", async () => {
      const created = await createInquiry(db, input(), ctx);
      const mailer = new MockMailer();
      mailer.failWith = () => new MailerError("nope", "provider_error");
      for (let i = 0; i < 8; i += 1) {
        await deliverInquiryEmails(db, created.inquiryId, makeDeps(mailer));
      }
      const doc = (await db.collection(COLLECTIONS.inquiries).doc(created.inquiryId).get()).data()!;
      expect(doc.businessEmailAttempts).toBe(5);
    });

    it("retryUnsentEmails resends only old unsent inquiries", async () => {
      const old = await createInquiry(db, input(), ctx);
      const mailer = new MockMailer();
      mailer.failWith = () => new MailerError("down", "provider_error");
      await deliverInquiryEmails(db, old.inquiryId, makeDeps(mailer));
      mailer.failWith = null;

      const tooSoon = await retryUnsentEmails(db, makeDeps(mailer), Date.now());
      expect(tooSoon.retried).toBe(0);

      const later = await retryUnsentEmails(db, makeDeps(mailer), Date.now() + 10 * 60 * 1000);
      expect(later.retried).toBe(1);
      expect(mailer.outbox).toHaveLength(2);
      const again = await retryUnsentEmails(db, makeDeps(mailer), Date.now() + 20 * 60 * 1000);
      expect(again.retried).toBe(0);
      expect(mailer.outbox).toHaveLength(2);
    });
  });

  it("enforces fixed-window rate limits", async () => {
    const rule = { max: 3, windowSeconds: 3600 };
    const t = Date.UTC(2026, 0, 1, 12, 0, 0);
    const results = [];
    for (let i = 0; i < 5; i += 1) results.push(await consumeRateLimit(db, "ip", "abc", rule, t));
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false, false]);
    expect(results[3].retryAfterSeconds).toBeGreaterThan(0);
    expect((await consumeRateLimit(db, "ip", "other", rule, t)).allowed).toBe(true);
    expect((await consumeRateLimit(db, "ip", "abc", rule, t + 3600_000)).allowed).toBe(true);
  });
});
