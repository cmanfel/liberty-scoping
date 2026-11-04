import { BRAND_TAGLINE } from "./constants";
import type { MailMessage } from "./mailer";

export interface TemplateInquiry {
  referenceNumber: string;
  email: string;
  message: string;
  createdAt: Date;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTimestamp(date: Date): string {
  return `${date.toISOString().replace("T", " ").replace(/\.\d+Z$/, "")} UTC`;
}

export function businessSubject(referenceNumber: string): string {
  return `New Liberty Scoping Inquiry \u2014 ${referenceNumber}`;
}

export function confirmationSubject(referenceNumber: string): string {
  return `Liberty Scoping \u2014 Inquiry Received [${referenceNumber}]`;
}

export function buildBusinessEmail(
  inquiry: TemplateInquiry,
  from: string,
  to: string,
): MailMessage {
  const submitted = formatTimestamp(inquiry.createdAt);
  const text = [
    `Reference number: ${inquiry.referenceNumber}`,
    `From: ${inquiry.email}`,
    `Submitted: ${submitted}`,
    "",
    "Inquiry:",
    inquiry.message,
    "",
    "Reply to this email to respond to the inquirer.",
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#111">
<p><strong>Reference number:</strong> ${escapeHtml(inquiry.referenceNumber)}<br>
<strong>From:</strong> ${escapeHtml(inquiry.email)}<br>
<strong>Submitted:</strong> ${escapeHtml(submitted)}</p>
<p><strong>Inquiry:</strong></p>
<p style="white-space:pre-wrap;border-left:3px solid #c49a60;padding-left:12px;margin:0">${escapeHtml(inquiry.message)}</p>
<p style="color:#555">Reply to this email to respond to the inquirer.</p>
</div>`;
  return {
    from,
    to,
    replyTo: inquiry.email,
    subject: businessSubject(inquiry.referenceNumber),
    text,
    html,
  };
}

export function buildConfirmationEmail(
  inquiry: TemplateInquiry,
  from: string,
): MailMessage {
  const text = [
    "Thank you for contacting Liberty Scoping.",
    "",
    "We have received your inquiry and will review it shortly.",
    "",
    `Your reference number is ${inquiry.referenceNumber}.`,
    "Please retain this number for future correspondence.",
    "",
    `Liberty Scoping \u2014 ${BRAND_TAGLINE}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111">
<p>Thank you for contacting Liberty Scoping.</p>
<p>We have received your inquiry and will review it shortly.</p>
<p>Your reference number is <strong>${escapeHtml(inquiry.referenceNumber)}</strong>.</p>
<p>Please retain this number for future correspondence.</p>
<p style="color:#555">Liberty Scoping \u2014 ${escapeHtml(BRAND_TAGLINE)}</p>
</div>`;
  return {
    from,
    to: inquiry.email,
    subject: confirmationSubject(inquiry.referenceNumber),
    text,
    html,
  };
}
