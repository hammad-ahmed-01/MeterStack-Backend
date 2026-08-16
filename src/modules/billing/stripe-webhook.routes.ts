import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { stripeWebhookController } from "./stripe-webhook.controller";

export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post(
  "/",
  asyncHandler((req, res) => stripeWebhookController.handle(req, res)),
);
