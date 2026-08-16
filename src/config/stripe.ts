import Stripe from "stripe";
import { AppError } from "../common/errors";
import { env } from "./env";

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { typescript: true })
  : null;

export function requireStripe(): Stripe {
  if (!stripe) {
    throw new AppError(
      400,
      "STRIPE_NOT_CONFIGURED",
      "STRIPE_SECRET_KEY is needed to perform this action.",
    );
  }

  return stripe;
}

export function requireStripeWebhookSecret(): string {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError(
      400,
      "STRIPE_NOT_CONFIGURED",
      "STRIPE_WEBHOOK_SECRET is needed to perform this action.",
    );
  }

  return env.STRIPE_WEBHOOK_SECRET;
}

export function requireStripeProPriceId(): string {
  if (!env.STRIPE_PRO_PRICE_ID) {
    throw new AppError(
      400,
      "STRIPE_NOT_CONFIGURED",
      "STRIPE_PRO_PRICE_ID is needed to perform this action.",
    );
  }

  return env.STRIPE_PRO_PRICE_ID;
}
