import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type {
  SubscriptionRecord,
  SubscriptionSyncInput,
} from "./billing.types";

export class BillingRepository {
  async findByOrganizationId(
    organizationId: string,
  ): Promise<SubscriptionRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id, organization_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_end, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async findOrganizationIdByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .select("organization_id")
      .eq("stripe_subscription_id", stripeSubscriptionId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data?.organization_id ?? null;
  }

  async upsertForOrganization(
    input: SubscriptionSyncInput,
  ): Promise<SubscriptionRecord> {
    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          organization_id: input.organizationId,
          stripe_subscription_id: input.stripeSubscriptionId,
          stripe_price_id: input.stripePriceId,
          plan: input.plan,
          status: input.status,
          current_period_end: input.currentPeriodEnd,
        },
        { onConflict: "organization_id" },
      )
      .select(
        "id, organization_id, stripe_subscription_id, stripe_price_id, plan, status, current_period_end, created_at, updated_at",
      )
      .single();

    if (error || !data) {
      rethrowDatabaseError(
        error ?? new Error("Failed to update subscription"),
      );
    }

    return data;
  }

  async hasStripeEvent(eventId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from("stripe_events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return Boolean(data);
  }

  async recordStripeEvent(eventId: string, type: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from("stripe_events")
      .insert({ id: eventId, type });

    if (error && error.code !== "23505") {
      rethrowDatabaseError(error);
    }
  }
}

export const billingRepository = new BillingRepository();
