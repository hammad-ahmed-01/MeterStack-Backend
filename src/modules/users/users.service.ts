import type { AuthUser } from "../../common/types";
import { usersRepository, type UsersRepository } from "./users.repository";
import type { MeResponse } from "./users.types";

/**
 * Profile strategy (v0.1)
 * -----------------------
 * `auth.users` is owned by Supabase Auth. This API stores a separate
 * `profiles` row for product data.
 *
 * A database trigger creates the profile on registration. `GET /me`
 * creates the profile if it is missing, without overwriting an
 * existing name. `PATCH /me` updates `profiles.full_name`.
 */
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getMe(user: AuthUser): Promise<MeResponse> {
    const profile = await this.repository.upsert(user.id, user.fullName);
    return this.toResponse(user, profile.full_name);
  }

  async updateMe(user: AuthUser, fullName: string): Promise<MeResponse> {
    const profile = await this.repository.updateFullName(user.id, fullName);
    return this.toResponse(user, profile.full_name);
  }

  private toResponse(user: AuthUser, fullName: string | null): MeResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: fullName ?? user.fullName ?? "",
    };
  }
}

export const usersService = new UsersService(usersRepository);
