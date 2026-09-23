-- Upstream URL on a product, and the routes that hang off it.
-- The gateway does not read these yet. They are control-plane records.

ALTER TABLE public.api_products
  ADD COLUMN base_url text;

ALTER TABLE public.api_products
  ADD CONSTRAINT api_products_base_url_check CHECK (
    base_url IS NULL
    OR (
      char_length(base_url) BETWEEN 1 AND 2048
      AND base_url ~ '^https?://[^[:space:]]+$'
    )
  );

-- ---------------------------------------------------------------------------
-- product_routes
-- ---------------------------------------------------------------------------

CREATE TABLE public.product_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.api_products (id) ON DELETE CASCADE,
  method text NOT NULL,
  path text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_routes_method_check CHECK (
    method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
  ),
  CONSTRAINT product_routes_path_check CHECK (
    char_length(path) BETWEEN 1 AND 512
    AND path ~ '^/[^[:space:]?#]*$'
    AND path !~ '//'
  ),
  CONSTRAINT product_routes_status_check CHECK (status IN ('active', 'disabled'))
);

CREATE UNIQUE INDEX product_routes_product_method_path_key
  ON public.product_routes (product_id, method, path);

CREATE INDEX product_routes_product_id_idx
  ON public.product_routes (product_id);

CREATE TRIGGER product_routes_set_updated_at
  BEFORE UPDATE ON public.product_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Same model as the other business tables: service role bypasses RLS,
-- and the anon key shipped with the frontend cannot read or write rows.
ALTER TABLE public.product_routes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.product_routes FROM anon, authenticated;
