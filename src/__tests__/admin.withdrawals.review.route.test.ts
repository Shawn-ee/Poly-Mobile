import { NextRequest } from "next/server";

const requireAdmin = jest.fn();
const assertAdmin = jest.fn();
const listAdminWithdrawals = jest.fn();
const rejectWithdrawalByAdmin = jest.fn();
const completeWithdrawalByAdmin = jest.fn();
const enforceSensitiveRateLimit = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/lib/marketGuards", () => ({
  assertAdmin: () => assertAdmin(),
  toGuardResponse: (error: unknown) => {
    if (error instanceof Error && error.message === "Forbidden") {
      return { body: { error: "Forbidden" }, status: 403 };
    }
    return { body: { error: "Internal server error" }, status: 500 };
  },
}));

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

jest.mock("@/server/services/withdrawals", () => ({
  listAdminWithdrawals: (...args: unknown[]) => listAdminWithdrawals(...args),
  rejectWithdrawalByAdmin: (...args: unknown[]) => rejectWithdrawalByAdmin(...args),
  completeWithdrawalByAdmin: (...args: unknown[]) => completeWithdrawalByAdmin(...args),
}));

describe("admin manual withdrawal review routes", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    assertAdmin.mockReset();
    listAdminWithdrawals.mockReset();
    rejectWithdrawalByAdmin.mockReset();
    completeWithdrawalByAdmin.mockReset();
    enforceSensitiveRateLimit.mockReset();
  });

  test("normal users cannot list admin withdrawal review queue", async () => {
    const { GET } = await import("@/app/api/admin/withdrawals/route");
    requireAdmin.mockResolvedValue({ error: "Forbidden", status: 403 });
    const req = new NextRequest("http://localhost/api/admin/withdrawals");

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe("Forbidden");
    expect(listAdminWithdrawals).not.toHaveBeenCalled();
  });

  test("admin can list pending and recent withdrawals without signing material", async () => {
    const { GET } = await import("@/app/api/admin/withdrawals/route");
    requireAdmin.mockResolvedValue({ id: "admin-1" });
    listAdminWithdrawals.mockResolvedValue({
      pending: [
        {
          id: "w1",
          userId: "u1",
          user: { email: "internal@example.com", username: "internal" },
          amountUSDC: { toFixed: () => "10.000000" },
          destinationAddress: "0x1111111111111111111111111111111111111111",
          status: "PENDING",
          requestedAt: new Date("2026-06-19T00:00:00.000Z"),
          treasuryPrivateKey: "secret",
        },
      ],
      recent: [
        {
          id: "w2",
          userId: "u2",
          user: { email: "done@example.com", username: "done" },
          amountUSDC: { toFixed: () => "5.000000" },
          destinationAddress: "0x2222222222222222222222222222222222222222",
          status: "COMPLETED",
          requestedAt: new Date("2026-06-18T00:00:00.000Z"),
          completedAt: new Date("2026-06-19T00:00:00.000Z"),
          rejectedAt: null,
          completedTxHash: `0x${"a".repeat(64)}`,
          adminNotes: "sent",
          broadcastTxHash: "secret",
        },
      ],
    });
    const req = new NextRequest("http://localhost/api/admin/withdrawals");

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.pending).toHaveLength(1);
    expect(body.recent).toHaveLength(1);
    expect(body.pending[0].treasuryPrivateKey).toBeUndefined();
    expect(body.recent[0].broadcastTxHash).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("secret");
  });

  test("admin can reject a withdrawal through manual review route", async () => {
    const { POST } = await import("@/app/api/admin/withdrawals/[id]/reject/route");
    assertAdmin.mockResolvedValue({ id: "admin-1" });
    rejectWithdrawalByAdmin.mockResolvedValue({
      rejected: true,
      request: {
        id: "w1",
        status: "REJECTED",
        rejectedAt: new Date("2026-06-19T00:00:00.000Z"),
      },
      balance: {
        availableUSDC: { toFixed: () => "100.000000" },
        lockedUSDC: { toFixed: () => "0.000000" },
      },
    });
    const req = new NextRequest("http://localhost/api/admin/withdrawals/w1/reject", {
      method: "POST",
      body: JSON.stringify({ reason: "manual review reject" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "w1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rejected).toBe(true);
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith("admin-1", "admin_withdraw_reject");
    expect(rejectWithdrawalByAdmin).toHaveBeenCalledWith({
      withdrawalRequestId: "w1",
      reason: "manual review reject",
      adminUserId: "admin-1",
    });
  });

  test("admin completion records provided payout tx hash without broadcast fields", async () => {
    const { POST } = await import("@/app/api/admin/withdrawals/[id]/complete/route");
    assertAdmin.mockResolvedValue({ id: "admin-1" });
    completeWithdrawalByAdmin.mockResolvedValue({
      completed: true,
      request: {
        id: "w1",
        status: "COMPLETED",
        completedTxHash: `0x${"b".repeat(64)}`,
        completedAt: new Date("2026-06-19T00:00:00.000Z"),
        broadcastTxHash: "secret",
        treasuryPrivateKey: "secret",
      },
      balance: {
        availableUSDC: { toFixed: () => "90.000000" },
        lockedUSDC: { toFixed: () => "0.000000" },
      },
    });
    const req = new NextRequest("http://localhost/api/admin/withdrawals/w1/complete", {
      method: "POST",
      body: JSON.stringify({ txHash: `0x${"b".repeat(64)}`, notes: "manual payout sent" }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "w1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.request.txHash).toBe(`0x${"b".repeat(64)}`);
    expect(body.request.broadcastTxHash).toBeUndefined();
    expect(body.request.treasuryPrivateKey).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith("admin-1", "admin_withdraw_complete");
    expect(completeWithdrawalByAdmin).toHaveBeenCalledWith({
      withdrawalRequestId: "w1",
      txHash: `0x${"b".repeat(64)}`,
      notes: "manual payout sent",
      adminUserId: "admin-1",
    });
  });
});
