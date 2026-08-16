-- MeterStack v0.1 Row Level Security
--
-- Security model
-- --------------
-- The Express backend uses the Supabase service-role key, which bypasses RLS.
-- All authorization for API requests is therefore enforced in the backend
-- (JWT verification + organization membership checks).
--
-- RLS is still enabled on every business table so that the public anon key
-- (shipped with the Next.js frontend) cannot read or write these tables
-- directly. That is defense in depth, not the primary authorization layer.
--
-- Policy summary:
--   profiles          — authenticated users may select/update their own row
--   all other tables  — no policies for anon/authenticated (deny by default)
--   service_role      — bypasses RLS and is used only by this backend

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Explicitly revoke table rights from anon. Authenticated retains GRANT
-- defaults from Supabase, but RLS denies rows without a matching policy.
REVOKE ALL ON public.organizations FROM anon, authenticated;
REVOKE ALL ON public.organization_members FROM anon, authenticated;
REVOKE ALL ON public.api_products FROM anon, authenticated;
REVOKE ALL ON public.api_keys FROM anon, authenticated;
REVOKE ALL ON public.subscriptions FROM anon, authenticated;
REVOKE ALL ON public.stripe_events FROM anon, authenticated;

GRANT SELECT, UPDATE ON public.profiles TO authenticated;

REVOKE ALL ON FUNCTION public.create_organization_with_owner(text, text, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_organization_with_owner(text, text, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner(text, text, uuid) TO service_role;
