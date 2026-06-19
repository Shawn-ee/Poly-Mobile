import { NextRequest } from "next/server";

const resolveAuthenticatedUser = jest.fn();
const getUserId = jest.fn();
const ensurePolygonUsdcDepositAddress = jest.fn();
const requestWithdrawal = jest.fn();
const requireInternalFundingUser = jest.fn();
const requireInternalFundingUserById = jest.fn();
const assertFundingNotKilled = jest.fn();
const enforceSensitiveRateLimit = jest.fn();

jest.mock("@/lib/auth", () => ({
  resolveAuthenticatedUser: () => resolveAuthenticatedUser(),
  getUserId: () => getUserId(),
}));

jest.mock("@/lib/config", () => ({
  config: {
    polygonDepositMinUsd: 2,
    polygonDepositConfirmations: 20,
  },
  getDepositConfigIssues: () => ({ errors: [], warnings: [] }),
  getPolygonUsdcTokenLabel: () => "USDC",
}));

jest.mock("@/lib/fundingBeta", () => {
  class FundingAccessError extends Error {
    status: number;
    code: string;
    constructor(message: string, status: number, code: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  return {
    FundingAccessError,
    requireInternalFundingUser: (...args: unknown[]) => requireInternalFundingUser(...args),
    requireInternalFundingUserById: (...args: unknown[]) => requireInternalFundingUserById(...args),
    assertFundingNotKilled: (...args: unknown[]) => assertFundingNotKilled(...args),
    toFundingAccessResponse: (error: unknown) =>
      error instanceof FundingAccessError
        ? { body: { error: error.message, code: error.code }, status: error.status }
        : null,
  };
});

jest.mock("@/lib/wallets/userDepositAddresses", () => ({
  ensurePolygonUsdcDepositAddress: (...args: unknown[]) =>
    ensurePolygonUsdcDepositAddress(...args),
}));

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

jest.mock("@/server/services/withdrawals", () => ({
  requestWithdrawal: (...args: unknown[]) => requestWithdrawal(...args),
}));

describe("funding beta routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deposit address route blocks anonymous users", async () => {
    const { GET } = await import("@/app/api/deposits/address/route");
    resolveAuthenticatedUser.mockResolvedValue({ user: null, reason: "missing_session" });

    const res = await GET();

    expect(res.status).toBe(401);
    expect(ensurePolygonUsdcDepositAddress).not.toHaveBeenCalled();
  });

  test("deposit address route blocks non-allowlisted users before wallet generation", async () => {
    const { FundingAccessError } = await import("@/lib/fundingBeta");
    const { GET } = await import("@/app/api/deposits/address/route");
    resolveAuthenticatedUser.mockResolvedValue({
      user: { id: "u1", email: "public@example.com", username: "public", isAdmin: false },
      reason: null,
    });
    requireInternalFundingUser.mockImplementation(() => {
      throw new FundingAccessError("Funding is limited to allowlisted internal beta users.", 403, "FUNDING_NOT_ALLOWLISTED");
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("FUNDING_NOT_ALLOWLISTED");
    expect(ensurePolygonUsdcDepositAddress).not.toHaveBeenCalled();
  });

  test("deposit address route does not leak raw or encrypted private-key fields", async () => {
    const { GET } = await import("@/app/api/deposits/address/route");
    resolveAuthenticatedUser.mockResolvedValue({
      user: { id: "u1", email: "internal@example.com", username: "internal", isAdmin: false },
      reason: null,
    });
    requireInternalFundingUser.mockReturnValue({ id: "u1" });
    ensurePolygonUsdcDepositAddress.mockResolvedValue({
      id: "addr-1",
      address: "0x1111111111111111111111111111111111111111",
      encryptedPrivateKey: "encrypted-secret",
      privateKey: "raw-secret",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.address).toBe("0x1111111111111111111111111111111111111111");
    expect(body.privateKey).toBeUndefined();
    expect(body.encryptedPrivateKey).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  test("withdrawal request route kill switch blocks request creation", async () => {
    const { FundingAccessError } = await import("@/lib/fundingBeta");
    const { POST } = await import("@/app/api/withdrawals/request/route");
    getUserId.mockResolvedValue("u1");
    requireInternalFundingUserById.mockResolvedValue({ id: "u1" });
    assertFundingNotKilled.mockImplementation(() => {
      throw new FundingAccessError("Funding is temporarily disabled.", 503, "FUNDING_KILL_SWITCH_ACTIVE");
    });
    const req = new NextRequest("http://localhost/api/withdrawals/request", {
      method: "POST",
      body: JSON.stringify({ amount: "10", address: "0x1111111111111111111111111111111111111111" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.code).toBe("FUNDING_KILL_SWITCH_ACTIVE");
    expect(requestWithdrawal).not.toHaveBeenCalled();
  });

  test("withdrawal request route creates a hold request without broadcast response fields", async () => {
    const { POST } = await import("@/app/api/withdrawals/request/route");
    getUserId.mockResolvedValue("u1");
    requireInternalFundingUserById.mockResolvedValue({ id: "u1" });
    requestWithdrawal.mockResolvedValue({
      created: true,
      request: {
        id: "w1",
        amountUSDC: { toFixed: () => "10.000000" },
        destinationAddress: "0x1111111111111111111111111111111111111111",
        status: "PENDING",
        requestedAt: new Date("2026-06-19T00:00:00.000Z"),
      },
      balance: {
        availableUSDC: { toFixed: () => "90.000000" },
        lockedUSDC: { toFixed: () => "10.000000" },
      },
    });
    const req = new NextRequest("http://localhost/api/withdrawals/request", {
      method: "POST",
      body: JSON.stringify({ amount: "10", address: "0x1111111111111111111111111111111111111111" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.request.status).toBe("PENDING");
    expect(body.request.txHash).toBeUndefined();
    expect(body.request.broadcastTxHash).toBeUndefined();
    expect(requestWithdrawal).toHaveBeenCalledWith({
      userId: "u1",
      amount: "10",
      destinationAddress: "0x1111111111111111111111111111111111111111",
      withdrawalRequestId: undefined,
    });
  });
});
