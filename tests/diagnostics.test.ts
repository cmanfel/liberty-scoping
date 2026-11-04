import { describe, expect, it } from "vitest";
import {
  describeKeyShape,
  domainOf,
  sanitizeDiagnostic,
  tokenMatches,
} from "@/lib/inquiries/diagnostics";

describe("sanitizeDiagnostic", () => {
  it("redacts emails, keys and bearer tokens and truncates", () => {
    const out = sanitizeDiagnostic(
      "Sent to a.b+c@example.co.uk with re_abcdef123456 and Bearer abc.def",
    );
    expect(out).toBe("Sent to [email] with [key] and Bearer [redacted]");
    expect(sanitizeDiagnostic("x".repeat(500), 50)).toHaveLength(50);
    expect(sanitizeDiagnostic(undefined)).toBeNull();
    expect(sanitizeDiagnostic("   ")).toBeNull();
  });
});

describe("describeKeyShape", () => {
  const good = `re_${"a".repeat(8)}_${"b".repeat(24)}`;

  it("accepts a normal-looking key without echoing it", () => {
    const shape = describeKeyShape(good);
    expect(shape).toMatchObject({ present: true, startsWithRe: true, looksValid: true, lengthBucket: "32-48" });
    expect(JSON.stringify(shape)).not.toContain("aaaa");
  });

  it("flags truncated, quoted, whitespace-padded and missing keys", () => {
    expect(describeKeyShape("re_abcd...").looksValid).toBe(false);
    expect(describeKeyShape("re_abcd...").hasEllipsis).toBe(true);
    expect(describeKeyShape("re_abcd").lengthBucket).toBe("<20");
    expect(describeKeyShape(`"${good}"`).hasQuotes).toBe(true);
    expect(describeKeyShape(` ${good}\n`).hasWhitespace).toBe(true);
    expect(describeKeyShape(`sk_${"a".repeat(30)}`).startsWithRe).toBe(false);
    expect(describeKeyShape(undefined)).toMatchObject({ present: false, looksValid: false, lengthBucket: "0" });
  });
});

describe("tokenMatches / domainOf", () => {
  it("compares bearer tokens exactly", () => {
    expect(tokenMatches("Bearer s3cret", "s3cret")).toBe(true);
    expect(tokenMatches("Bearer s3cret ", "s3cret")).toBe(false);
    expect(tokenMatches("s3cret", "s3cret")).toBe(false);
    expect(tokenMatches(null, "s3cret")).toBe(false);
  });

  it("extracts the sender domain", () => {
    expect(domainOf("contact@LibertyScoping.com")).toBe("libertyscoping.com");
    expect(domainOf("Liberty Scoping <contact@mail.libertyscoping.com>")).toBe("mail.libertyscoping.com");
    expect(domainOf(null)).toBeNull();
  });
});
