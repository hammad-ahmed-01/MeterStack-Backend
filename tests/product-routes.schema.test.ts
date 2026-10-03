import { describe, expect, it } from "vitest";
import { updateProductBodySchema } from "../src/modules/products/products.schema";
import {
  createProductRouteBodySchema,
  updateProductRouteBodySchema,
} from "../src/modules/product-routes/product-routes.schema";

describe("product base URL", () => {
  it("stores an origin without a trailing slash", () => {
    const result = updateProductBodySchema.parse({
      baseUrl: "https://api.acme.dev/",
    });

    expect(result.baseUrl).toBe("https://api.acme.dev");
  });

  it("keeps a path prefix and drops a trailing slash", () => {
    const result = updateProductBodySchema.parse({
      baseUrl: "https://api.acme.dev/v1/",
    });

    expect(result.baseUrl).toBe("https://api.acme.dev/v1");
  });

  it("clears the base URL when the field is empty", () => {
    const result = updateProductBodySchema.parse({ baseUrl: "  " });

    expect(result.baseUrl).toBeNull();
  });

  it("rejects a non-http URL and a URL with a query", () => {
    expect(updateProductBodySchema.safeParse({ baseUrl: "ftp://files.acme.dev" }).success).toBe(
      false,
    );
    expect(
      updateProductBodySchema.safeParse({ baseUrl: "https://api.acme.dev/v1?debug=1" }).success,
    ).toBe(false);
  });
});

describe("product rate limit", () => {
  it("accepts a limit with a window", () => {
    const result = updateProductBodySchema.parse({
      rateLimit: 1000,
      rateLimitWindowSeconds: 60,
    });

    expect(result.rateLimit).toBe(1000);
    expect(result.rateLimitWindowSeconds).toBe(60);
  });

  it("clears the limit only when both fields are null", () => {
    const result = updateProductBodySchema.parse({
      rateLimit: null,
      rateLimitWindowSeconds: null,
    });

    expect(result.rateLimit).toBeNull();
    expect(result.rateLimitWindowSeconds).toBeNull();
  });

  it("rejects a limit without a window and a window that is not allowed", () => {
    expect(updateProductBodySchema.safeParse({ rateLimit: 100 }).success).toBe(false);
    expect(
      updateProductBodySchema.safeParse({
        rateLimit: 100,
        rateLimitWindowSeconds: 30,
      }).success,
    ).toBe(false);
  });
});

describe("product route body", () => {
  it("normalizes a path", () => {
    const result = createProductRouteBodySchema.parse({
      method: "GET",
      path: "/images/:id/",
      description: "Fetch one image",
    });

    expect(result.path).toBe("/images/:id");
  });

  it("rejects a path that does not start with a slash", () => {
    expect(
      createProductRouteBodySchema.safeParse({ method: "GET", path: "images" }).success,
    ).toBe(false);
  });

  it("rejects an empty update", () => {
    expect(updateProductRouteBodySchema.safeParse({}).success).toBe(false);
  });
});
