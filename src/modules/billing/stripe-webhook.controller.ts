import type { Request, Response } from "express";
import { UnauthorizedError } from "../../common/errors";
import { logger } from "../../common/utils/logger";
import { requireStripe, requireStripeWebhookSecret } from "../../config/stripe";
import { handleStripeEvent } from "./stripe-webhook.service";

export class StripeWebhookController {
  async handle(req: Request, res: Response): Promise<void> {
    const stripe = requireStripe();
    const webhookSecret = requireStripeWebhookSecret();
    const signature = req.header("stripe-signature");

    if (!signature) {
      throw new UnauthorizedError("Missing Stripe-Signature header");
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      logger.error("Stripe webhook received a parsed JSON body instead of a raw Buffer");
      throw new UnauthorizedError("Invalid webhook payload");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (error) {
      logger.warn({ err: error }, "Stripe webhook signature verification failed");
      throw new UnauthorizedError("Invalid Stripe webhook signature");
    }

    await handleStripeEvent(event);
    res.status(200).json({ received: true });
  }
}

export const stripeWebhookController = new StripeWebhookController();
