import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { gatewayController } from "./gateway.controller";

export const gatewayRoutes = Router();

gatewayRoutes.use(
  asyncHandler((req, res) => gatewayController.handle(req, res)),
);
