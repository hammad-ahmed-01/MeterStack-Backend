import type { OrganizationMembership } from "../types";
import { ForbiddenError } from "../errors";

/**
 * Resolves the caller's organization membership.
 *
 * Version 0.1 assumes one primary organization per user. The primary
 * organization is the earliest membership (created_at ascending).
 *
 * Clients may send `X-Organization-Id` to select a specific membership.
 * The ID is never trusted: it must match a membership row for this user.
 * Arbitrary IDs from other organizations are rejected with 403.
 *
 * The schema already supports multiple memberships; this helper is the
 * single place that will later grow into org switching.
 */
export function selectMembership(
  memberships: OrganizationMembership[],
  requestedOrganizationId?: string,
): OrganizationMembership | null {
  if (memberships.length === 0) {
    return null;
  }

  if (!requestedOrganizationId) {
    return memberships[0] ?? null;
  }

  return (
    memberships.find(
      (membership) => membership.id === requestedOrganizationId,
    ) ?? null
  );
}

export function requireMembership(
  memberships: OrganizationMembership[],
  requestedOrganizationId?: string,
): OrganizationMembership {
  const membership = selectMembership(memberships, requestedOrganizationId);

  if (!membership) {
    if (requestedOrganizationId) {
      throw new ForbiddenError("You do not have access to this organization");
    }

    throw new ForbiddenError("You do not belong to an organization");
  }

  return membership;
}

export function requireOwnerRole(role: string): void {
  if (role !== "owner") {
    throw new ForbiddenError("Only organization owners can perform this action");
  }
}
