export const COLLECTIONS = {
  inquiries: "libertyScopingInquiries",
  counters: "libertyScopingCounters",
  idempotency: "libertyScopingIdempotency",
  rateLimits: "libertyScopingRateLimits",
} as const;

export const LIMITS = {
  emailMaxLength: 254,
  messageMinLength: 5,
  messageMaxLength: 5000,
  idempotencyKeyMaxLength: 100,
  requestBodyMaxBytes: 16 * 1024,
  minFillMillis: 2000,
  maxFillMillis: 24 * 60 * 60 * 1000,
} as const;

export const RATE_LIMITS = {
  perIp: { max: 5, windowSeconds: 60 * 60 },
  perEmail: { max: 3, windowSeconds: 60 * 60 },
} as const;

export const EMAIL_RULES = {
  maxAttempts: 5,
  sendingLeaseMillis: 2 * 60 * 1000,
  retryMinAgeMillis: 5 * 60 * 1000,
  retryBatchSize: 25,
} as const;

export const BRAND_TAGLINE =
  "Accuracy in Every Word. Integrity in Every Record.";
