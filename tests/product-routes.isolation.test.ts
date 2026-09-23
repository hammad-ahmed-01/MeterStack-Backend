import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../src/common/errors";
import { ProductRoutesService } from "../src/modules/product-routes/product-routes.service";
import type { ProductRoutesRepository } from "../src/modules/product-routes/product-routes.repository";
import type { ProductRouteRecord } from "../src/modules/product-routes/product-routes.types";
import type { ProductsRepository } from "../src/modules/products/products.repository";
import type { ProductRecord } from "../src/modules/products/products.types";

const product: ProductRecord = {
  id: "product-1",
  organization_id: "org-a",
  name: "Images",
  description: null,
  base_url: "https://api.acme.dev",
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const route: ProductRouteRecord = {
  id: "route-1",
  product_id: "product-1",
  method: "GET",
  path: "/images",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function serviceWith(options: {
  product?: ProductRecord | null;
  routes?: Partial<ProductRoutesRepository>;
}) {
  const findById = vi.fn().mockResolvedValue(options.product === undefined ? product : options.product);
  const products = { findById } as unknown as ProductsRepository;
  const routes = {
    list: vi.fn().mockResolvedValue([route]),
    create: vi.fn().mockResolvedValue(route),
    update: vi.fn().mockResolvedValue(route),
    ...options.routes,
  } as unknown as ProductRoutesRepository;

  return {
    service: new ProductRoutesService(routes, products),
    findById,
    routes: routes as unknown as {
      list: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    },
  };
}

describe("product route organization isolation", () => {
  it("loads routes only after the product belongs to the caller", async () => {
    const { service, findById, routes } = serviceWith({});

    const result = await service.list("product-1", "org-a");

    expect(findById).toHaveBeenCalledWith("product-1", "org-a");
    expect(routes.list).toHaveBeenCalledWith("product-1");
    expect(result[0]?.productId).toBe("product-1");
  });

  it("does not list routes when the product is outside the organization", async () => {
    const { service, routes } = serviceWith({ product: null });

    await expect(service.list("product-from-org-b", "org-a")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(routes.list).not.toHaveBeenCalled();
  });

  it("scopes route updates to the product and returns not found for a missing route", async () => {
    const update = vi.fn().mockResolvedValue(null);
    const { service } = serviceWith({ routes: { update } });

    await expect(
      service.update("product-1", "route-from-elsewhere", "org-a", { path: "/hijack" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(update).toHaveBeenCalledWith("route-from-elsewhere", "product-1", {
      path: "/hijack",
    });
  });

  it("does not create a route on another organization's product", async () => {
    const { service, routes } = serviceWith({ product: null });

    await expect(
      service.create("product-from-org-b", "org-a", { method: "GET", path: "/images" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(routes.create).not.toHaveBeenCalled();
  });
});
