import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrganization } from "../../middleware/organization.middleware";
import { billingController } from "./billing.controller";

export const billingRoutes = Router();

billingRoutes.use(requireAuth, requireOrganization);

billingRoutes.get(
  "/subscription",
  asyncHandler((req, res) => billingController.getSubscription(req, res)),
);

billingRoutes.post(
  "/checkout-session",
  asyncHandler((req, res) =>
    billingController.createCheckoutSession(req, res),
  ),
);

billingRoutes.post(
  "/customer-portal",
  asyncHandler((req, res) =>
    billingController.createCustomerPortalSession(req, res),
  ),
);
