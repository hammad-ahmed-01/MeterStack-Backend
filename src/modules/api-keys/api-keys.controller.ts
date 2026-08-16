import type { Request, Response } from "express";
import { apiKeysService } from "./api-keys.service";
import type { ApiKeyEnvironment } from "./api-keys.types";

export class ApiKeysController {
  async list(req: Request, res: Response): Promise<void> {
    const keys = await apiKeysService.list(req.organization.id);
    res.status(200).json({ data: keys });
  }

  async create(req: Request, res: Response): Promise<void> {
    const created = await apiKeysService.create(
      req.organization.id,
      req.body.name as string,
      req.body.environment as ApiKeyEnvironment,
    );
    res.status(201).json(created);
  }

  async revoke(req: Request, res: Response): Promise<void> {
    const revoked = await apiKeysService.revoke(
      req.params.id as string,
      req.organization.id,
    );
    res.status(200).json(revoked);
  }
}

export const apiKeysController = new ApiKeysController();
