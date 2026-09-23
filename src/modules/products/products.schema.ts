import { z } from "zod";

function canonicalizeBaseUrl(value: string): string {
  const url = new URL(value);

  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString().replace(/\/$/, "");
}

export const baseUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .superRefine((value, ctx) => {
    let url: URL;

    try {
      url = new URL(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an http or https URL",
      });
      return;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter an http or https URL",
      });
    }

    if (url.username || url.password || url.search || url.hash) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Base URL cannot include credentials, a query, or a hash",
      });
    }
  })
  .transform((value) => canonicalizeBaseUrl(value));

const optionalBaseUrlSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }

  return value;
}, z.union([baseUrlSchema, z.null()]).optional());

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
    baseUrl: optionalBaseUrlSchema,
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.status !== undefined ||
      value.baseUrl !== undefined,
    { message: "At least one field is required" },
  );
