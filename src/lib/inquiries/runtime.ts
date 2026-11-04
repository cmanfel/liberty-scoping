import "server-only";
import { readConfig } from "./config";
import { getFirestore } from "./firestore";
import { getMailer } from "./mailer";
import type { HandlerDeps } from "./http";

export const runtimeDeps: HandlerDeps = {
  getDb: getFirestore,
  getConfig: () => readConfig(),
  getMailer: (provider) => getMailer(provider),
};
