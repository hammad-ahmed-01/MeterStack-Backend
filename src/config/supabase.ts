import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Security decision
 * -----------------
 * This backend uses the Supabase service-role key for all business-table
 * access. The service-role client bypasses Row Level Security (RLS).
 *
 * Therefore:
 *   1. Authorization is enforced in this API (auth + organization middleware).
 *   2. RLS is still enabled as defense in depth so the public anon key
 *      (used by the Next.js frontend) cannot read or write business tables
 *      directly.
 *   3. The frontend must not query core tables such as organizations,
 *      api_products, api_keys, or subscriptions.
 *
 * Never send SUPABASE_SERVICE_ROLE_KEY or STRIPE_SECRET_KEY to the frontend.
 */
export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);
