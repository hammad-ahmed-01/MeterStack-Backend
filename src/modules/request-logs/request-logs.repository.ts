import { supabaseAdmin } from "../../config/supabase";
import { rethrowDatabaseError } from "../../common/utils/database";
import type { ListRequestLogsQuery, RecordRequestInput, StatusClass } from "./request-logs.schema";
import type { RequestLogRecord, RequestMethod } from "./request-logs.types";

const logColumns =
  "id, organization_id, product_id, method, path, status_code, key_prefix, latency_ms, created_at, api_products(name)";

const statusRange: Record<StatusClass, [number, number]> = {
  "2xx": [200, 300],
  "4xx": [400, 500],
  "5xx": [500, 600],
};

type RequestLogInsert = {
  organizationId: string;
  productId: string | null;
  apiKeyId: string | null;
  method: RecordRequestInput["method"];
  path: string;
  statusCode: number;
  keyPrefix: string | null;
  latencyMs: number;
  createdAt: string;
};

export class RequestLogsRepository {
  async list(
    organizationId: string,
    query: ListRequestLogsQuery,
  ): Promise<RequestLogRecord[]> {
    let request = supabaseAdmin
      .from("request_logs")
      .select(logColumns)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(query.limit);

    if (query.productId) {
      request = request.eq("product_id", query.productId);
    }

    if (query.statusClass) {
      const [from, to] = statusRange[query.statusClass];
      request = request.gte("status_code", from).lt("status_code", to);
    }

    const { data, error } = await request;

    if (error) {
      rethrowDatabaseError(error);
    }

    return (data ?? []).map((row) => toRecord(row as Record<string, unknown>));
  }

  async create(input: RequestLogInsert): Promise<RequestLogRecord> {
    const { data, error } = await supabaseAdmin
      .from("request_logs")
      .insert({
        organization_id: input.organizationId,
        product_id: input.productId,
        api_key_id: input.apiKeyId,
        method: input.method,
        path: input.path,
        status_code: input.statusCode,
        key_prefix: input.keyPrefix,
        latency_ms: input.latencyMs,
        created_at: input.createdAt,
      })
      .select("id, organization_id, product_id, method, path, status_code, key_prefix, latency_ms, created_at")
      .single();

    if (error || !data) {
      rethrowDatabaseError(error ?? new Error("Failed to record request"));
    }

    return {
      ...(data as Omit<RequestLogRecord, "product_name">),
      product_name: null,
    };
  }
}

function toRecord(row: Record<string, unknown>): RequestLogRecord {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    product_id: typeof row.product_id === "string" ? row.product_id : null,
    method: String(row.method) as RequestMethod,
    path: String(row.path),
    status_code: Number(row.status_code),
    key_prefix: typeof row.key_prefix === "string" ? row.key_prefix : null,
    latency_ms: Number(row.latency_ms),
    created_at: String(row.created_at),
    product_name: readProductName(row.api_products),
  };
}

function readProductName(value: unknown): string | null {
  const joined = Array.isArray(value) ? value[0] : value;

  if (!joined || typeof joined !== "object" || !("name" in joined)) {
    return null;
  }

  const name = (joined as { name: unknown }).name;
  return typeof name === "string" && name.length > 0 ? name : null;
}

export const requestLogsRepository = new RequestLogsRepository();
