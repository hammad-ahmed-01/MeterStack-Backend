import { Router } from "express";
import { apiKeysRoutes } from "../modules/api-keys/api-keys.routes";
import { billingRoutes } from "../modules/billing/billing.routes";
import { stripeWebhookRoutes } from "../modules/billing/stripe-webhook.routes";
import { healthRoutes } from "../modules/health/health.routes";
import { organizationsRoutes } from "../modules/organizations/organizations.routes";
import { productsRoutes } from "../modules/products/products.routes";
import { usersRoutes } from "../modules/users/users.routes";

export const apiV1Router = Router();

apiV1Router.use("/health", healthRoutes);
apiV1Router.use(usersRoutes);
apiV1Router.use("/organizations", organizationsRoutes);
apiV1Router.use("/products", productsRoutes);
apiV1Router.use("/api-keys", apiKeysRoutes);
apiV1Router.use("/billing", billingRoutes);
apiV1Router.use("/webhooks/stripe", stripeWebhookRoutes);
