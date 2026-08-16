import type { Request, Response } from "express";
import { productsService } from "./products.service";
import type { ProductStatus } from "./products.types";

export class ProductsController {
  async list(req: Request, res: Response): Promise<void> {
    const status = req.query.status as ProductStatus | undefined;
    const products = await productsService.list(req.organization.id, status);
    res.status(200).json({ data: products });
  }

  async getById(req: Request, res: Response): Promise<void> {
    const product = await productsService.getById(
      req.params.id as string,
      req.organization.id,
    );
    res.status(200).json(product);
  }

  async create(req: Request, res: Response): Promise<void> {
    const product = await productsService.create(req.organization.id, {
      name: req.body.name as string,
      description: req.body.description as string | undefined,
    });
    res.status(201).json(product);
  }

  async update(req: Request, res: Response): Promise<void> {
    const product = await productsService.update(
      req.params.id as string,
      req.organization.id,
      req.body,
    );
    res.status(200).json(product);
  }

  async archive(req: Request, res: Response): Promise<void> {
    const product = await productsService.archive(
      req.params.id as string,
      req.organization.id,
    );
    res.status(200).json(product);
  }
}

export const productsController = new ProductsController();
