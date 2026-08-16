import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export type ApiKeyEnvironment = "test" | "live";

const PREFIX_LENGTH = 12;
const SECRET_BYTES = 24;

export function hashApiKey(key: string): string {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateApiKey(environment: ApiKeyEnvironment): {
  key: string;
  prefix: string;
  hash: string;
} {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const key = `ms_${environment}_${secret}`;
  const prefix = key.slice(0, PREFIX_LENGTH);

  return {
    key,
    prefix,
    hash: hashApiKey(key),
  };
}

export function apiKeyHashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}
