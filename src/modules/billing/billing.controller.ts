import type { Request, Response } from "express";
import { billingService } from "./billing.service";

export class BillingController {
  async getSubscription(req: Request, res: Response): Promise<void> {
    const subscription = await billingService.getSubscription(
      req.organization.id,
    );
    res.status(200).json(subscription);
  }

  async createCheckoutSession(req: Request, res: Response): Promise<void> {
    const session = await billingService.createCheckoutSession(
      req.organization.id,
      req.organization.name,
      req.user.email,
      req.organization.stripeCustomerId,
    );
    res.status(200).json(session);
  }

  async createCustomerPortalSession(
    req: Request,
    res: Response,
  ): Promise<void> {
    const session = await billingService.createCustomerPortalSession(
      req.organization.id,
      req.organization.name,
      req.user.email,
      req.organization.stripeCustomerId,
    );
    res.status(200).json(session);
  }
}

export const billingController = new BillingController();
