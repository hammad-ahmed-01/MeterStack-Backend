import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../src/common/errors";
import type { ProductsRepository } from "../src/modules/products/products.repository";
import { ProductsService } from "../src/modules/products/products.service";
import type { ProductRecord } from "../src/modules/products/products.types";

const orgAProduct: ProductRecord = {
  id: "product-1",
  organization_id: "org-a",
  name: "Payments API",
  description: null,
  status: "active",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("product organization isolation", () => {
  it("always queries products with the caller's organization id", async () => {
    const findById = vi.fn().mockResolvedValue(orgAProduct);
    const repository = {
      findById,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
    } as unknown as ProductsRepository;

    const service = new ProductsService(repository);
    const product = await service.getById("product-1", "org-a");

    expect(findById).toHaveBeenCalledWith("product-1", "org-a");
    expect(product.organizationId).toBe("org-a");
  });

  it("returns not found when a product belongs to another organization", async () => {
    const findById = vi.fn().mockResolvedValue(null);
    const repository = {
      findById,
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
    } as unknown as ProductsRepository;

    const service = new ProductsService(repository);

    await expect(service.getById("product-from-org-b", "org-a")).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(findById).toHaveBeenCalledWith("product-from-org-b", "org-a");
  });

  it("scopes list, update, and archive operations to the organization", async () => {
    const list = vi.fn().mockResolvedValue([orgAProduct]);
    const update = vi.fn().mockResolvedValue(orgAProduct);
    const archive = vi.fn().mockResolvedValue({ ...orgAProduct, status: "archived" });
    const repository = {
      findById: vi.fn(),
      list,
      create: vi.fn(),
      update,
      archive,
    } as unknown as ProductsRepository;

    const service = new ProductsService(repository);

    await service.list("org-a");
    await service.update("product-1", "org-a", { name: "Updated" });
    await service.archive("product-1", "org-a");

    expect(list).toHaveBeenCalledWith("org-a", undefined);
    expect(update).toHaveBeenCalledWith("product-1", "org-a", { name: "Updated" });
    expect(archive).toHaveBeenCalledWith("product-1", "org-a");
  });

  it("does not leak another organization's product through update or archive", async () => {
    const repository = {
      findById: vi.fn(),
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue(null),
      archive: vi.fn().mockResolvedValue(null),
    } as unknown as ProductsRepository;

    const service = new ProductsService(repository);

    await expect(
      service.update("product-from-org-b", "org-a", { name: "Hijack" }),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.archive("product-from-org-b", "org-a")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
