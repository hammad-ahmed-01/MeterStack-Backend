import type { NextFunction, Request, Response } from "express";
import { requireMembership } from "../common/utils/organization-auth";
import { organizationsService } from "../modules/organizations/organizations.service";

export async function requireOrganization(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const memberships = await organizationsService.listMemberships(req.user.id);
    const requestedOrganizationId = req.header("x-organization-id");
    const membership = requireMembership(memberships, requestedOrganizationId);

    req.organization = {
      id: membership.id,
      name: membership.name,
      slug: membership.slug,
      role: membership.role,
      stripeCustomerId: membership.stripeCustomerId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
