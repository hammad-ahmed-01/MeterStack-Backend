import { describe, expect, it } from "vitest";
import { ForbiddenError } from "../src/common/errors";
import type { OrganizationMembership } from "../src/common/types";
import {
  requireMembership,
  requireOwnerRole,
  selectMembership,
} from "../src/common/utils/organization-auth";

const orgA: OrganizationMembership = {
  id: "org-a",
  name: "Acme",
  slug: "acme",
  role: "owner",
  stripeCustomerId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const orgB: OrganizationMembership = {
  id: "org-b",
  name: "Other",
  slug: "other",
  role: "member",
  stripeCustomerId: null,
  createdAt: "2026-02-01T00:00:00.000Z",
};

describe("organization authorization", () => {
  it("uses the earliest membership as the primary organization", () => {
    expect(selectMembership([orgA, orgB])).toEqual(orgA);
  });

  it("selects a requested organization only when the user is a member", () => {
    expect(selectMembership([orgA, orgB], "org-b")).toEqual(orgB);
  });

  it("does not accept an arbitrary organization id", () => {
    expect(selectMembership([orgA], "org-b")).toBeNull();
    expect(() => requireMembership([orgA], "org-b")).toThrow(ForbiddenError);
    expect(() => requireMembership([orgA], "org-b")).toThrow(
      "You do not have access to this organization",
    );
  });

  it("rejects users with no membership", () => {
    expect(selectMembership([])).toBeNull();
    expect(() => requireMembership([])).toThrow(ForbiddenError);
  });

  it("restricts owner-only actions", () => {
    expect(() => requireOwnerRole("member")).toThrow(ForbiddenError);
    expect(() => requireOwnerRole("owner")).not.toThrow();
  });
});
