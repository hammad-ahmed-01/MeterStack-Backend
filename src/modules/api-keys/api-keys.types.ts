export type ApiKeyEnvironment = "test" | "live";
export type ApiKeyStatus = "active" | "revoked";

export type ApiKeyRecord = {
  id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  environment: ApiKeyEnvironment;
  status: ApiKeyStatus;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type ApiKeyPublic = {
  id: string;
  name: string;
  environment: ApiKeyEnvironment;
  prefix: string;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export type ApiKeyCreated = ApiKeyPublic & {
  key: string;
};
