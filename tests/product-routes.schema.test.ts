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
