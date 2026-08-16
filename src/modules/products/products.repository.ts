import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type {
  CreateProductInput,
  ProductRecord,
  ProductStatus,
  UpdateProductInput,
} from "./products.types";

export class ProductsRepository {
  async list(
    organizationId: string,
    status?: ProductStatus,
  ): Promise<ProductRecord[]> {
    let query = supabaseAdmin
      .from("api_products")
      .select(
        "id, organization_id, name, description, status, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      rethrowDatabaseError(error);
    }

    return data ?? [];
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<ProductRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("api_products")
      .select(
        "id, organization_id, name, description, status, created_at, updated_at",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async create(
    organizationId: string,
    input: CreateProductInput,
  ): Promise<ProductRecord> {
    const { data, error } = await supabaseAdmin
      .from("api_products")
      .insert({
        organization_id: organizationId,
        name: input.name,
        description: input.description ?? null,
        status: "active",
      })
      .select(
        "id, organization_id, name, description, status, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to create product"));
    }

    return data;
  }

  async update(
    id: string,
    organizationId: string,
    input: UpdateProductInput,
  ): Promise<ProductRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("api_products")
      .update({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select(
        "id, organization_id, name, description, status, created_at, updated_at",
      )
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async archive(
    id: string,
    organizationId: string,
  ): Promise<ProductRecord | null> {
    return this.update(id, organizationId, { status: "archived" });
  }
}

export const productsRepository = new ProductsRepository();
