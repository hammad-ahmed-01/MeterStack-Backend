import { ConflictError, NotFoundError } from "../../common/errors";
import type { AuthUser, OrganizationMembership } from "../../common/types";
import { randomHex } from "../../common/utils/crypto";
import { logger } from "../../common/utils/logger";
import {
  requireMembership,
  requireOwnerRole,
} from "../../common/utils/organization-auth";
import { slugify, withSlugSuffix } from "../../common/utils/slug";
import { stripe } from "../../config/stripe";
import {
  organizationsRepository,
  type OrganizationsRepository,
} from "./organizations.repository";
import type {
  OrganizationRecord,
  OrganizationResponse,
} from "./organizations.types";

const SLUG_ATTEMPTS = 5;

export class OrganizationsService {
  constructor(private readonly repository: OrganizationsRepository) {}

  async listMemberships(userId: string): Promise<OrganizationMembership[]> {
    return this.repository.listMemberships(userId);
  }

  async create(
    user: AuthUser,
    name: string,
  ): Promise<OrganizationResponse> {
    const org = await this.createWithUniqueSlug(name, user.id);
    const withCustomer = await this.createStripeCustomer(org, user.email);

    return {
      id: withCustomer.id,
      name: withCustomer.name,
      slug: withCustomer.slug,
      role: "owner",
      stripeCustomerId: withCustomer.stripe_customer_id,
      createdAt: withCustomer.created_at,
      updatedAt: withCustomer.updated_at,
    };
  }

  async getCurrent(
    userId: string,
    requestedOrganizationId?: string,
  ): Promise<OrganizationResponse> {
    const memberships = await this.repository.listMemberships(userId);

    if (memberships.length === 0) {
      throw new NotFoundError(
        "No organization found",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    const membership = requireMembership(memberships, requestedOrganizationId);
    const org = await this.repository.findById(membership.id);

    if (!org) {
      throw new NotFoundError(
        "No organization found",
        "ORGANIZATION_NOT_FOUND",
      );
    }

    return this.toResponse(org, membership.role);
  }

  async updateCurrent(
    role: string,
    organizationId: string,
    name: string,
  ): Promise<OrganizationResponse> {
    requireOwnerRole(role);
    const org = await this.repository.updateName(organizationId, name);
    return this.toResponse(org, "owner");
  }

  private async createWithUniqueSlug(
    name: string,
    userId: string,
  ): Promise<OrganizationRecord> {
    const base = slugify(name);

    for (let attempt = 0; attempt < SLUG_ATTEMPTS; attempt += 1) {
      const slug =
        attempt === 0 ? base : withSlugSuffix(base, randomHex(3));

      const existing = await this.repository.findBySlug(slug);
      if (existing) {
        continue;
      }

      try {
        return await this.repository.createWithOwner(name, slug, userId);
      } catch (error) {
        if (error instanceof ConflictError && attempt < SLUG_ATTEMPTS - 1) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictError("Unable to allocate a unique organization slug");
  }

  private async createStripeCustomer(
    org: OrganizationRecord,
    email: string,
  ): Promise<OrganizationRecord> {
    if (!stripe) {
      return org;
    }

    try {
      const customer = await stripe.customers.create({
        name: org.name,
        email: email || undefined,
        metadata: {
          organization_id: org.id,
        },
      });

      return await this.repository.updateStripeCustomerId(org.id, customer.id);
    } catch (error) {
      logger.error(
        { err: error, organizationId: org.id },
        "Failed to create Stripe customer; organization was still created",
      );
      return org;
    }
  }

  private toResponse(
    org: OrganizationRecord,
    role: "owner" | "member",
  ): OrganizationResponse {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      role,
      stripeCustomerId: org.stripe_customer_id,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }
}

export const organizationsService = new OrganizationsService(
  organizationsRepository,
);
