import { describe, expect, it } from "vitest";
import type { Firestore } from "@google-cloud/firestore";
import { runTransactionWithRetry } from "@/lib/inquiries/transactions";

function fakeDb(failures: unknown[]) {
  const options: unknown[] = [];
  const db = {
    async runTransaction(update: (tx: unknown) => Promise<unknown>, opts: unknown) {
      options.push(opts);
      const failure = failures.shift();
      if (failure) throw failure;
      return update({});
    },
  } as unknown as Firestore;
  return { db, options };
}

describe("runTransactionWithRetry", () => {
  it("retries contention (HTTP 409 and gRPC ABORTED) with a short bounded backoff", async () => {
    const { db, options } = fakeDb([{ code: 409 }, { code: 10 }]);
    const started = Date.now();
    await expect(runTransactionWithRetry(db, async () => "ok")).resolves.toBe("ok");
    expect(options).toHaveLength(3);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("disables the client's own retry, which backs off for up to a minute over REST", async () => {
    const { db, options } = fakeDb([]);
    await runTransactionWithRetry(db, async () => 1);
    expect(options[0]).toEqual({ maxAttempts: 1 });
  });

  it("does not retry other errors", async () => {
    const boom = new Error("boom");
    const { db, options } = fakeDb([boom]);
    await expect(runTransactionWithRetry(db, async () => 1)).rejects.toBe(boom);
    expect(options).toHaveLength(1);
  });

  it("gives up after a bounded number of attempts", async () => {
    const { db, options } = fakeDb(Array.from({ length: 20 }, () => ({ code: 409 })));
    await expect(runTransactionWithRetry(db, async () => 1)).rejects.toMatchObject({ code: 409 });
    expect(options).toHaveLength(8);
  });
});
