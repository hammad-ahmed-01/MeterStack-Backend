import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrganization } from "../../middleware/organization.middleware";
import { validate } from "../../middleware/validate.middleware";
import { apiKeysController } from "./api-keys.controller";
import {
  apiKeyIdParamsSchema,
  createApiKeyBodySchema,
} from "./api-keys.schema";

export const apiKeysRoutes = Router();

apiKeysRoutes.use(requireAuth, requireOrganization);

apiKeysRoutes.get(
  "/",
  asyncHandler((req, res) => apiKeysController.list(req, res)),
);

apiKeysRoutes.post(
  "/",
  validate({ body: createApiKeyBodySchema }),
  asyncHandler((req, res) => apiKeysController.create(req, res)),
);

apiKeysRoutes.delete(
  "/:id",
  validate({ params: apiKeyIdParamsSchema }),
  asyncHandler((req, res) => apiKeysController.revoke(req, res)),
);
