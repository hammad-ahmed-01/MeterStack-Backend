import { z } from "zod";

export const apiKeyIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createApiKeyBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  environment: z.enum(["test", "live"]),
});
