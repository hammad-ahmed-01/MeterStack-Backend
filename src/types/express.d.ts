import type { AuthUser, RequestOrganization } from "../common/types";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user: AuthUser;
      organization: RequestOrganization;
    }
  }
}

export {};
