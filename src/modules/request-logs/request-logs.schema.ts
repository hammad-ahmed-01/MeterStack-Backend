import { z } from "zod";

export const requestMethods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;

export const statusClasses = ["2xx", "4xx", "5xx"] as const;

export type RequestMethod = (typeof requestMethods)[number];
export type StatusClass = (typeof statusClasses)[number];

export const listRequestLogsQuerySchema = z.object({
  productId: z.string().uuid().optional(),
  statusClass: z.enum(statusClasses).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListRequestLogsQuery = z.infer<typeof listRequestLogsQuerySchema>;

export const recordRequestSchema = z.object({
  productId: z.string().uuid().nullish(),
  apiKeyId: z.string().uuid().nullish(),
  method: z.enum(requestMethods),
  path: z
    .string()
    .trim()
    .min(1)
    .max(2048)
    .refine((value) => value.startsWith("/"), "Path must start with /"),
  statusCode: z.number().int().min(100).max(599),
  latencyMs: z.number().int().min(0).max(600_000),
  keyPrefix: z.string().trim().min(1).max(64).nullish(),
});

export type RecordRequestInput = z.infer<typeof recordRequestSchema>;
