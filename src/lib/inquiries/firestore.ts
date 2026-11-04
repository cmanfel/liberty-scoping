import "server-only";
import { Firestore } from "@google-cloud/firestore";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import { readFirestoreEnv } from "./config";

let cached: Firestore | null = null;

/**
 * Server-side Firestore client for the existing Stenofy Firebase project.
 *
 * - Local/tests: when FIRESTORE_EMULATOR_HOST is set the client talks to the
 *   emulator only (no credentials, demo project).
 * - Vercel: authenticates with Vercel OIDC -> Google Workload Identity
 *   Federation -> impersonation of the dedicated inquiries service account
 *   (roles/datastore.user). No long-lived key exists anywhere.
 */
export function getFirestore(): Firestore {
  if (cached) return cached;
  const env = readFirestoreEnv();

  if (env.emulatorHost) {
    // Same REST transport as production so local/CI runs exercise the same serializer.
    cached = new Firestore({ projectId: env.projectId, preferRest: true });
    return cached;
  }

  if (!env.wif) {
    throw new Error(
      "Workload Identity Federation is not configured (GCP_PROJECT_NUMBER, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID, GCP_SERVICE_ACCOUNT_EMAIL)",
    );
  }

  const { projectNumber, poolId, providerId, serviceAccountEmail } = env.wif;
  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: () => getVercelOidcToken(),
    },
  });
  if (!authClient) throw new Error("Failed to build Workload Identity client");

  // preferRest: google-gax's REST transport accepts a prebuilt auth client.
  // `authClient` is accepted by gax but absent from Firestore's public Settings type.
  cached = new Firestore({
    projectId: env.projectId,
    preferRest: true,
    authClient,
  } as ConstructorParameters<typeof Firestore>[0]);
  return cached;
}
