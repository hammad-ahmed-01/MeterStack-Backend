import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireOrganization } from "../../middleware/organization.middleware";
import { validate } from "../../middleware/validate.middleware";
import { productsController } from "./products.controller";
import {
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamsSchema,
  updateProductBodySchema,
} from "./products.schema";

export const productsRoutes = Router();

productsRoutes.use(requireAuth, requireOrganization);

productsRoutes.get(
  "/",
  validate({ query: listProductsQuerySchema }),
  asyncHandler((req, res) => productsController.list(req, res)),
);

productsRoutes.post(
  "/",
  validate({ body: createProductBodySchema }),
  asyncHandler((req, res) => productsController.create(req, res)),
);

productsRoutes.get(
  "/:id",
  validate({ params: productIdParamsSchema }),
  asyncHandler((req, res) => productsController.getById(req, res)),
);

productsRoutes.patch(
  "/:id",
  validate({ params: productIdParamsSchema, body: updateProductBodySchema }),
  asyncHandler((req, res) => productsController.update(req, res)),
);

productsRoutes.delete(
  "/:id",
  validate({ params: productIdParamsSchema }),
  asyncHandler((req, res) => productsController.archive(req, res)),
);
