import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../common/errors";
import type { AuthUser } from "../common/types";
import { supabaseAdmin } from "../config/supabase";

type AuthUserLookup = (token: string) => Promise<AuthUser | null>;

function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export async function lookupSupabaseUser(token: string): Promise<AuthUser | null> {
  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  const fullName =
    (typeof data.user.user_metadata?.full_name === "string"
      ? data.user.user_metadata.full_name
      : null) ??
    (typeof data.user.user_metadata?.name === "string"
      ? data.user.user_metadata.name
      : null);

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName,
  };
}

export function createAuthMiddleware(lookupUser: AuthUserLookup) {
  return async function authMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const token = extractBearerToken(req.header("authorization"));

      if (!token) {
        throw new UnauthorizedError("Missing or invalid Authorization header");
      }

      const user = await lookupUser(token);

      if (!user) {
        throw new UnauthorizedError("Invalid or expired token");
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requireAuth = createAuthMiddleware(lookupSupabaseUser);
