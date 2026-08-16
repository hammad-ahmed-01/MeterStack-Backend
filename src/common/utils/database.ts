import { ZodError } from "zod";
import { ConflictError, InternalServerError } from "../errors";
import { logger } from "./logger";

type DatabaseErrorLike = {
  code?: string;
  message?: string;
};

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as DatabaseErrorLike).code === "23505"
  );
}

export function rethrowDatabaseError(
  error: unknown,
  conflictMessage = "Resource already exists",
): never {
  if (isUniqueViolation(error)) {
    throw new ConflictError(conflictMessage);
  }

  logger.error({ err: error }, "Database operation failed");
  throw new InternalServerError();
}

export function formatZodError(error: ZodError): Array<{
  path: string;
  message: string;
}> {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}
