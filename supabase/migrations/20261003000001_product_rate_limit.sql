-- A stored rate limit on a product. The gateway does not enforce it yet.

ALTER TABLE public.api_products
  ADD COLUMN rate_limit integer,
  ADD COLUMN rate_limit_window_seconds integer;

ALTER TABLE public.api_products
  ADD CONSTRAINT api_products_rate_limit_check CHECK (
    (
      rate_limit IS NULL
      AND rate_limit_window_seconds IS NULL
    )
    OR (
      rate_limit BETWEEN 1 AND 1000000
      AND rate_limit_window_seconds IN (60, 3600, 86400)
    )
  );
