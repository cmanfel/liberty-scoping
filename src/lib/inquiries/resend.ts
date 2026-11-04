import {
  MailerError,
  type MailerErrorDetails,
  type MailMessage,
  type MailResult,
  type Mailer,
} from "./mailer";
import { sanitizeDiagnostic } from "./diagnostics";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface ResendOptions {
  apiKey: string;
  fetch?: typeof fetch;
  timeoutMillis?: number;
  endpoint?: string;
}

/**
 * Resend HTTP API adapter (plain fetch, no SDK). Errors are mapped to stable
 * codes; provider response bodies are never copied into stored errors except
 * Resend's short machine-readable error name.
 */
export function createResendMailer(options: ResendOptions): Mailer {
  const doFetch = options.fetch ?? fetch;
  const timeoutMillis = options.timeoutMillis ?? 8000;
  const endpoint = options.endpoint ?? RESEND_ENDPOINT;

  return {
    async send(message: MailMessage): Promise<MailResult> {
      const startedAt = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMillis);
      let response: Response;
      try {
        response = await doFetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: message.from,
            to: [message.to],
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
            subject: message.subject,
            text: message.text,
            html: message.html,
          }),
          signal: controller.signal,
        });
      } catch (error) {
        const aborted = error instanceof Error && error.name === "AbortError";
        throw new MailerError(
          aborted ? "request timed out" : "network error",
          aborted ? "resend_timeout" : "resend_network",
          true,
          { durationMs: Date.now() - startedAt },
        );
      } finally {
        clearTimeout(timer);
      }

      const payload = await readJson(response);
      const durationMs = Date.now() - startedAt;

      if (response.ok) {
        const id = typeof payload?.id === "string" ? payload.id : null;
        return { providerMessageId: id, httpStatus: response.status, durationMs };
      }

      const name =
        typeof payload?.name === "string"
          ? payload.name.replace(/[^a-z0-9_]/gi, "").slice(0, 60)
          : "unknown";
      throw mapResendError(response.status, name, {
        httpStatus: response.status,
        providerCode: name,
        providerMessage: sanitizeDiagnostic(payload?.message),
        durationMs,
      });
    },
  };
}

async function readJson(
  response: Response,
): Promise<{ id?: unknown; name?: unknown; message?: unknown } | null> {
  try {
    const data: unknown = await response.json();
    return typeof data === "object" && data !== null ? data : null;
  } catch {
    return null;
  }
}

/**
 * Resend uses 401 for missing/invalid keys and 403 both for `invalid_api_key`
 * and for `validation_error` (e.g. sending domain not verified, or sandbox
 * restrictions). Only the former are credential problems.
 */
export function mapResendError(
  status: number,
  name: string,
  details: MailerErrorDetails = {},
): MailerError {
  const credentialProblem =
    status === 401 || (status === 403 && name !== "validation_error");
  if (credentialProblem) {
    return new MailerError(`rejected (${status}, ${name})`, "resend_auth", true, details);
  }
  if (status === 429) {
    return new MailerError(`rate limited (${name})`, "resend_rate_limited", true, details);
  }
  if (status >= 500) {
    return new MailerError(`server error (${status})`, "resend_server_error", true, details);
  }
  return new MailerError(
    `rejected (${status}, ${name})`,
    "resend_rejected",
    status === 403,
    details,
  );
}
