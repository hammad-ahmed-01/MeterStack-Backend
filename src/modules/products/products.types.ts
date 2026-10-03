export type ProductStatus = "active" | "archived";

export type ProductRecord = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  base_url: string | null;
  rate_limit: number | null;
  rate_limit_window_seconds: number | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
};

export type ProductResponse = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  baseUrl: string | null;
  rateLimit: number | null;
  rateLimitWindowSeconds: number | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
};

export type UpdateProductInput = {
  name?: string;
  description?: string | null;
  status?: ProductStatus;
  baseUrl?: string | null;
  rateLimit?: number | null;
  rateLimitWindowSeconds?: number | null;
};
