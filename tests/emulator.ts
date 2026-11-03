import { Firestore } from "@google-cloud/firestore";

export const emulatorAvailable = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
export const TEST_PROJECT = "demo-liberty-scoping";

/** Refuses to run against anything but the local emulator. */
export function testDb(): Firestore {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (!host || !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
    throw new Error("Integration tests require the local Firestore emulator");
  }
  return new Firestore({ projectId: TEST_PROJECT });
}

export async function clearEmulator(): Promise<void> {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  const response = await fetch(
    `http://${host}/emulator/v1/projects/${TEST_PROJECT}/databases/(default)/documents`,
    { method: "DELETE" },
  );
  if (!response.ok) throw new Error("Failed to clear emulator");
}
