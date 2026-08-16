export type SubscriptionPlan = "free" | "pro";

export type SubscriptionRecord = {
  id: string;
  organization_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: SubscriptionPlan;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionResponse = {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: string;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
};

export type CheckoutSessionResponse = {
  url: string;
};

export type CustomerPortalResponse = {
  url: string;
};

export type SubscriptionSyncInput = {
  organizationId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  plan: SubscriptionPlan;
  status: string;
  currentPeriodEnd: string | null;
};
