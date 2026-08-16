import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrganization } from "../../middleware/organization.middleware";
import { validate } from "../../middleware/validate.middleware";
import { organizationsController } from "./organizations.controller";
import {
  createOrganizationBodySchema,
  updateOrganizationBodySchema,
} from "./organizations.schema";

export const organizationsRoutes = Router();

organizationsRoutes.post(
  "/",
  requireAuth,
  validate({ body: createOrganizationBodySchema }),
  asyncHandler((req, res) => organizationsController.create(req, res)),
);

organizationsRoutes.get(
  "/current",
  requireAuth,
  asyncHandler((req, res) => organizationsController.getCurrent(req, res)),
);

organizationsRoutes.patch(
  "/current",
  requireAuth,
  requireOrganization,
  validate({ body: updateOrganizationBodySchema }),
  asyncHandler((req, res) => organizationsController.updateCurrent(req, res)),
);
