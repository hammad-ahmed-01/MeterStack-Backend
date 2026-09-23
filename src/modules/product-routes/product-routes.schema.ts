import { z } from "zod";
import { httpMethods } from "./product-routes.types";

export const routePathSchema = z
  .string()
  .trim()
  .min(1, "Path is required")
  .max(512, "Path is too long")
  .transform((value) => (value.length > 1 ? value.replace(/\/+$/, "") : value))
  .refine((value) => value.startsWith("/"), "Path must start with /")
  .refine(
    (value) => !/[\s?#]/.test(value),
    "Path cannot include spaces, a query, or a hash",
  )
  .refine((value) => !value.includes("//"), "Path cannot contain empty segments");

export const productRouteParamsSchema = z.object({
  id: z.string().uuid(),
  routeId: z.string().uuid(),
});

export const createProductRouteBodySchema = z.object({
  method: z.enum(httpMethods),
  path: routePathSchema,
  description: z.string().trim().max(500).optional(),
});

export const updateProductRouteBodySchema = z
  .object({
    method: z.enum(httpMethods).optional(),
    path: routePathSchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    status: z.enum(["active", "disabled"]).optional(),
  })
  .refine(
    (value) =>
      value.method !== undefined ||
      value.path !== undefined ||
      value.description !== undefined ||
      value.status !== undefined,
    { message: "At least one field is required" },
  );
