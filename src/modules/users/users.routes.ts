import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { usersController } from "./users.controller";

export const usersRoutes = Router();

usersRoutes.get(
  "/me",
  requireAuth,
  asyncHandler((req, res) => usersController.getMe(req, res)),
);
