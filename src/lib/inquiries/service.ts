import { FieldValue, Timestamp, type Firestore } from "@google-cloud/firestore";
import { COLLECTIONS, EMAIL_RULES } from "./constants";
import { REFERENCE_TIME_ZONE, formatReference, referenceYearFor } from "./reference";
import { saltedHash, sha256Hex } from "./hash";
import {
  MailerError,
  MailerNotConfiguredError,
  type Mailer,
} from "./mailer";
import {
  buildBusinessEmail,
  buildConfirmationEmail,
  type TemplateInquiry,
} from "./templates";
import type {
  CreateInquiryResult,
  EmailKind,
  EmailStatus,
  InquiryDoc,
} from "./types";
import type { InquiryInput } from "./validation";

export class IdempotencyConflictError extends Error {
  constructor() {
    super("Idempotency key was already used with different content");
    this.name = "IdempotencyConflictError";
  }
}

export interface CreateInquiryContext {
  salt: string;
  clientIp: string | null;
  userAgent: string | null;
  now?: Date;
}

export function contentHashFor(input: InquiryInput): string {
  return sha256Hex(JSON.stringify([input.email, input.message]));
}

export function idempotencyDocId(salt: string, key: string): string {
  return saltedHash(salt, `idem:${key}`);
}

/** Looks up a previous submission for this idempotency key, if any. */
export async function findByIdempotencyKey(
  db: Firestore,
  input: InquiryInput,
  salt: string,
): Promise<CreateInquiryResult | null> {
  const snap = await db
    .collection(COLLECTIONS.idempotency)
    .doc(idempotencyDocId(salt, input.idempotencyKey))
    .get();
  if (!snap.exists) return null;
  if (snap.get("contentHash") !== contentHashFor(input)) {
    throw new IdempotencyConflictError();
  }
  return {
    inquiryId: snap.get("inquiryId") as string,
    referenceNumber: snap.get("referenceNumber") as string,
    duplicate: true,
  };
}

/**
 * Persists a new inquiry. A single transaction increments the per-year counter,
 * creates the inquiry and records the idempotency key, so concurrent requests
 * can never receive the same reference number and a repeated key never creates
 * a second inquiry.
 */
