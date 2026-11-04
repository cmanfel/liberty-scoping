import { describe, expect, it } from "vitest";
import { formatReference, referenceYearFor } from "@/lib/inquiries/reference";
import {
  isValidEmail,
  looksLikeBot,
  validateInquiryPayload,
} from "@/lib/inquiries/validation";
import {
  buildBusinessEmail,
  buildConfirmationEmail,
  businessSubject,
  confirmationSubject,
  escapeHtml,
} from "@/lib/inquiries/templates";
import { MailerNotConfiguredError, getMailer } from "@/lib/inquiries/mailer";
import { isAllowedOrigin } from "@/lib/inquiries/http";
import { readConfig } from "@/lib/inquiries/config";

const KEY = "a".repeat(32);

describe("reference numbers", () => {
  it("formats LS-YYYY-NNNNNN", () => {
    expect(formatReference(2026, 1)).toBe("LS-2026-000001");
    expect(formatReference(2027, 123456)).toBe("LS-2027-123456");
  });
});

describe("reference year (America/New_York)", () => {
  it("rolls over at midnight Eastern, not UTC", () => {
    expect(referenceYearFor(new Date("2027-01-01T04:59:59Z"))).toBe(2026); // 23:59:59 EST
    expect(referenceYearFor(new Date("2027-01-01T05:00:00Z"))).toBe(2027); // 00:00:00 EST
    expect(referenceYearFor(new Date("2026-12-31T23:30:00-05:00"))).toBe(2026);
    expect(referenceYearFor(new Date("2027-01-01T00:30:00-05:00"))).toBe(2027);
  });

  it("differs from UTC between 19:00 and 24:00 ET on Dec 31", () => {
    const d = new Date("2027-01-01T02:00:00Z");
    expect(d.getUTCFullYear()).toBe(2027);
    expect(referenceYearFor(d)).toBe(2026);
  });

  it("is unaffected by daylight time mid-year", () => {
    expect(referenceYearFor(new Date("2026-07-01T03:59:00Z"))).toBe(2026);
    expect(referenceYearFor(new Date("2026-06-15T12:00:00Z"))).toBe(2026);
  });
});

describe("validation", () => {
  const base = { email: " Person@Example.com ", message: " Need help ", idempotencyKey: KEY };

  it("accepts and normalizes a valid payload", () => {
    const result = validateInquiryPayload({ ...base, website: "", fillMillis: 5000 });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.email).toBe("person@example.com");
      expect(result.input.message).toBe("Need help");
    }
  });

  it("rejects empty, invalid and oversized input", () => {
    for (const bad of [
      { ...base, email: "" },
      { ...base, email: "not-an-email" },
      { ...base, email: "a@b" },
      { ...base, email: "a b@example.com" },
      { ...base, email: "a@example.com\r\nBcc: x@y.com" },
      { ...base, message: "   " },
      { ...base, message: "x".repeat(5001) },
      { ...base, idempotencyKey: "short" },
      null,
      "string",
    ]) {
      expect(validateInquiryPayload(bad).ok).toBe(false);
    }
  });

  it("email checker", () => {
    expect(isValidEmail("first.last+tag@sub.example.co")).toBe(true);
    expect(isValidEmail(".a@example.com")).toBe(false);
    expect(isValidEmail("a..b@example.com")).toBe(false);
  });

  it("flags bot signals", () => {
    expect(looksLikeBot({ honeypot: "x", fillMillis: 9000 })).toBe(true);
    expect(looksLikeBot({ honeypot: "", fillMillis: 100 })).toBe(true);
    expect(looksLikeBot({ honeypot: "", fillMillis: null })).toBe(true);
    expect(looksLikeBot({ honeypot: "", fillMillis: 9000 })).toBe(false);
  });
});

describe("email templates", () => {
  const inquiry = {
    referenceNumber: "LS-2026-000001",
    email: "customer@example.com",
    message: "I need <b>help</b> & more",
    createdAt: new Date("2026-03-04T05:06:07.000Z"),
  };

  it("builds the business notification with Reply-To", () => {
    const mail = buildBusinessEmail(inquiry, "contact@libertyscoping.com", "biz@example.com");
    expect(mail.subject).toBe("New Liberty Scoping Inquiry \u2014 LS-2026-000001");
    expect(businessSubject(inquiry.referenceNumber)).toBe(mail.subject);
    expect(mail.to).toBe("biz@example.com");
    expect(mail.replyTo).toBe("customer@example.com");
    expect(mail.text).toContain("LS-2026-000001");
    expect(mail.text).toContain("I need <b>help</b> & more");
    expect(mail.text).toContain("2026-03-04 05:06:07 UTC");
    expect(mail.html).toContain("I need &lt;b&gt;help&lt;/b&gt; &amp; more");
    expect(mail.html).not.toContain("<b>help</b>");
  });

  it("builds the acknowledgment with the same reference", () => {
    const mail = buildConfirmationEmail(inquiry, "contact@libertyscoping.com");
    expect(mail.subject).toBe("Liberty Scoping \u2014 Inquiry Received [LS-2026-000001]");
    expect(confirmationSubject(inquiry.referenceNumber)).toBe(mail.subject);
    expect(mail.to).toBe("customer@example.com");
    expect(mail.text).toContain("Thank you for contacting Liberty Scoping.");
    expect(mail.text).toContain("Your reference number is LS-2026-000001.");
    expect(mail.text).toContain("Accuracy in Every Word. Integrity in Every Record.");
    expect(mail.html).toContain("<strong>LS-2026-000001</strong>");
  });

  it("escapes html", () => {
    expect(escapeHtml(`<a href="x">'&`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;");
  });
});

describe("mailer selection", () => {
  it("is not configured without a provider", () => {
    expect(() => getMailer(null)).toThrow(MailerNotConfiguredError);
    expect(() => getMailer("someprovider")).toThrow(MailerNotConfiguredError);
  });
  it("requires an API key for resend", () => {
    expect(() => getMailer("resend", {})).toThrow(MailerNotConfiguredError);
    expect(getMailer("resend", { INQUIRY_MAIL_API_KEY: "re_test" })).toBeTruthy();
  });
  it("blocks the mock mailer in production", () => {
    expect(() => getMailer("mock", { VERCEL_ENV: "production" })).toThrow(
      MailerNotConfiguredError,
    );
    expect(getMailer("mock", {})).toBeTruthy();
  });
});

describe("origin check", () => {
  const config = readConfig({ NEXT_PUBLIC_SITE_URL: "https://libertyscoping.com" });
  const req = (headers: Record<string, string>) => new Request("https://x/api/inquiries", { method: "POST", headers });

  it("allows same-origin and site origins only", () => {
    expect(isAllowedOrigin(req({ origin: "https://libertyscoping.com" }), config)).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://www.libertyscoping.com" }), config)).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://preview.vercel.app", host: "preview.vercel.app" }), config)).toBe(true);
    expect(isAllowedOrigin(req({ origin: "https://evil.example", host: "libertyscoping.com" }), config)).toBe(false);
    expect(isAllowedOrigin(req({}), config)).toBe(false);
  });
});
