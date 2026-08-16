import type { Request, Response } from "express";
import { organizationsService } from "./organizations.service";

export class OrganizationsController {
  async create(req: Request, res: Response): Promise<void> {
    const organization = await organizationsService.create(
      req.user,
      req.body.name as string,
    );
    res.status(201).json(organization);
  }

  async getCurrent(req: Request, res: Response): Promise<void> {
    const organization = await organizationsService.getCurrent(
      req.user.id,
      req.header("x-organization-id"),
    );
    res.status(200).json(organization);
  }

  async updateCurrent(req: Request, res: Response): Promise<void> {
    const organization = await organizationsService.updateCurrent(
      req.organization.role,
      req.organization.id,
      req.body.name as string,
    );
    res.status(200).json(organization);
  }
}

export const organizationsController = new OrganizationsController();
