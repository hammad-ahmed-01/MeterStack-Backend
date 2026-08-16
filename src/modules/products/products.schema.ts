import { z } from "zod";

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listProductsQuerySchema = z.object({
  status: z.enum(["active", "archived"]).optional(),
});

export const createProductBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
});

export const updateProductBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "At least one field is required" },
  );
