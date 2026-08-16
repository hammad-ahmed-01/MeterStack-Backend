import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "../src/common/errors";
import type { AuthUser } from "../src/common/types";
import { createAuthMiddleware } from "../src/middleware/auth.middleware";

function mockResponse() {
  return {} as Response;
}

describe("authentication middleware", () => {
  it("rejects requests without a bearer token", async () => {
    const lookupUser = vi.fn();
    const middleware = createAuthMiddleware(lookupUser);
    const req = {
      header: vi.fn().mockReturnValue(undefined),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await middleware(req, mockResponse(), next);

    expect(lookupUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const error = vi.mocked(next).mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects malformed Authorization headers", async () => {
    const lookupUser = vi.fn();
    const middleware = createAuthMiddleware(lookupUser);
    const req = {
      header: vi.fn().mockReturnValue("Token abc"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await middleware(req, mockResponse(), next);

    expect(lookupUser).not.toHaveBeenCalled();
    const error = vi.mocked(next).mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("rejects invalid or expired tokens", async () => {
    const lookupUser = vi.fn().mockResolvedValue(null);
    const middleware = createAuthMiddleware(lookupUser);
    const req = {
      header: vi.fn().mockReturnValue("Bearer expired-token"),
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await middleware(req, mockResponse(), next);

    expect(lookupUser).toHaveBeenCalledWith("expired-token");
    const error = vi.mocked(next).mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(UnauthorizedError);
  });

  it("attaches the verified user and does not trust client-supplied ids", async () => {
    const user: AuthUser = {
      id: "user-from-token",
      email: "owner@example.com",
      fullName: "Owner",
    };
    const lookupUser = vi.fn().mockResolvedValue(user);
    const middleware = createAuthMiddleware(lookupUser);
    const req = {
      header: vi.fn().mockReturnValue("Bearer valid-token"),
      body: { user_id: "forged-user", organization_id: "forged-org", role: "owner" },
    } as unknown as Request;
    const next = vi.fn() as NextFunction;

    await middleware(req, mockResponse(), next);

    expect(req.user).toEqual(user);
    expect(req.user.id).not.toBe("forged-user");
    expect(next).toHaveBeenCalledWith();
  });
});