export async function createInquiry(
  db: Firestore,
  input: InquiryInput,
  ctx: CreateInquiryContext,
): Promise<CreateInquiryResult> {
  const year = referenceYearFor(ctx.now ?? new Date());
  const idemRef = db
    .collection(COLLECTIONS.idempotency)
    .doc(idempotencyDocId(ctx.salt, input.idempotencyKey));
  const counterRef = db.collection(COLLECTIONS.counters).doc(`inquiries-${year}`);
  const inquiryRef = db.collection(COLLECTIONS.inquiries).doc();
  const contentHash = contentHashFor(input);

  return db.runTransaction(async (tx) => {
    const [idemSnap, counterSnap] = await Promise.all([
      tx.get(idemRef),
      tx.get(counterRef),
    ]);

    if (idemSnap.exists) {
      if (idemSnap.get("contentHash") !== contentHash) {
        throw new IdempotencyConflictError();
      }
      return {
        inquiryId: idemSnap.get("inquiryId") as string,
        referenceNumber: idemSnap.get("referenceNumber") as string,
        duplicate: true,
      };
    }

    const sequence = (counterSnap.exists ? Number(counterSnap.get("lastSequence")) : 0) + 1;
    const referenceNumber = formatReference(year, sequence);

    tx.set(
      counterRef,
      {
        year,
        timeZone: REFERENCE_TIME_ZONE,
        lastSequence: sequence,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    tx.set(inquiryRef, {
      referenceNumber,
      referenceYear: year,
      referenceSequence: sequence,
      email: input.email,
      message: input.message,
      status: "new",
      source: "website-contact-form",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      businessEmailStatus: "pending",
      businessEmailAttempts: 0,
      businessEmailLastAttemptAt: null,
      businessEmailSentAt: null,
      businessEmailLastError: null,
      businessEmailProviderMessageId: null,
      confirmationEmailStatus: "pending",
      confirmationEmailAttempts: 0,
      confirmationEmailLastAttemptAt: null,
      confirmationEmailSentAt: null,
      confirmationEmailLastError: null,
      confirmationEmailProviderMessageId: null,
      idempotencyKeyHash: idemRef.id,
      contentHash,
      clientIpHash: ctx.clientIp ? saltedHash(ctx.salt, `ip:${ctx.clientIp}`) : null,
      userAgent: ctx.userAgent ? ctx.userAgent.slice(0, 300) : null,
    });

    tx.set(idemRef, {
      inquiryId: inquiryRef.id,
      referenceNumber,
      contentHash,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { inquiryId: inquiryRef.id, referenceNumber, duplicate: false };
  });
}

export interface DeliveryDeps {
  getMailer: () => Mailer;
  businessEmail: string | null;
  fromEmail: string | null;
}

export interface DeliveryOutcome {
  business: EmailStatus;
  confirmation: EmailStatus;
}

type ClaimResult =
  | { claimed: true; inquiry: InquiryDoc }
  | { claimed: false; status: EmailStatus };

const FIELDS = {
  business: {
    status: "businessEmailStatus",
    attempts: "businessEmailAttempts",
    lastAttemptAt: "businessEmailLastAttemptAt",
    sentAt: "businessEmailSentAt",
    lastError: "businessEmailLastError",
    messageId: "businessEmailProviderMessageId",
  },
  confirmation: {
    status: "confirmationEmailStatus",
    attempts: "confirmationEmailAttempts",
    lastAttemptAt: "confirmationEmailLastAttemptAt",
    sentAt: "confirmationEmailSentAt",
    lastError: "confirmationEmailLastError",
    messageId: "confirmationEmailProviderMessageId",
  },
} as const;

async function claimEmail(
  db: Firestore,
  inquiryId: string,
  kind: EmailKind,
): Promise<ClaimResult> {
  const ref = db.collection(COLLECTIONS.inquiries).doc(inquiryId);
  const f = FIELDS[kind];
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error(`Inquiry ${inquiryId} not found`);
    const status = snap.get(f.status) as EmailStatus;
    const attempts = Number(snap.get(f.attempts) ?? 0);

    if (status === "sent") return { claimed: false, status };
    if (status === "sending") {
      const last = snap.get(f.lastAttemptAt) as Timestamp | null;
      const leaseActive =
        last !== null && Date.now() - last.toMillis() < EMAIL_RULES.sendingLeaseMillis;
      if (leaseActive) return { claimed: false, status };
    }
    if (attempts >= EMAIL_RULES.maxAttempts) {
      return { claimed: false, status: "failed" };
    }

    tx.update(ref, {
      [f.status]: "sending",
      [f.attempts]: attempts + 1,
      [f.lastAttemptAt]: Timestamp.now(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { claimed: true, inquiry: snap.data() as InquiryDoc };
  });
}

function describeError(error: unknown): string {
  if (error instanceof MailerError) return `${error.code}: ${error.message}`.slice(0, 300);
  return "unexpected_error: email send failed".slice(0, 300);
}

async function sendOne(
  db: Firestore,
  inquiryId: string,
  kind: EmailKind,
  deps: DeliveryDeps,
): Promise<EmailStatus> {
  const claim = await claimEmail(db, inquiryId, kind);
  if (!claim.claimed) return claim.status;

  const ref = db.collection(COLLECTIONS.inquiries).doc(inquiryId);
  const f = FIELDS[kind];
  const inquiry = claim.inquiry;
  const template: TemplateInquiry = {
    referenceNumber: inquiry.referenceNumber,
    email: inquiry.email,
    message: inquiry.message,
    createdAt: inquiry.createdAt.toDate(),
  };

  try {
    if (!deps.fromEmail) {
      throw new MailerNotConfiguredError("INQUIRY_FROM_EMAIL is not set");
    }
    if (kind === "business" && !deps.businessEmail) {
      throw new MailerNotConfiguredError("INQUIRY_BUSINESS_EMAIL is not set");
    }
    const mailer = deps.getMailer();
    const message =
      kind === "business"
        ? buildBusinessEmail(template, deps.fromEmail, deps.businessEmail as string)
        : buildConfirmationEmail(template, deps.fromEmail);
    const result = await mailer.send(message);
    await ref.update({
      [f.status]: "sent",
      [f.sentAt]: FieldValue.serverTimestamp(),
      [f.lastError]: null,
      [f.messageId]: result.providerMessageId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "sent";
  } catch (error) {
    await ref.update({
      [f.status]: "failed",
      [f.lastError]: describeError(error),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return "failed";
  }
}

/**
 * Sends whichever of the two notification emails has not been sent yet.
 * Safe to call repeatedly: successful emails are never resent, and an email
 * being sent by another invocation is skipped until its lease expires.
 */
export async function deliverInquiryEmails(
  db: Firestore,
  inquiryId: string,
  deps: DeliveryDeps,
): Promise<DeliveryOutcome> {
  const [business, confirmation] = await Promise.all([
    sendOne(db, inquiryId, "business", deps),
    sendOne(db, inquiryId, "confirmation", deps),
  ]);
  return { business, confirmation };
}

/** Retries inquiries whose emails are not yet sent. Used by the protected retry endpoint. */
export async function retryUnsentEmails(
  db: Firestore,
  deps: DeliveryDeps,
  nowMillis: number = Date.now(),
): Promise<{ examined: number; retried: number }> {
  const unsent = ["pending", "failed", "sending"];
  const ids = new Set<string>();
  for (const field of ["businessEmailStatus", "confirmationEmailStatus"]) {
    const snap = await db
      .collection(COLLECTIONS.inquiries)
      .where(field, "in", unsent)
      .limit(EMAIL_RULES.retryBatchSize)
      .get();
    for (const doc of snap.docs) {
      const createdAt = doc.get("createdAt") as Timestamp | undefined;
      if (
        createdAt &&
        nowMillis - createdAt.toMillis() >= EMAIL_RULES.retryMinAgeMillis
      ) {
        ids.add(doc.id);
      }
    }
  }
  let retried = 0;
  for (const id of ids) {
    await deliverInquiryEmails(db, id, deps);
    retried += 1;
  }
  return { examined: ids.size, retried };
}
