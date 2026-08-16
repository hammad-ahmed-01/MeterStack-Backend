import type Stripe from "stripe";
import { logger } from "../../common/utils/logger";
import { env } from "../../config/env";
import { requireStripe } from "../../config/stripe";
import { organizationsRepository } from "../organizations/organizations.repository";
import { billingRepository } from "./billing.repository";
import type { SubscriptionPlan } from "./billing.types";

function unixToIso(seconds: number | null | undefined): string | null {
  if (!seconds) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const fromSubscription = (
    subscription as Stripe.Subscription & { current_period_end?: number }
  ).current_period_end;

  if (typeof fromSubscription === "number") {
    return unixToIso(fromSubscription);
  }

  const fromItem = subscription.items.data[0] as
    | { current_period_end?: number }
    | undefined;
  if (typeof fromItem?.current_period_end === "number") {
    return unixToIso(fromItem.current_period_end);
  }

  return null;
}

function getPriceId(subscription: Stripe.Subscription): string | null {
  const price = subscription.items.data[0]?.price;
  return price?.id ?? null;
}

function resolvePlan(
  status: Stripe.Subscription.Status,
  priceId: string | null,
): SubscriptionPlan {
  if (
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired"
  ) {
    return "free";
  }

  if (!priceId) {
    return "free";
  }

  if (env.STRIPE_PRO_PRICE_ID && priceId === env.STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  return "pro";
}

async function resolveOrganizationId(
  subscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
): Promise<string | null> {
  const fromMetadata = subscription.metadata.organization_id;
  if (fromMetadata) {
    return fromMetadata;
  }

  if (fallbackOrganizationId) {
    return fallbackOrganizationId;
  }

  if (subscription.id) {
    const bySubscription =
      await billingRepository.findOrganizationIdByStripeSubscriptionId(
        subscription.id,
      );
    if (bySubscription) {
      return bySubscription;
    }
  }

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    return null;
  }

  return organizationsRepository.findOrganizationIdByStripeCustomerId(
    customerId,
  );
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  fallbackOrganizationId?: string | null,
): Promise<void> {
  const organizationId = await resolveOrganizationId(
    subscription,
    fallbackOrganizationId,
  );

  if (!organizationId) {
    logger.warn(
      { stripeSubscriptionId: subscription.id },
      "Unable to resolve organization for Stripe subscription",
    );
    return;
  }

  const priceId = getPriceId(subscription);
  const plan = resolvePlan(subscription.status, priceId);

  await billingRepository.upsertForOrganization({
    organizationId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    plan,
    status: subscription.status,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
  });
}

export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  if (await billingRepository.hasStripeEvent(event.id)) {
    logger.info({ eventId: event.id, type: event.type }, "Duplicate Stripe event skipped");
    return;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        break;
      }

      const organizationId =
        session.metadata?.organization_id ?? session.client_reference_id;

      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (!subscriptionId) {
        logger.warn(
          { eventId: event.id },
          "checkout.session.completed without subscription id",
        );
        break;
      }

      const subscription = await requireStripe().subscriptions.retrieve(
        subscriptionId,
      );

      await syncSubscription(subscription, organizationId);
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(subscription);
      break;
    }
    default:
      logger.debug({ type: event.type }, "Ignoring unhandled Stripe event");
      break;
  }

  await billingRepository.recordStripeEvent(event.id, event.type);
}
