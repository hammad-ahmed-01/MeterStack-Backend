import pino from "pino";
import { env } from "../../config/env";

const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "accessToken",
  "access_token",
  "token",
  "key",
  "keyHash",
  "key_hash",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});
