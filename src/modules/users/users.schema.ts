import { z } from "zod";

export const updateMeBodySchema = z.object({
  fullName: z.string().trim().min(1).max(80),
});
