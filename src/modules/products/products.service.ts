import { NotFoundError } from "../../common/errors";
import {
  productsRepository,
  type ProductsRepository,
} from "./products.repository";
import type {
  CreateProductInput,
  ProductRecord,
  ProductResponse,
  ProductStatus,
  UpdateProductInput,
} from "./products.types";

export class ProductsService {
  constructor(private readonly repository: ProductsRepository) {}

  async list(
    organizationId: string,
    status?: ProductStatus,
  ): Promise<ProductResponse[]> {
    const products = await this.repository.list(organizationId, status);
    return products.map((product) => this.toResponse(product));
  }

  async getById(id: string, organizationId: string): Promise<ProductResponse> {
    const product = await this.requireProduct(id, organizationId);
    return this.toResponse(product);
  }

  async create(
    organizationId: string,
    input: CreateProductInput,
  ): Promise<ProductResponse> {
    const product = await this.repository.create(organizationId, input);
    return this.toResponse(product);
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateProductInput,
  ): Promise<ProductResponse> {
    const product = await this.repository.update(id, organizationId, input);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return this.toResponse(product);
  }

  async archive(id: string, organizationId: string): Promise<ProductResponse> {
    const product = await this.repository.archive(id, organizationId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return this.toResponse(product);
  }

  private async requireProduct(
    id: string,
    organizationId: string,
  ): Promise<ProductRecord> {
    const product = await this.repository.findById(id, organizationId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }

  private toResponse(product: ProductRecord): ProductResponse {
    return {
      id: product.id,
      organizationId: product.organization_id,
      name: product.name,
      description: product.description,
      status: product.status,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }
}

export const productsService = new ProductsService(productsRepository);
