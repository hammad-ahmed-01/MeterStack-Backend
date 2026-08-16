import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type { ApiKeyEnvironment, ApiKeyRecord } from "./api-keys.types";

type ApiKeyInsert = {
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  environment: ApiKeyEnvironment;
  status: "active";
};

export class ApiKeysRepository {
  async list(organizationId: string): Promise<ApiKeyRecord[]> {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select(
        "id, organization_id, name, key_prefix, key_hash, environment, status, last_used_at, created_at, revoked_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      rethrowDatabaseError(error);
    }

    return data ?? [];
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<ApiKeyRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select(
        "id, organization_id, name, key_prefix, key_hash, environment, status, last_used_at, created_at, revoked_at",
      )
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async create(input: ApiKeyInsert): Promise<ApiKeyRecord> {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .insert(input)
      .select(
        "id, organization_id, name, key_prefix, key_hash, environment, status, last_used_at, created_at, revoked_at",
      )
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to create API key"));
    }

    return data;
  }

  async revoke(
    id: string,
    organizationId: string,
  ): Promise<ApiKeyRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .update({
        status: "revoked",
        revoked_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select(
        "id, organization_id, name, key_prefix, key_hash, environment, status, last_used_at, created_at, revoked_at",
      )
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }
}

export const apiKeysRepository = new ApiKeysRepository();
