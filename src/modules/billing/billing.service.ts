import { AppError, ConflictError, NotFoundError } from "../../common/errors";
import { logger } from "../../common/utils/logger";
import { env } from "../../config/env";
import {
  requireStripe,
  requireStripeProPriceId,
} from "../../config/stripe";
import { organizationsRepository } from "../organizations/organizations.repository";
import {
  billingRepository,
  type BillingRepository,
} from "./billing.repository";
import type {
  CheckoutSessionResponse,
  CustomerPortalResponse,
  SubscriptionRecord,
  SubscriptionResponse,
} from "./billing.types";

export class BillingService {
  constructor(private readonly repository: BillingRepository) {}

  async getSubscription(organizationId: string): Promise<SubscriptionResponse> {
    const subscription =
      await this.repository.findByOrganizationId(organizationId);

    if (!subscription) {
      throw new NotFoundError("Subscription not found");
    }

    return this.toResponse(subscription);
  }

  async createCheckoutSession(
    organizationId: string,
    organizationName: string,
    email: string,
    stripeCustomerId: string | null,
  ): Promise<CheckoutSessionResponse> {
    const stripe = requireStripe();
    const priceId = requireStripeProPriceId();

    const subscription =
      await this.repository.findByOrganizationId(organizationId);

    if (
      subscription?.plan === "pro" &&
      subscription.status === "active" &&
      subscription.stripe_subscription_id
    ) {
      throw new ConflictError("Organization is already on the Pro plan");
    }

    const customerId = await this.ensureStripeCustomer(
      organizationId,
      organizationName,
      email,
      stripeCustomerId,
    );

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.FRONTEND_URL}/billing?success=true`,
      cancel_url: `${env.FRONTEND_URL}/billing?canceled=true`,
      client_reference_id: organizationId,
      metadata: {
        organization_id: organizationId,
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
        },
      },
    });

    if (!session.url) {
      throw new AppError(
        500,
        "CHECKOUT_SESSION_FAILED",
        "Unable to create a Stripe Checkout session",
      );
    }

    return { url: session.url };
  }

  async createCustomerPortalSession(
    organizationId: string,
    organizationName: string,
    email: string,
    stripeCustomerId: string | null,
  ): Promise<CustomerPortalResponse> {
    const stripe = requireStripe();
    const customerId = await this.ensureStripeCustomer(
      organizationId,
      organizationName,
      email,
      stripeCustomerId,
    );

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${env.FRONTEND_URL}/billing`,
    });

    return { url: session.url };
  }

  async ensureStripeCustomer(
    organizationId: string,
    organizationName: string,
    email: string,
    stripeCustomerId: string | null,
  ): Promise<string> {
    if (stripeCustomerId) {
      return stripeCustomerId;
    }

    const stripe = requireStripe();
    const customer = await stripe.customers.create({
      name: organizationName,
      email: email || undefined,
      metadata: {
        organization_id: organizationId,
      },
    });

    await organizationsRepository.updateStripeCustomerId(
      organizationId,
      customer.id,
    );

    logger.info(
      { organizationId, stripeCustomerId: customer.id },
      "Created Stripe customer",
    );

    return customer.id;
  }

  private toResponse(record: SubscriptionRecord): SubscriptionResponse {
    return {
      id: record.id,
      organizationId: record.organization_id,
      plan: record.plan,
      status: record.status,
      stripeSubscriptionId: record.stripe_subscription_id,
      currentPeriodEnd: record.current_period_end,
    };
  }
}

export const billingService = new BillingService(billingRepository);
