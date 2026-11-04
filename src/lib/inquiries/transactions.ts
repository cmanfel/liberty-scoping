import type { Firestore, Transaction } from "@google-cloud/firestore";

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 40;
const MAX_DELAY_MS = 600;

function isContention(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  // gRPC ABORTED (10) or the HTTP 409 the REST transport reports for it.
  return code === 10 || code === 409;
}

/**
 * Runs a Firestore transaction with a short, bounded retry on contention.
 *
 * The client's built-in retry is not usable over the REST transport: it treats
 * HTTP 409 like RESOURCE_EXHAUSTED and backs off for up to a minute, which
 * would outlast a serverless request. Retries here are short and jittered, and
 * the callback must stay free of side effects other than transaction writes.
 */
export async function runTransactionWithRetry<T>(
  db: Firestore,
  update: (tx: Transaction) => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await db.runTransaction(update, { maxAttempts: 1 });
    } catch (error) {
      if (!isContention(error)) throw error;
      lastError = error;
      const ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, Math.random() * ceiling));
    }
  }
  throw lastError;
}
