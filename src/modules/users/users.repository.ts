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
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        { id, full_name: fullName },
        { onConflict: "id" },
      )
      .select("id, full_name, created_at, updated_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to upsert profile"));
    }

    return data;
  }
}

export const usersRepository = new UsersRepository();
