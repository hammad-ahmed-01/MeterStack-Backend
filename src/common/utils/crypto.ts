import { randomBytes } from "node:crypto";

export function randomHex(bytes = 4): string {
  return randomBytes(bytes).toString("hex");
}
