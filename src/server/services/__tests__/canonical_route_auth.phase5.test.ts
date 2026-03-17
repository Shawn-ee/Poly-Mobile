import { scryptSync } from "crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const prismaMock = {
  apiCredential: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  apiCredentialUsageLog: {
    create: vi.fn(),
  },
};

const getExistingUserId = vi.fn();
const listCanonicalOrders = vi.fn();
const getCanonicalAccountBalance = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth", () => ({
  getExistingUserId,
}));

vi.mock("@/server/services/canonicalApi", () => ({
  listCanonicalOrders,
  getCanonicalAccountBalance,
}));

const makeCredential = (scopes: string[]) => {
  const secret = "topsecret";
  const salt = "testsalt";
  return {
    token: `pk_live_test.${secret}`,
    row: {
      id: "cred_1",
      userId: "user_1",
      keyId: "pk_live_test",
      secretHash: scryptSync(secret, salt, 64).toString("base64url"),
      secretSalt: salt,
      status: "ACTIVE" as const,
      revokedAt: null,
      scopes,
      isDisabled: false,
      readOnly: false,
      maxOrderSize: null,
      maxOrderNotional: null,
      maxOpenOrders: null,
      maxDailySubmittedNotional: null,
      allowedMarketIds: [],
    },
  };
};

describe("Phase 5 canonical route auth and scope enforcement", () => {
  beforeEach(async () => {
    vi.resetModules();
    prismaMock.apiCredential.findUnique.mockReset();
    prismaMock.apiCredential.update.mockReset();
    prismaMock.apiCredentialUsageLog.create.mockReset();
    getExistingUserId.mockReset();
    listCanonicalOrders.mockReset();
    getCanonicalAccountBalance.mockReset();
    process.env.CANONICAL_RATE_LIMIT_BACKEND = "memory";

    const { __clearMemoryCanonicalRateLimitStateForTest, __setCanonicalRateLimitProviderForTest } =
      await import("@/server/services/canonicalRateLimit");
    __clearMemoryCanonicalRateLimitStateForTest();
    __setCanonicalRateLimitProviderForTest(null);
  });

  test("orders route rejects API keys without orders:read scope", async () => {
    const credential = makeCredential(["account:read"]);
    prismaMock.apiCredential.findUnique.mockResolvedValue(credential.row);
    prismaMock.apiCredential.update.mockResolvedValue(undefined);
    getExistingUserId.mockResolvedValue(null);

    const { GET } = await import("@/app/api/orders/route");
    const request = new NextRequest("http://localhost/api/orders", {
      headers: {
        Authorization: `Bearer ${credential.token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "INSUFFICIENT_SCOPE",
        message: "API key does not include required scope: orders:read.",
      },
    });
    expect(listCanonicalOrders).not.toHaveBeenCalled();
  });

  test("account route rejects API keys without account:read scope", async () => {
    const credential = makeCredential(["orders:read"]);
    prismaMock.apiCredential.findUnique.mockResolvedValue(credential.row);
    prismaMock.apiCredential.update.mockResolvedValue(undefined);
    getExistingUserId.mockResolvedValue(null);

    const { GET } = await import("@/app/api/account/balance/route");
    const request = new NextRequest("http://localhost/api/account/balance", {
      headers: {
        Authorization: `Bearer ${credential.token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: {
        code: "INSUFFICIENT_SCOPE",
        message: "API key does not include required scope: account:read.",
      },
    });
    expect(getCanonicalAccountBalance).not.toHaveBeenCalled();
  });
});
