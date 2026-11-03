import type { Timestamp } from "@google-cloud/firestore";

export type EmailStatus = "pending" | "sending" | "sent" | "failed";
export type InquiryStatus = "new";
export type EmailKind = "business" | "confirmation";

export interface InquiryDoc {
  referenceNumber: string;
  referenceYear: number;
  referenceSequence: number;
  email: string;
  message: string;
  status: InquiryStatus;
  source: "website-contact-form";
  createdAt: Timestamp;
  updatedAt: Timestamp;

  businessEmailStatus: EmailStatus;
  businessEmailAttempts: number;
  businessEmailLastAttemptAt: Timestamp | null;
  businessEmailSentAt: Timestamp | null;
  businessEmailLastError: string | null;
  businessEmailProviderMessageId: string | null;

  confirmationEmailStatus: EmailStatus;
  confirmationEmailAttempts: number;
  confirmationEmailLastAttemptAt: Timestamp | null;
  confirmationEmailSentAt: Timestamp | null;
  confirmationEmailLastError: string | null;
  confirmationEmailProviderMessageId: string | null;

  idempotencyKeyHash: string;
  contentHash: string;
  clientIpHash: string | null;
  userAgent: string | null;
}

export interface CreateInquiryResult {
  inquiryId: string;
  referenceNumber: string;
  duplicate: boolean;
}
