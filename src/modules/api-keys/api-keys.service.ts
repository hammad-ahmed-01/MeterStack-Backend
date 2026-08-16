import { NotFoundError } from "../../common/errors";
import { generateApiKey } from "./api-keys.crypto";
import {
  apiKeysRepository,
  type ApiKeysRepository,
} from "./api-keys.repository";
import type {
  ApiKeyCreated,
  ApiKeyEnvironment,
  ApiKeyPublic,
  ApiKeyRecord,
} from "./api-keys.types";

export class ApiKeysService {
  constructor(private readonly repository: ApiKeysRepository) {}

  async list(organizationId: string): Promise<ApiKeyPublic[]> {
    const keys = await this.repository.list(organizationId);
    return keys.map((key) => this.toPublic(key));
  }

  async create(
    organizationId: string,
    name: string,
    environment: ApiKeyEnvironment,
  ): Promise<ApiKeyCreated> {
    const generated = generateApiKey(environment);
    const record = await this.repository.create({
      organization_id: organizationId,
      name,
      key_prefix: generated.prefix,
      key_hash: generated.hash,
      environment,
      status: "active",
    });

    return {
      ...this.toPublic(record),
      key: generated.key,
    };
  }

  async revoke(id: string, organizationId: string): Promise<ApiKeyPublic> {
    const existing = await this.repository.findById(id, organizationId);

    if (!existing) {
      throw new NotFoundError("API key not found");
    }

    if (existing.status === "revoked") {
      return this.toPublic(existing);
    }

    const revoked = await this.repository.revoke(id, organizationId);

    if (!revoked) {
      throw new NotFoundError("API key not found");
    }

    return this.toPublic(revoked);
  }

  private toPublic(record: ApiKeyRecord): ApiKeyPublic {
    return {
      id: record.id,
      name: record.name,
      environment: record.environment,
      prefix: record.key_prefix,
      status: record.status,
      lastUsedAt: record.last_used_at,
      createdAt: record.created_at,
      revokedAt: record.revoked_at,
    };
  }
}

export const apiKeysService = new ApiKeysService(apiKeysRepository);
