import { UnauthorizedError } from "../../common/errors";
import {
  apiKeyHashesEqual,
  hashApiKey,
  isApiKeyFormat,
} from "../api-keys/api-keys.crypto";
import {
  apiKeysRepository,
  type ApiKeysRepository,
} from "../api-keys/api-keys.repository";
import type { AuthenticatedGatewayKey } from "./gateway.types";

function readBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return null;
  }

  return parts[1];
}

export class GatewayService {
  constructor(private readonly apiKeys: ApiKeysRepository) {}

  async authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedGatewayKey> {
    const token = readBearerToken(authorizationHeader);

    if (!token || !isApiKeyFormat(token)) {
      throw new UnauthorizedError("Missing or invalid Authorization header");
    }

    const keyHash = hashApiKey(token);
    const record = await this.apiKeys.findByHash(keyHash);

    if (
      !record ||
      record.status !== "active" ||
      !apiKeyHashesEqual(record.key_hash, keyHash)
    ) {
      throw new UnauthorizedError("Invalid API key");
    }

    return {
      id: record.id,
      organizationId: record.organization_id,
      environment: record.environment,
      prefix: record.key_prefix,
    };
  }
}

export const gatewayService = new GatewayService(apiKeysRepository);
