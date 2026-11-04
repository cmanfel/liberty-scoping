import { describe, expect, it, vi } from "vitest";
import { MailerError, getMailer } from "@/lib/inquiries/mailer";
import { createResendMailer } from "@/lib/inquiries/resend";

const message = {
  from: "contact@libertyscoping.com",
  to: "business@example.test",
  replyTo: "customer@example.com",
  subject: "New Liberty Scoping Inquiry \u2014 LS-2026-000001",
  text: "text body",
  html: "<p>html body</p>",
};

function mockFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status }));
}

async function sendError(status: number, body: unknown): Promise<MailerError> {
  const mailer = createResendMailer({ apiKey: "re_secret_key", fetch: mockFetch(status, body) as unknown as typeof fetch });
  try {
    await mailer.send(message);
  } catch (error) {
    return error as MailerError;
  }
  throw new Error("expected failure");
}

describe("Resend adapter (mock fetch, no network)", () => {
  it("posts the expected request and returns the message id", async () => {
    const fetchMock = mockFetch(200, { id: "re_msg_123" });
    const mailer = createResendMailer({ apiKey: "re_secret_key", fetch: fetchMock as unknown as typeof fetch });
    const result = await mailer.send(message);
    expect(result).toMatchObject({ providerMessageId: "re_msg_123", httpStatus: 200 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_secret_key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: "contact@libertyscoping.com",
      to: ["business@example.test"],
      reply_to: "customer@example.com",
      subject: message.subject,
      text: "text body",
      html: "<p>html body</p>",
    });
  });

  it("omits reply_to when not set", async () => {
    const fetchMock = mockFetch(200, { id: "x" });
    const mailer = createResendMailer({ apiKey: "k", fetch: fetchMock as unknown as typeof fetch });
    await mailer.send({ ...message, replyTo: undefined });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).not.toHaveProperty("reply_to");
  });

  it("maps provider errors to stable codes without leaking bodies or the key", async () => {
    const auth = await sendError(401, { name: "restricted_api_key", message: "API key re_secret_key is restricted" });
    expect(auth.code).toBe("resend_auth");
    const limited = await sendError(429, { name: "rate_limit_exceeded", message: "slow down" });
    expect(limited.code).toBe("resend_rate_limited");
    const server = await sendError(503, { name: "application_error", message: "boom" });
    expect(server.code).toBe("resend_server_error");
    const rejected = await sendError(422, { name: "validation_error", message: "The domain is not verified: private details" });
    expect(rejected.code).toBe("resend_rejected");
    expect(rejected.retryable).toBe(false);
    for (const e of [auth, limited, server, rejected]) {
      expect(e.message).not.toContain("re_secret_key");
      expect(e.message).not.toContain("private details");
    }
  });

  it("treats 403 validation_error (unverified domain) as rejected, 403 invalid_api_key as auth", async () => {
    const domain = await sendError(403, {
      name: "validation_error",
      message: "The libertyscoping.com domain is not verified. Contact person@example.com re_abcdef123456",
    });
    expect(domain.code).toBe("resend_rejected");
    expect(domain.details.httpStatus).toBe(403);
    expect(domain.details.providerCode).toBe("validation_error");
    expect(domain.details.providerMessage).toContain("domain is not verified");
    expect(domain.details.providerMessage).not.toContain("person@example.com");
    expect(domain.details.providerMessage).not.toContain("re_abcdef123456");

    const key = await sendError(403, { name: "invalid_api_key", message: "API key is invalid" });
    expect(key.code).toBe("resend_auth");
  });

  it("reports HTTP status and duration on success and failure", async () => {
    const ok = await createResendMailer({
      apiKey: "k",
      fetch: mockFetch(200, { id: "abc" }) as unknown as typeof fetch,
    }).send(message);
    expect(ok.httpStatus).toBe(200);
    expect(typeof ok.durationMs).toBe("number");
    const failed = await sendError(429, { name: "rate_limit_exceeded", message: "slow down" });
    expect(failed.details.httpStatus).toBe(429);
    expect(typeof failed.details.durationMs).toBe("number");
  });

  it("handles non-JSON error bodies, network failures and timeouts", async () => {
    const html = createResendMailer({
      apiKey: "k",
      fetch: (async () => new Response("<html>bad gateway</html>", { status: 502 })) as unknown as typeof fetch,
    });
    await expect(html.send(message)).rejects.toMatchObject({ code: "resend_server_error" });

    const down = createResendMailer({
      apiKey: "k",
      fetch: (async () => {
        throw new TypeError("fetch failed: connect ECONNREFUSED key=k");
      }) as unknown as typeof fetch,
    });
    const err = await down.send(message).catch((e: MailerError) => e);
    expect((err as MailerError).code).toBe("resend_network");
    expect((err as MailerError).message).not.toContain("ECONNREFUSED");

    const slow = createResendMailer({
      apiKey: "k",
      timeoutMillis: 20,
      fetch: ((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            reject(e);
          });
        })) as unknown as typeof fetch,
    });
    await expect(slow.send(message)).rejects.toMatchObject({ code: "resend_timeout" });
  });

  it("is selected through getMailer when configured, using the injected fetch", async () => {
    const fetchMock = mockFetch(200, { id: "re_1" });
    const mailer = getMailer("resend", { INQUIRY_MAIL_API_KEY: "re_k" }, fetchMock as unknown as typeof fetch);
    await mailer.send(message);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
