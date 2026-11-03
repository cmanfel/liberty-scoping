/**
 * Server-only configuration for the inquiry system. Never import from client code.
 * All values come from environment variables; nothing here is a secret default.
 */

export interface InquiryConfig {
  businessEmail: string | null;
  fromEmail: string | null;
  mailProvider: string | null;
  hashSalt: string;
  retryToken: string | null;
  siteOrigin: string;
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function readConfig(env: Record<string, string | undefined> = process.env): InquiryConfig {
  return {
    businessEmail: clean(env.INQUIRY_BUSINESS_EMAIL),
    fromEmail: clean(env.INQUIRY_FROM_EMAIL),
    mailProvider: clean(env.INQUIRY_MAIL_PROVIDER)?.toLowerCase() ?? null,
    hashSalt: clean(env.INQUIRY_HASH_SALT) ?? "liberty-scoping-inquiries",
    retryToken: clean(env.INQUIRY_RETRY_TOKEN),
    siteOrigin: new URL(
      clean(env.NEXT_PUBLIC_SITE_URL) ?? "https://libertyscoping.com",
    ).origin,
  };
}

export interface FirestoreEnv {
  projectId: string;
  emulatorHost: string | null;
  wif: {
    projectNumber: string;
    poolId: string;
    providerId: string;
    serviceAccountEmail: string;
  } | null;
}

export function readFirestoreEnv(
  env: Record<string, string | undefined> = process.env,
): FirestoreEnv {
  const emulatorHost = clean(env.FIRESTORE_EMULATOR_HOST);
  const projectId =
    clean(env.FIREBASE_PROJECT_ID) ?? (emulatorHost ? "demo-liberty-scoping" : null);
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set");

  const projectNumber = clean(env.GCP_PROJECT_NUMBER);
  const poolId = clean(env.GCP_WORKLOAD_IDENTITY_POOL_ID);
  const providerId = clean(env.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID);
  const serviceAccountEmail = clean(env.GCP_SERVICE_ACCOUNT_EMAIL);
  const wif =
    projectNumber && poolId && providerId && serviceAccountEmail
      ? { projectNumber, poolId, providerId, serviceAccountEmail }
      : null;

  return { projectId, emulatorHost, wif };
}
