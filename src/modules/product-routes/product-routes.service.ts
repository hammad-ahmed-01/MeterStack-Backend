import { NotFoundError } from "../../common/errors";
import {
  productsRepository,
  type ProductsRepository,
} from "../products/products.repository";
import {
  productRoutesRepository,
  type ProductRoutesRepository,
} from "./product-routes.repository";
import type {
  CreateProductRouteInput,
  ProductRouteRecord,
  ProductRouteResponse,
  UpdateProductRouteInput,
} from "./product-routes.types";

export class ProductRoutesService {
  constructor(
    private readonly routes: ProductRoutesRepository,
    private readonly products: ProductsRepository,
  ) {}

  async list(productId: string, organizationId: string): Promise<ProductRouteResponse[]> {
    await this.requireProduct(productId, organizationId);
    const routes = await this.routes.list(productId);
    return routes.map((route) => this.toResponse(route));
  }

  async create(
    productId: string,
    organizationId: string,
    input: CreateProductRouteInput,
  ): Promise<ProductRouteResponse> {
    await this.requireProduct(productId, organizationId);
    const route = await this.routes.create(productId, input);
    return this.toResponse(route);
  }

  async update(
    productId: string,
    routeId: string,
    organizationId: string,
    input: UpdateProductRouteInput,
  ): Promise<ProductRouteResponse> {
    await this.requireProduct(productId, organizationId);
    const route = await this.routes.update(routeId, productId, input);

    if (!route) {
      throw new NotFoundError("Route not found");
    }

    return this.toResponse(route);
  }

  async disable(
    productId: string,
    routeId: string,
    organizationId: string,
  ): Promise<ProductRouteResponse> {
    return this.update(productId, routeId, organizationId, { status: "disabled" });
  }

  private async requireProduct(productId: string, organizationId: string): Promise<void> {
    const product = await this.products.findById(productId, organizationId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }
  }

  private toResponse(route: ProductRouteRecord): ProductRouteResponse {
    return {
      id: route.id,
      productId: route.product_id,
      method: route.method,
      path: route.path,
      description: route.description,
      status: route.status,
      createdAt: route.created_at,
      updatedAt: route.updated_at,
    };
  }
}

export const productRoutesService = new ProductRoutesService(
  productRoutesRepository,
  productsRepository,
);
