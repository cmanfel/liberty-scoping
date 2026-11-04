import {
  MailerError,
  type MailMessage,
  type MailResult,
  type Mailer,
} from "./mailer";

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
        );
      } finally {
        clearTimeout(timer);
      }

      const payload = await readJson(response);

      if (response.ok) {
        const id = typeof payload?.id === "string" ? payload.id : null;
        return { providerMessageId: id };
      }

      const name =
        typeof payload?.name === "string"
          ? payload.name.replace(/[^a-z0-9_]/gi, "").slice(0, 60)
          : "unknown";
      throw mapResendError(response.status, name);
    },
  };
}

async function readJson(
  response: Response,
): Promise<{ id?: unknown; name?: unknown } | null> {
  try {
    const data: unknown = await response.json();
    return typeof data === "object" && data !== null ? data : null;
  } catch {
    return null;
  }
}

export function mapResendError(status: number, name: string): MailerError {
  if (status === 401 || status === 403) {
    return new MailerError(`rejected (${status}, ${name})`, "resend_auth", true);
  }
  if (status === 429) {
    return new MailerError(`rate limited (${name})`, "resend_rate_limited", true);
  }
  if (status >= 500) {
    return new MailerError(`server error (${status})`, "resend_server_error", true);
  }
  return new MailerError(`rejected (${status}, ${name})`, "resend_rejected", false);
}
