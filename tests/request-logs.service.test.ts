import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../src/common/errors";
import type { ApiKeysRepository } from "../src/modules/api-keys/api-keys.repository";
import type { ApiKeyRecord } from "../src/modules/api-keys/api-keys.types";
import type { ProductsRepository } from "../src/modules/products/products.repository";
import type { ProductRecord } from "../src/modules/products/products.types";
import type { RequestLogsRepository } from "../src/modules/request-logs/request-logs.repository";
import { RequestLogsService } from "../src/modules/request-logs/request-logs.service";
import type { RequestLogRecord } from "../src/modules/request-logs/request-logs.types";

const product: ProductRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "org-a",
  name: "Images",
  description: null,
  base_url: "https://api.acme.dev",
  rate_limit: null,
  rate_limit_window_seconds: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const apiKey = {
  id: "22222222-2222-4222-8222-222222222222",
  organization_id: "org-a",
  name: "Server",
  key_prefix: "ms_test_abcd",
  key_hash: "hash",
  environment: "test",
  status: "active",
  last_used_at: null,
  created_at: "2026-01-01T00:00:00.000Z",
  revoked_at: null,
} as ApiKeyRecord;

const log: RequestLogRecord = {
  id: "33333333-3333-4333-8333-333333333333",
  organization_id: "org-a",
  product_id: product.id,
  method: "GET",
  path: "/images",
  status_code: 200,
  key_prefix: "ms_test_abcd",
  latency_ms: 18,
  created_at: "2026-01-02T00:00:00.000Z",
  product_name: "Images",
};

function serviceWith(options?: {
  product?: ProductRecord | null;
  apiKey?: ApiKeyRecord | null;
}) {
  const list = vi.fn().mockResolvedValue([log]);
  const create = vi.fn().mockImplementation(async (input) => ({
    ...log,
    product_id: input.productId,
    method: input.method,
    path: input.path,
    status_code: input.statusCode,
    key_prefix: input.keyPrefix,
    latency_ms: input.latencyMs,
    created_at: input.createdAt,
    product_name: null,
  }));
  const logs = { list, create } as unknown as RequestLogsRepository;

  const findProduct = vi.fn().mockResolvedValue(options?.product === undefined ? product : options.product);
  const products = { findById: findProduct } as unknown as ProductsRepository;

  const findKey = vi.fn().mockResolvedValue(options?.apiKey === undefined ? apiKey : options.apiKey);
  const touchLastUsed = vi.fn().mockResolvedValue(undefined);
  const apiKeys = { findById: findKey, touchLastUsed } as unknown as ApiKeysRepository;

  return {
    service: new RequestLogsService(logs, products, apiKeys),
    list,
    create,
    findProduct,
    findKey,
    touchLastUsed,
  };
}

const call = {
  productId: product.id,
  apiKeyId: apiKey.id,
  method: "GET" as const,
  path: "/images",
  statusCode: 200,
  latencyMs: 18,
};

describe("request log organization isolation", () => {
  it("lists logs with the caller's organization id and filters", async () => {
    const { service, list } = serviceWith();

    const result = await service.list("org-a", {
      productId: product.id,
      statusClass: "2xx",
      limit: 20,
    });

    expect(list).toHaveBeenCalledWith("org-a", {
      productId: product.id,
      statusClass: "2xx",
      limit: 20,
    });
    expect(result[0]?.productName).toBe("Images");
  });

  it("does not record a request for a product outside the organization", async () => {
    const { service, create, touchLastUsed } = serviceWith({ product: null });

    await expect(service.record("org-a", call)).rejects.toBeInstanceOf(NotFoundError);
    expect(create).not.toHaveBeenCalled();
    expect(touchLastUsed).not.toHaveBeenCalled();
  });

  it("does not record a request for a key outside the organization", async () => {
    const { service, create, touchLastUsed } = serviceWith({ apiKey: null });

    await expect(service.record("org-a", call)).rejects.toBeInstanceOf(NotFoundError);
    expect(create).not.toHaveBeenCalled();
    expect(touchLastUsed).not.toHaveBeenCalled();
  });

  it("stores the key prefix from the organization key and stamps last_used_at", async () => {
    const { service, create, touchLastUsed, findProduct, findKey } = serviceWith();

    const result = await service.record("org-a", {
      ...call,
      keyPrefix: "spoofed",
    });

    expect(findProduct).toHaveBeenCalledWith(product.id, "org-a");
    expect(findKey).toHaveBeenCalledWith(apiKey.id, "org-a");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-a",
        productId: product.id,
        apiKeyId: apiKey.id,
        keyPrefix: "ms_test_abcd",
      }),
    );
    expect(touchLastUsed).toHaveBeenCalledWith(apiKey.id, "org-a", result.createdAt);
    expect(result.productName).toBe("Images");
    expect(result.keyPrefix).toBe("ms_test_abcd");
  });
});
