export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
};

export type OrganizationRole = "owner" | "member";

export type RequestOrganization = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
  stripeCustomerId: string | null;
};

export type OrganizationMembership = RequestOrganization & {
  createdAt: string;
};
