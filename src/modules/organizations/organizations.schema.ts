import { z } from "zod";

export const createOrganizationBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const updateOrganizationBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
});
