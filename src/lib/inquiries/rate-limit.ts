import { FieldValue, Timestamp, type Firestore } from "@google-cloud/firestore";
import { COLLECTIONS } from "./constants";

export interface RateLimitRule {
  max: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter stored in Firestore so limits hold across serverless
 * instances. Only salted hashes of the subject are stored, never raw IPs/emails.
 */
export async function consumeRateLimit(
  db: Firestore,
  scope: string,
  subjectHash: string,
  rule: RateLimitRule,
  nowMillis: number = Date.now(),
): Promise<RateLimitResult> {
  const windowMillis = rule.windowSeconds * 1000;
  const windowStart = Math.floor(nowMillis / windowMillis) * windowMillis;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart + windowMillis - nowMillis) / 1000),
  );
  const ref = db
    .collection(COLLECTIONS.rateLimits)
    .doc(`${scope}-${subjectHash.slice(0, 40)}-${windowStart}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? Number(snap.get("count") ?? 0) : 0;
    if (count >= rule.max) return { allowed: false, retryAfterSeconds };
    tx.set(
      ref,
      {
        scope,
        count: count + 1,
        windowStart: Timestamp.fromMillis(windowStart),
        expireAt: Timestamp.fromMillis(windowStart + windowMillis * 2),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { allowed: true, retryAfterSeconds };
  });
}
