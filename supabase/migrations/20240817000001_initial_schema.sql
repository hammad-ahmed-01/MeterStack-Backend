-- MeterStack v0.1 schema
-- UUID primary keys, foreign keys, timestamps, and lookup indexes.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- profiles (business profile, separate from auth.users)
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a profile when a Supabase Auth user registers.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_name_not_blank CHECK (char_length(trim(name)) > 0),
  CONSTRAINT organizations_slug_not_blank CHECK (char_length(trim(slug)) > 0)
);

CREATE UNIQUE INDEX organizations_slug_key ON public.organizations (slug);

CREATE UNIQUE INDEX organizations_stripe_customer_id_key
  ON public.organizations (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TRIGGER organizations_set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- organization_members
-- Schema supports many memberships per user. v0.1 treats the earliest
-- membership as the primary organization.
-- ---------------------------------------------------------------------------

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_role_check CHECK (role IN ('owner', 'member')),
  CONSTRAINT organization_members_unique_user UNIQUE (organization_id, user_id)
);

CREATE INDEX organization_members_user_id_idx
  ON public.organization_members (user_id);

CREATE INDEX organization_members_organization_id_idx
  ON public.organization_members (organization_id);

-- ---------------------------------------------------------------------------
-- api_products
-- ---------------------------------------------------------------------------

CREATE TABLE public.api_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT api_products_name_not_blank CHECK (char_length(trim(name)) > 0),
  CONSTRAINT api_products_status_check CHECK (status IN ('active', 'archived'))
);

CREATE INDEX api_products_organization_id_idx
  ON public.api_products (organization_id);

CREATE TRIGGER api_products_set_updated_at
  BEFORE UPDATE ON public.api_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- api_keys
-- Store prefix + hash only. Never persist the full secret.
-- ---------------------------------------------------------------------------

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  environment text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CONSTRAINT api_keys_name_not_blank CHECK (char_length(trim(name)) > 0),
  CONSTRAINT api_keys_environment_check CHECK (environment IN ('test', 'live')),
  CONSTRAINT api_keys_status_check CHECK (status IN ('active', 'revoked'))
);

CREATE UNIQUE INDEX api_keys_key_hash_key ON public.api_keys (key_hash);

CREATE INDEX api_keys_organization_id_idx
  ON public.api_keys (organization_id);

CREATE INDEX api_keys_key_prefix_idx
  ON public.api_keys (key_prefix);

-- ---------------------------------------------------------------------------
-- subscriptions
-- One local subscription row per organization. Free plan works without Stripe.
-- ---------------------------------------------------------------------------

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  stripe_subscription_id text,
  stripe_price_id text,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro')),
  CONSTRAINT subscriptions_organization_unique UNIQUE (organization_id)
);

CREATE UNIQUE INDEX subscriptions_stripe_subscription_id_key
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX subscriptions_organization_id_idx
  ON public.subscriptions (organization_id);

CREATE TRIGGER subscriptions_set_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stripe_events (webhook idempotency)
-- ---------------------------------------------------------------------------

CREATE TABLE public.stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Atomic organization + owner + free subscription
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  p_name text,
  p_slug text,
  p_user_id uuid
)
RETURNS public.organizations
LANGUAGE plpgsql
AS $$
DECLARE
  v_org public.organizations;
BEGIN
  INSERT INTO public.organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO v_org;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (v_org.id, p_user_id, 'owner');

  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (v_org.id, 'free', 'active');

  RETURN v_org;
END;
$$;
