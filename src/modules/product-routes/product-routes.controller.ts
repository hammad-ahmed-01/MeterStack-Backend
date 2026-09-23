import type { Request, Response } from "express";
import { productRoutesService } from "./product-routes.service";
import type { CreateProductRouteInput, UpdateProductRouteInput } from "./product-routes.types";

export class ProductRoutesController {
  async list(req: Request, res: Response): Promise<void> {
    const routes = await productRoutesService.list(
      req.params.id as string,
      req.organization.id,
    );
    res.status(200).json({ data: routes });
  }

  async create(req: Request, res: Response): Promise<void> {
    const route = await productRoutesService.create(
      req.params.id as string,
      req.organization.id,
      req.body as CreateProductRouteInput,
    );
    res.status(201).json(route);
  }

  async update(req: Request, res: Response): Promise<void> {
    const route = await productRoutesService.update(
      req.params.id as string,
      req.params.routeId as string,
      req.organization.id,
      req.body as UpdateProductRouteInput,
    );
    res.status(200).json(route);
  }

  async disable(req: Request, res: Response): Promise<void> {
    const route = await productRoutesService.disable(
      req.params.id as string,
      req.params.routeId as string,
      req.organization.id,
    );
    res.status(200).json(route);
  }
}

export const productRoutesController = new ProductRoutesController();
