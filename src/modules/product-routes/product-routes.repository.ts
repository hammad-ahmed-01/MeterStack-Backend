import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type {
  CreateProductRouteInput,
  ProductRouteRecord,
  UpdateProductRouteInput,
} from "./product-routes.types";

const routeColumns =
  "id, product_id, method, path, description, status, created_at, updated_at";

const duplicateRouteMessage = "A route with this method and path already exists";

export class ProductRoutesRepository {
  async list(productId: string): Promise<ProductRouteRecord[]> {
    const { data, error } = await supabaseAdmin
      .from("product_routes")
      .select(routeColumns)
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (error) {
      rethrowDatabaseError(error);
    }

    return data ?? [];
  }

  async create(
    productId: string,
    input: CreateProductRouteInput,
  ): Promise<ProductRouteRecord> {
    const { data, error } = await supabaseAdmin
      .from("product_routes")
      .insert({
        product_id: productId,
        method: input.method,
        path: input.path,
        description: input.description ?? null,
        status: "active",
      })
      .select(routeColumns)
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to create route"), duplicateRouteMessage);
    }

    return data;
  }

  async update(
    routeId: string,
    productId: string,
    input: UpdateProductRouteInput,
  ): Promise<ProductRouteRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("product_routes")
      .update({
        ...(input.method !== undefined ? { method: input.method } : {}),
        ...(input.path !== undefined ? { path: input.path } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .eq("id", routeId)
      .eq("product_id", productId)
      .select(routeColumns)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error, duplicateRouteMessage);
    }

    return data;
  }
}

export const productRoutesRepository = new ProductRoutesRepository();
