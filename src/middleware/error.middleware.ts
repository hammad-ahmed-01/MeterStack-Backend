import type { NextFunction, Request, Response } from "express";
import { AppError } from "../common/errors";
import { logger } from "../common/utils/logger";
import { env } from "../config/env";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(
        { err, requestId: req.requestId },
        err.message,
      );
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error({ err, requestId: req.requestId }, "Unhandled error");

  const message =
    env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
}

export function notFoundMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(
    new AppError(404, "ROUTE_NOT_FOUND", "Route not found"),
  );
}
