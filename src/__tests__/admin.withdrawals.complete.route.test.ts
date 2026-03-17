import { NextRequest } from "next/server";
import { POST } from "@/app/api/admin/withdrawals/[id]/complete/route";

const assertAdmin = jest.fn();
const completeWithdrawalByAdmin = jest.fn();

jest.mock("@/lib/marketGuards", () => ({
  assertAdmin: () => assertAdmin(),
  toGuardResponse: (error: unknown) => {
    if (error instanceof Error && error.message === "Forbidden") {
      return { body: { error: "Forbidden" }, status: 403 };
    }
    return { body: { error: "Internal server error" }, status: 500 };
  },
}));

jest.mock("@/server/services/withdrawals", () => ({
  completeWithdrawalByAdmin: (...args: unknown[]) => completeWithdrawalByAdmin(...args),
}));

describe("admin withdrawals complete route", () => {
  beforeEach(() => {
    assertAdmin.mockReset();
    completeWithdrawalByAdmin.mockReset();
  });

  test("non-admin is rejected", async () => {
    assertAdmin.mockRejectedValue(new Error("Forbidden"));
    const req = new NextRequest("http://localhost/api/admin/withdrawals/w1/complete", {
      method: "POST",
      body: JSON.stringify({ txHash: `0x${"a".repeat(64)}` }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(403);
  });

  test("admin can complete", async () => {
    assertAdmin.mockResolvedValue({ id: "admin-1" });
    completeWithdrawalByAdmin.mockResolvedValue({
      completed: true,
      request: {
        id: "w1",
        status: "COMPLETED",
        completedTxHash: `0x${"b".repeat(64)}`,
        completedAt: new Date().toISOString(),
      },
      balance: {
        availableUSDC: { toFixed: () => "10.000000" },
        lockedUSDC: { toFixed: () => "0.000000" },
      },
    });
    const req = new NextRequest("http://localhost/api/admin/withdrawals/w1/complete", {
      method: "POST",
      body: JSON.stringify({ txHash: `0x${"b".repeat(64)}` }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: "w1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(completeWithdrawalByAdmin).toHaveBeenCalled();
  });
});

