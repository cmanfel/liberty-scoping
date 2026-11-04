import { createHash } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function saltedHash(salt: string, value: string): string {
  return sha256Hex(`${salt}:${value}`);
}
