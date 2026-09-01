import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type { ProfileRecord } from "./users.types";

export class UsersRepository {
  async findById(id: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async upsert(id: string, fullName: string | null): Promise<ProfileRecord> {
    const existing = await this.findById(id);
    if (existing) {
      return existing;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert({ id, full_name: fullName })
      .select("id, full_name, created_at, updated_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to upsert profile"));
    }

    return data;
  }

  async updateFullName(id: string, fullName: string): Promise<ProfileRecord> {
    const existing = await this.findById(id);

    if (!existing) {
      return this.upsert(id, fullName);
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", id)
      .select("id, full_name, created_at, updated_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to update profile"));
    }

    return data;
  }
}

export const usersRepository = new UsersRepository();
