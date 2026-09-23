export const httpMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethod = (typeof httpMethods)[number];
export type ProductRouteStatus = "active" | "disabled";

export type ProductRouteRecord = {
  id: string;
  product_id: string;
  method: HttpMethod;
  path: string;
  description: string | null;
  status: ProductRouteStatus;
  created_at: string;
  updated_at: string;
};

export type ProductRouteResponse = {
  id: string;
  productId: string;
  method: HttpMethod;
  path: string;
  description: string | null;
  status: ProductRouteStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateProductRouteInput = {
  method: HttpMethod;
  path: string;
  description?: string;
};

export type UpdateProductRouteInput = {
  method?: HttpMethod;
  path?: string;
  description?: string | null;
  status?: ProductRouteStatus;
};
