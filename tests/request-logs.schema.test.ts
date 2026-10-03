import { describe, expect, it } from "vitest";
import {
  listRequestLogsQuerySchema,
  recordRequestSchema,
} from "../src/modules/request-logs/request-logs.schema";

describe("list request logs query", () => {
  it("defaults the limit and accepts a product and status class", () => {
    const result = listRequestLogsQuerySchema.parse({
      productId: "8b0b6b6e-3e3e-4e3e-8e3e-3e3e3e3e3e3e",
      statusClass: "4xx",
    });

    expect(result.limit).toBe(50);
    expect(result.statusClass).toBe("4xx");
  });

  it("rejects an unknown status class and a limit above 100", () => {
    expect(listRequestLogsQuerySchema.safeParse({ statusClass: "3xx" }).success).toBe(false);
    expect(listRequestLogsQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });
});

describe("record request", () => {
  it("accepts a call with a status code and latency", () => {
    const result = recordRequestSchema.parse({
      method: "GET",
      path: "/images/1",
      statusCode: 200,
      latencyMs: 42,
    });

    expect(result.path).toBe("/images/1");
  });

  it("rejects a path without a leading slash and a status outside the HTTP range", () => {
    expect(
      recordRequestSchema.safeParse({
        method: "GET",
        path: "images",
        statusCode: 200,
        latencyMs: 1,
      }).success,
    ).toBe(false);
    expect(
      recordRequestSchema.safeParse({
        method: "GET",
        path: "/images",
        statusCode: 99,
        latencyMs: 1,
      }).success,
    ).toBe(false);
  });
});
