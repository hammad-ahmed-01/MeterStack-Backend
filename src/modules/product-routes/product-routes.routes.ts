import { Router } from "express";
import { asyncHandler } from "../../common/utils/async-handler";
import { validate } from "../../middleware/validate.middleware";
import { productIdParamsSchema } from "../products/products.schema";
import { productRoutesController } from "./product-routes.controller";
import {
  createProductRouteBodySchema,
  productRouteParamsSchema,
  updateProductRouteBodySchema,
} from "./product-routes.schema";

export const productRoutesRouter = Router({ mergeParams: true });

productRoutesRouter.get(
  "/",
  validate({ params: productIdParamsSchema }),
  asyncHandler((req, res) => productRoutesController.list(req, res)),
);

productRoutesRouter.post(
  "/",
  validate({ params: productIdParamsSchema, body: createProductRouteBodySchema }),
  asyncHandler((req, res) => productRoutesController.create(req, res)),
);

productRoutesRouter.patch(
  "/:routeId",
  validate({ params: productRouteParamsSchema, body: updateProductRouteBodySchema }),
  asyncHandler((req, res) => productRoutesController.update(req, res)),
);

productRoutesRouter.delete(
  "/:routeId",
  validate({ params: productRouteParamsSchema }),
  asyncHandler((req, res) => productRoutesController.disable(req, res)),
);
