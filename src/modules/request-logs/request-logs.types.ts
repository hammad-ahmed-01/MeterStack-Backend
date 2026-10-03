import type { RequestMethod } from "./request-logs.schema";

export type { RequestMethod };

export type RequestLogRecord = {
  id: string;
  organization_id: string;
  product_id: string | null;
  method: RequestMethod;
  path: string;
  status_code: number;
  key_prefix: string | null;
  latency_ms: number;
  created_at: string;
  product_name: string | null;
};

export type RequestLogResponse = {
  id: string;
  productId: string | null;
  productName: string | null;
  method: RequestMethod;
  path: string;
  statusCode: number;
  keyPrefix: string | null;
  latencyMs: number;
  createdAt: string;
};
