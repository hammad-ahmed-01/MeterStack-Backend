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
 * also upserts the profile so first authenticated access still works
 * if the trigger did not run (for example, users created before the
 * migration).
 */
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async getMe(user: AuthUser): Promise<MeResponse> {
    const profile = await this.repository.upsert(user.id, user.fullName);

    return {
      id: user.id,
      email: user.email,
      fullName: profile.full_name ?? user.fullName ?? "",
    };
  }
}

export const usersService = new UsersService(usersRepository);
