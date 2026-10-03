import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrganization } from "../../middleware/organization.middleware";
import { validate } from "../../middleware/validate.middleware";
import { requestLogsController } from "./request-logs.controller";
import { listRequestLogsQuerySchema } from "./request-logs.schema";

export const requestLogsRoutes = Router();

requestLogsRoutes.use(requireAuth, requireOrganization);

requestLogsRoutes.get(
  "/",
  validate({ query: listRequestLogsQuerySchema }),
  asyncHandler((req, res) => requestLogsController.list(req, res)),
);
