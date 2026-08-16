import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  generateApiKey,
  hashApiKey,
} from "../src/modules/api-keys/api-keys.crypto";
import { ApiKeysService } from "../src/modules/api-keys/api-keys.service";
import type { ApiKeyRecord } from "../src/modules/api-keys/api-keys.types";
import type { ApiKeysRepository } from "../src/modules/api-keys/api-keys.repository";

function makeRecord(overrides: Partial<ApiKeyRecord> = {}): ApiKeyRecord {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    organization_id: "org-a",
    name: "Development",
    key_prefix: "ms_test_ab12",
    key_hash: "abc123",
    environment: "test",
    status: "active",
    last_used_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    revoked_at: null,
    ...overrides,
  };
}

describe("API key generation", () => {
  it("creates keys in the ms_<env>_<secret> format", () => {
    const testKey = generateApiKey("test");
    const liveKey = generateApiKey("live");

    expect(testKey.key.startsWith("ms_test_")).toBe(true);
    expect(liveKey.key.startsWith("ms_live_")).toBe(true);
    expect(testKey.prefix).toBe(testKey.key.slice(0, 12));
    expect(liveKey.prefix).toBe(liveKey.key.slice(0, 12));
    expect(testKey.prefix.startsWith("ms_test_")).toBe(true);
    expect(liveKey.prefix.startsWith("ms_live_")).toBe(true);
  });

  it("uses cryptographically unique secrets", () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey("test").key));
    expect(keys.size).toBe(50);
  });
});

describe("API key hashing", () => {
  it("hashes with SHA-256 and is deterministic", () => {
    const key = "ms_test_example-secret";
    const expected = createHash("sha256").update(key, "utf8").digest("hex");

    expect(hashApiKey(key)).toBe(expected);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).toHaveLength(64);
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("ms_test_one")).not.toBe(hashApiKey("ms_test_two"));
  });

  it("stores only prefix and hash, and returns the full key once", async () => {
    const createdRecords: Array<Record<string, unknown>> = [];
    const repository = {
      list: async () => [makeRecord({ key_hash: "should-never-leak" })],
      findById: async () => makeRecord(),
      create: async (input: Record<string, unknown>) => {
        createdRecords.push(input);
        return makeRecord({
          key_prefix: input.key_prefix as string,
          key_hash: input.key_hash as string,
          name: input.name as string,
          environment: input.environment as "test" | "live",
        });
      },
      revoke: async () => makeRecord({ status: "revoked" }),
    } as unknown as ApiKeysRepository;

    const service = new ApiKeysService(repository);
    const created = await service.create("org-a", "Development", "test");

    expect(created.key.startsWith("ms_test_")).toBe(true);
    expect(created.prefix).toBe(created.key.slice(0, 12));
    expect(created).not.toHaveProperty("keyHash");
    expect(created).not.toHaveProperty("key_hash");

    expect(createdRecords).toHaveLength(1);
    expect(createdRecords[0]).not.toHaveProperty("key");
    expect(createdRecords[0]?.key_hash).toBe(hashApiKey(created.key));
    expect(createdRecords[0]?.key_prefix).toBe(created.prefix);
    expect(JSON.stringify(createdRecords[0])).not.toContain(created.key);

    const listed = await service.list("org-a");
    expect(listed[0]).not.toHaveProperty("key");
    expect(listed[0]).not.toHaveProperty("keyHash");
    expect(listed[0]).not.toHaveProperty("key_hash");
    expect(JSON.stringify(listed)).not.toContain("should-never-leak");
  });
});
