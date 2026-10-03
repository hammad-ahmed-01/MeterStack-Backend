-- Request history for an organization. Rows are written when a call is recorded.
-- The dashboard only reads them.

CREATE TABLE public.request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.api_products (id) ON DELETE SET NULL,
  api_key_id uuid REFERENCES public.api_keys (id) ON DELETE SET NULL,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  key_prefix text,
  latency_ms integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_logs_method_check CHECK (
    method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS')
  ),
  CONSTRAINT request_logs_path_check CHECK (char_length(path) BETWEEN 1 AND 2048),
  CONSTRAINT request_logs_status_code_check CHECK (status_code BETWEEN 100 AND 599),
  CONSTRAINT request_logs_latency_check CHECK (latency_ms BETWEEN 0 AND 600000),
  CONSTRAINT request_logs_key_prefix_check CHECK (
    key_prefix IS NULL OR char_length(key_prefix) BETWEEN 1 AND 64
  )
);

CREATE INDEX request_logs_organization_created_at_idx
  ON public.request_logs (organization_id, created_at DESC);

CREATE INDEX request_logs_organization_product_created_at_idx
  ON public.request_logs (organization_id, product_id, created_at DESC);

ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.request_logs FROM anon, authenticated;
