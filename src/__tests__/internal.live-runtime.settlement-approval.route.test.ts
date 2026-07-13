import { POST } from "@/app/api/internal/live-runtime/settlement-queue/[reviewId]/approve/route";

const requireAdmin = jest.fn();
const approveLocalLiveRuntimeSettlementReview = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/liveRuntimeSettlementApproval", () => ({
  approveLocalLiveRuntimeSettlementReview: (...args: unknown[]) =>
    approveLocalLiveRuntimeSettlementReview(...args),
}));

const context = { params: Promise.resolve({ reviewId: "review-1" }) };

describe("internal live-runtime settlement approval route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    approveLocalLiveRuntimeSettlementReview.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
  });

  afterEach(() => {
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
  });

  test("approves through authenticated admin without exposing confirmation", async () => {
    requireAdmin.mockResolvedValue({
      user: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        isAdmin: true,
      },
    });
    approveLocalLiveRuntimeSettlementReview.mockResolvedValue({
      status: "ready",
      httpStatus: 200,
      providerQuotaUsed: false,
      exactConfirmationExposed: false,
      activeMarketExecutionAttempted: false,
      review: {
        id: "review-1",
        approvalStatus: "approved",
        executionEligibleNow: false,
      },
    });

    const res = await POST(new Request("http://localhost"), context);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({
      status: "ready",
      providerQuotaUsed: false,
      exactConfirmationExposed: false,
      activeMarketExecutionAttempted: false,
      review: {
        approvalStatus: "approved",
        executionEligibleNow: false,
      },
    });
    expect(approveLocalLiveRuntimeSettlementReview).toHaveBeenCalledWith({
      reviewId: "review-1",
      operator: {
        id: "admin-user-1",
        email: "admin@example.test",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
    });
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("requires admin authentication before mutation", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await POST(new Request("http://localhost"), context);
    expect(res.status).toBe(401);
    expect(approveLocalLiveRuntimeSettlementReview).not.toHaveBeenCalled();
  });

  test("can be disabled explicitly", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS = "1";

    const res = await POST(new Request("http://localhost"), context);
    expect(res.status).toBe(404);
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(approveLocalLiveRuntimeSettlementReview).not.toHaveBeenCalled();
  });
});
