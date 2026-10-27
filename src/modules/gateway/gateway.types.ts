import type { ApiKeyEnvironment } from "../api-keys/api-keys.types";

export type AuthenticatedGatewayKey = {
  id: string;
  organizationId: string;
  environment: ApiKeyEnvironment;
  prefix: string;
};
