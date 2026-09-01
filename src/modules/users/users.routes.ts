import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { usersController } from "./users.controller";
import { updateMeBodySchema } from "./users.schema";

export const usersRoutes = Router();

usersRoutes.get(
  "/me",
  requireAuth,
  asyncHandler((req, res) => usersController.getMe(req, res)),
);

usersRoutes.patch(
  "/me",
  requireAuth,
  validate({ body: updateMeBodySchema }),
  asyncHandler((req, res) => usersController.updateMe(req, res)),
);
