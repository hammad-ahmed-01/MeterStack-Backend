import { ZodError } from "zod";
import { NotFoundError, ValidationError } from "../../common/errors";
import { formatZodError } from "../../common/utils/database";
import { apiKeysRepository, type ApiKeysRepository } from "../api-keys/api-keys.repository";
import { productsRepository, type ProductsRepository } from "../products/products.repository";
import {
  recordRequestSchema,
  type ListRequestLogsQuery,
  type RecordRequestInput,
} from "./request-logs.schema";
import {
  requestLogsRepository,
  type RequestLogsRepository,
} from "./request-logs.repository";
import type { RequestLogRecord, RequestLogResponse } from "./request-logs.types";

export class RequestLogsService {
  constructor(
    private readonly logs: RequestLogsRepository,
    private readonly products: ProductsRepository,
    private readonly apiKeys: ApiKeysRepository,
  ) {}

  async list(
    organizationId: string,
    query: ListRequestLogsQuery,
  ): Promise<RequestLogResponse[]> {
    const logs = await this.logs.list(organizationId, query);
    return logs.map((log) => this.toResponse(log));
  }

  /**
   * Writes one request and stamps the key's last_used_at.
   * The gateway calls this. The dashboard only lists the rows.
   */
  async record(
    organizationId: string,
    input: RecordRequestInput,
  ): Promise<RequestLogResponse> {
    const parsed = this.parseRecord(input);
    const product = await this.requireProduct(parsed.productId, organizationId);
    const keyPrefix = await this.requireKeyPrefix(
      parsed.apiKeyId,
      organizationId,
      parsed.keyPrefix ?? null,
    );
    const createdAt = new Date().toISOString();

    const log = await this.logs.create({
      organizationId,
      productId: parsed.productId ?? null,
      apiKeyId: parsed.apiKeyId ?? null,
      method: parsed.method,
      path: parsed.path,
      statusCode: parsed.statusCode,
      keyPrefix,
      latencyMs: parsed.latencyMs,
      createdAt,
    });

    if (parsed.apiKeyId) {
      await this.apiKeys.touchLastUsed(parsed.apiKeyId, organizationId, createdAt);
    }

    return this.toResponse({
      ...log,
      product_name: product?.name ?? null,
    });
  }

  private parseRecord(input: RecordRequestInput): RecordRequestInput {
    try {
      return recordRequestSchema.parse(input);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError("Invalid request log", formatZodError(error));
      }

      throw error;
    }
  }

  private async requireProduct(productId: string | null | undefined, organizationId: string) {
    if (!productId) {
      return null;
    }

    const product = await this.products.findById(productId, organizationId);

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }

  private async requireKeyPrefix(
    apiKeyId: string | null | undefined,
    organizationId: string,
    fallback: string | null,
  ): Promise<string | null> {
    if (!apiKeyId) {
      return fallback;
    }

    const apiKey = await this.apiKeys.findById(apiKeyId, organizationId);

    if (!apiKey) {
      throw new NotFoundError("API key not found");
    }

    return apiKey.key_prefix;
  }

  private toResponse(log: RequestLogRecord): RequestLogResponse {
    return {
      id: log.id,
      productId: log.product_id,
      productName: log.product_name,
      method: log.method,
      path: log.path,
      statusCode: log.status_code,
      keyPrefix: log.key_prefix,
      latencyMs: log.latency_ms,
      createdAt: log.created_at,
    };
  }
}

export const requestLogsService = new RequestLogsService(
  requestLogsRepository,
  productsRepository,
  apiKeysRepository,
);
