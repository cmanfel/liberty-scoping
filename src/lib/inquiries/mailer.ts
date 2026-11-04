import { createResendMailer } from "./resend";

/**
 * Provider-agnostic mail interface. The inquiry system only depends on this
 * contract; provider adapters are selected in `getMailer()`.
 * See docs/inquiry-system.md.
 */

export interface MailMessage {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface MailResult {
  providerMessageId: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
}

export interface MailerErrorDetails {
  httpStatus?: number | null;
  providerCode?: string | null;
  providerMessage?: string | null;
  durationMs?: number | null;
}

export interface Mailer {
  send(message: MailMessage): Promise<MailResult>;
}

export class MailerError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable = true,
    readonly details: MailerErrorDetails = {},
  ) {
    super(message);
    this.name = "MailerError";
  }
}

export class MailerNotConfiguredError extends MailerError {
  constructor(reason: string) {
    super(reason, "mailer_not_configured", true);
    this.name = "MailerNotConfiguredError";
  }
}

/** In-memory mailer used by tests and local development. Never sends anything. */
export class MockMailer implements Mailer {
  readonly outbox: MailMessage[] = [];
  failWith: ((message: MailMessage) => MailerError | null) | null = null;
  private counter = 0;

  async send(message: MailMessage): Promise<MailResult> {
    const error = this.failWith?.(message);
    if (error) throw error;
    this.outbox.push(message);
    this.counter += 1;
    return { providerMessageId: `mock-${this.counter}` };
  }
}

let devMockMailer: MockMailer | null = null;

/**
 * Returns the mailer for the current environment.
 *
 * INQUIRY_MAIL_PROVIDER:
 *   unset    -> no mailer; sends fail as `mailer_not_configured` (retryable later)
 *   "mock"   -> MockMailer (blocked on Vercel production)
 *   "resend" -> Resend HTTP API (requires INQUIRY_MAIL_API_KEY)
 */
export function getMailer(
  provider: string | null,
  env: Record<string, string | undefined> = process.env,
  fetchImpl?: typeof fetch,
): Mailer {
  if (!provider) {
    throw new MailerNotConfiguredError("INQUIRY_MAIL_PROVIDER is not set");
  }
  if (provider === "mock") {
    if (env.VERCEL_ENV === "production") {
      throw new MailerNotConfiguredError(
        "The mock mailer cannot be used in production",
      );
    }
    devMockMailer ??= new MockMailer();
    return devMockMailer;
  }
  if (provider === "resend") {
    const apiKey = env.INQUIRY_MAIL_API_KEY?.trim();
    if (!apiKey) {
      throw new MailerNotConfiguredError("INQUIRY_MAIL_API_KEY is not set");
    }
    return createResendMailer({ apiKey, fetch: fetchImpl });
  }
  throw new MailerNotConfiguredError(`Unknown mail provider: ${provider}`);
}
