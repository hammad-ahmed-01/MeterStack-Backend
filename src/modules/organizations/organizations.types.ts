export type OrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationResponse = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "member";
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MembershipJoinRow = {
  role: "owner" | "member";
  created_at: string;
  organization_id: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
    stripe_customer_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};
