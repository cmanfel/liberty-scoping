import "server-only";
import { readConfig } from "./config";
import { getFirestore } from "./firestore";
import { describeKeyShape, logEvent } from "./diagnostics";
import { getMailer } from "./mailer";
import type { HandlerDeps } from "./http";

export const runtimeDeps: HandlerDeps = {
  getDb: getFirestore,
  getConfig: () => readConfig(),
  getMailer: (provider) => getMailer(provider),
};

/**
 * One structured line per cold start with config presence (booleans only) and a
 * safe shape check of the Resend key, so a truncated or mis-pasted key is visible
 * in logs without ever printing it. Skipped during `next build`.
 */
if (process.env.NEXT_PHASE !== "phase-production-build") {
  const config = readConfig();
  const key = describeKeyShape(process.env.INQUIRY_MAIL_API_KEY);
  logEvent("config_check", {
    vercelEnv: process.env.VERCEL_ENV ?? null,
    provider: config.mailProvider,
    INQUIRY_MAIL_PROVIDER: config.mailProvider !== null,
    INQUIRY_MAIL_API_KEY: key.present,
    INQUIRY_FROM_EMAIL: config.fromEmail !== null,
    INQUIRY_BUSINESS_EMAIL: config.businessEmail !== null,
    INQUIRY_RETRY_TOKEN: config.retryToken !== null,
    apiKeyStartsWithRe: key.startsWithRe,
    apiKeyLengthBucket: key.lengthBucket,
    apiKeyLooksValid: key.looksValid,
    apiKeyHasWhitespace: key.hasWhitespace,
    apiKeyHasQuotes: key.hasQuotes,
    apiKeyHasEllipsis: key.hasEllipsis,
  });
}
