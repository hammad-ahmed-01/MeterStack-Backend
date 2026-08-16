import cors from "cors";
import express, { type Request } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { logger } from "./common/utils/logger";
import { env } from "./config/env";
import {
  errorMiddleware,
  notFoundMiddleware,
} from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { apiV1Router } from "./routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Organization-Id",
        "X-Request-Id",
        "Stripe-Signature",
      ],
    }),
  );

  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as Request).requestId,
      customLogLevel(_req, res, error) {
        if (res.statusCode >= 500 || error) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        return "info";
      },
      serializers: {
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
          };
        },
        res(response) {
          return {
            statusCode: response.statusCode,
          };
        },
      },
      customProps: (req) => ({
        requestId: (req as Request).requestId,
      }),
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie"],
        censor: "[REDACTED]",
      },
    }),
  );

  // Stripe signature verification requires the raw request body.
  app.use("/api/v1/webhooks/stripe", express.raw({ type: "application/json" }));
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/v1/webhooks/stripe")) {
      next();
      return;
    }

    express.json({ limit: "1mb" })(req, res, next);
  });

  app.use("/api/v1", apiV1Router);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
