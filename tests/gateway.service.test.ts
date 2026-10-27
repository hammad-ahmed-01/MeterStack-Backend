import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { skipsJsonBody } from "../src/app";
import { UnauthorizedError } from "../src/common/errors";
import { generateApiKey, hashApiKey } from "../src/modules/api-keys/api-keys.crypto";
import type { ApiKeysRepository } from "../src/modules/api-keys/api-keys.repository";
import type { ApiKeyRecord } from "../src/modules/api-keys/api-keys.types";
import { GatewayController } from "../src/modules/gateway/gateway.controller";
import { GatewayService } from "../src/modules/gateway/gateway.service";

function makeRecord(overrides: Partial<ApiKeyRecord> = {}): ApiKeyRecord {
  const generated = generateApiKey("test");

  return {
    id: "11111111-1111-1111-1111-111111111111",
    organization_id: "org-a",
    name: "Development",
    key_prefix: generated.prefix,
    key_hash: generated.hash,
    environment: "test",
    status: "active",
    last_used_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    revoked_at: null,
    ...overrides,
  };
}

function repository(found: ApiKeyRecord | null, onLookup?: (hash: string) => void) {
  return {
    findByHash: async (hash: string) => {
      onLookup?.(hash);
      return found;
    },
  } as unknown as ApiKeysRepository;
}

function requestWith(header: string | undefined): Request {
  return {
    header: (name: string) => (name === "authorization" ? header : undefined),
  } as unknown as Request;
}

describe("gateway key authentication", () => {
  it("rejects a missing Authorization header without a lookup", async () => {
    const findByHash = vi.fn();
    const service = new GatewayService({ findByHash } as unknown as ApiKeysRepository);

    await expect(service.authenticate(undefined)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
    });
    expect(findByHash).not.toHaveBeenCalled();
  });

  it("rejects a session token and other malformed keys without a lookup", async () => {
    const findByHash = vi.fn();
    const service = new GatewayService({ findByHash } as unknown as ApiKeysRepository);

    await expect(service.authenticate("Bearer supabase-session")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(service.authenticate("Token ms_test_abcdefghijklmnop")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(service.authenticate("Bearer ms_test_short")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(findByHash).not.toHaveBeenCalled();
  });

  it("rejects an unknown key and a revoked key with the same error", async () => {
    const generated = generateApiKey("live");
    const revoked = makeRecord({
      key_hash: generated.hash,
      key_prefix: generated.prefix,
      environment: "live",
      status: "revoked",
    });
    const unknown = new GatewayService(repository(null));
    const inactive = new GatewayService(repository(revoked));

    const unknownError = await unknown
      .authenticate(`Bearer ${generated.key}`)
      .then(() => null)
      .catch((error: unknown) => error);
    const revokedError = await inactive
      .authenticate(`Bearer ${generated.key}`)
      .then(() => null)
      .catch((error: unknown) => error);

    expect(unknownError).toBeInstanceOf(UnauthorizedError);
    expect(revokedError).toBeInstanceOf(UnauthorizedError);
    expect((unknownError as UnauthorizedError).message).toBe("Invalid API key");
    expect((revokedError as UnauthorizedError).message).toBe(
      (unknownError as UnauthorizedError).message,
    );
  });

  it("looks up the hash and returns the org without the secret or hash", async () => {
    const generated = generateApiKey("test");
    const record = makeRecord({
      key_hash: generated.hash,
      key_prefix: generated.prefix,
    });
    const lookups: string[] = [];
    const service = new GatewayService(repository(record, (hash) => lookups.push(hash)));

    const authenticated = await service.authenticate(`Bearer ${generated.key}`);

    expect(lookups).toEqual([hashApiKey(generated.key)]);
    expect(authenticated).toEqual({
      id: record.id,
      organizationId: record.organization_id,
      environment: "test",
      prefix: record.key_prefix,
    });
    expect(authenticated).not.toHaveProperty("key");
    expect(authenticated).not.toHaveProperty("key_hash");
    expect(JSON.stringify(authenticated)).not.toContain(generated.key);
  });

  it("rejects an active row whose stored hash does not match", async () => {
    const generated = generateApiKey("test");
    const service = new GatewayService(
      repository(
        makeRecord({
          key_hash: hashApiKey("ms_test_different-secret-value"),
          key_prefix: generated.prefix,
        }),
      ),
    );

    await expect(service.authenticate(`Bearer ${generated.key}`)).rejects.toMatchObject({
      message: "Invalid API key",
    });
  });

  it("accepts a valid key with 501 and does not proxy", async () => {
    const generated = generateApiKey("test");
    const service = new GatewayService(
      repository(
        makeRecord({
          key_hash: generated.hash,
          key_prefix: generated.prefix,
        }),
      ),
    );
    const controller = new GatewayController(service);
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });

    await controller.handle(requestWith(`Bearer ${generated.key}`), {
      status,
    } as unknown as Response);

    expect(status).toHaveBeenCalledWith(501);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: "GATEWAY_NOT_READY",
        message: "The API key is valid. This gateway does not proxy requests yet.",
      },
    });
  });

  it("does not answer 501 when the key is rejected", async () => {
    const service = new GatewayService(repository(null));
    const controller = new GatewayController(service);
    const status = vi.fn();

    await expect(
      controller.handle(requestWith("Bearer ms_test_abcdefghijklmnop"), {
        status,
      } as unknown as Response),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(status).not.toHaveBeenCalled();
  });
});

describe("gateway body parsing", () => {
  it("leaves the gateway body unread and still parses control-plane JSON", () => {
    expect(skipsJsonBody("/gateway")).toBe(true);
    expect(skipsJsonBody("/gateway/v1/images")).toBe(true);
    expect(skipsJsonBody("/gateway?debug=1")).toBe(true);
    expect(skipsJsonBody("/api/v1/webhooks/stripe")).toBe(true);
    expect(skipsJsonBody("/api/v1/products")).toBe(false);
    expect(skipsJsonBody("/gateway-admin")).toBe(false);
  });
});
