import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type { OrganizationMembership } from "../../common/types";
import type {
  MembershipJoinRow,
  OrganizationRecord,
} from "./organizations.types";

export class OrganizationsRepository {
  async createWithOwner(
    name: string,
    slug: string,
    userId: string,
  ): Promise<OrganizationRecord> {
    const { data, error } = await supabaseAdmin.rpc(
      "create_organization_with_owner",
      {
        p_name: name,
        p_slug: slug,
        p_user_id: userId,
      },
    );

    if (error || !data) {
      rethrowDatabaseError(
        error ?? new Error("Failed to create organization"),
        "An organization with this name already exists",
      );
    }

    return data as OrganizationRecord;
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async findBySlug(slug: string): Promise<OrganizationRecord | null> {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data;
  }

  async updateName(id: string, name: string): Promise<OrganizationRecord> {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update({ name })
      .eq("id", id)
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to update organization"));
    }

    return data;
  }

  async updateStripeCustomerId(
    id: string,
    stripeCustomerId: string,
  ): Promise<OrganizationRecord> {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", id)
      .select("id, name, slug, stripe_customer_id, created_at, updated_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(
        error ?? new Error("Failed to save Stripe customer"),
      );
    }

    return data;
  }

  async findOrganizationIdByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<string | null> {
    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("stripe_customer_id", stripeCustomerId)
      .maybeSingle();

    if (error) {
      rethrowDatabaseError(error);
    }

    return data?.id ?? null;
  }

  async listMemberships(userId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await supabaseAdmin
      .from("organization_members")
      .select(
        "role, created_at, organization_id, organizations ( id, name, slug, stripe_customer_id, created_at, updated_at )",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      rethrowDatabaseError(error);
    }

    const rows = (data ?? []) as unknown as MembershipJoinRow[];

    return rows.flatMap((row) => {
      if (!row.organizations) {
        return [];
      }

      return [
        {
          id: row.organizations.id,
          name: row.organizations.name,
          slug: row.organizations.slug,
          role: row.role,
          stripeCustomerId: row.organizations.stripe_customer_id,
          createdAt: row.created_at,
        },
      ];
    });
  }
}

export const organizationsRepository = new OrganizationsRepository();
