const requireAdmin = jest.fn();
const requestExecutionDryRun = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/liveRuntimeSettlementExecution", () => ({
  requestLocalLiveRuntimeSettlementExecutionDryRun: (...args: unknown[]) => requestExecutionDryRun(...args),
}));

import { POST } from "@/app/api/internal/live-runtime/settlement-queue/[reviewId]/execute/route";

describe("internal live-runtime settlement execution route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    requestExecutionDryRun.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
    requireAdmin.mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
      },
    });
    requestExecutionDryRun.mockResolvedValue({
      status: "dry_run_ready",
      httpStatus: 200,
      reviewId: "review-1",
      providerQuotaUsed: false,
      mutatesSettlement: false,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
      executionRequestEvidence: {
        canonicalExecutionRequestEventId: "12",
        dryRunOnly: true,
        operatorUserId: "admin-1",
      },
    });
  });

  afterEach(() => {
    delete process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS;
  });

  test("records an authenticated dry-run execution request only", async () => {
    const res = await POST(
      new Request("http://local.test/api/internal/live-runtime/settlement-queue/review-1/execute", {
        method: "POST",
        body: JSON.stringify({ dryRun: true }),
      }),
      { params: Promise.resolve({ reviewId: "review-1" }) },
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toMatchObject({
      status: "dry_run_ready",
      providerQuotaUsed: false,
      mutatesSettlement: false,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
    });
    expect(requestExecutionDryRun).toHaveBeenCalledWith({
      reviewId: "review-1",
      operator: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
        roles: ["admin", "settlement_operator"],
      },
    });
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("rejects direct execution requests", async () => {
    const res = await POST(
      new Request("http://local.test/api/internal/live-runtime/settlement-queue/review-1/execute", {
        method: "POST",
        body: JSON.stringify({ execute: true }),
      }),
      { params: Promise.resolve({ reviewId: "review-1" }) },
    );

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body).toMatchObject({
      status: "execution_disabled",
      providerQuotaUsed: false,
      mutatesSettlement: false,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      activeMarketExecutionAttempted: false,
    });
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(requestExecutionDryRun).not.toHaveBeenCalled();
  });

  test("requires admin authentication", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await POST(
      new Request("http://local.test/api/internal/live-runtime/settlement-queue/review-1/execute", {
        method: "POST",
      }),
      { params: Promise.resolve({ reviewId: "review-1" }) },
    );

    expect(res.status).toBe(401);
    expect(requestExecutionDryRun).not.toHaveBeenCalled();
  });

  test("can be disabled outside internal operator contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_OPERATOR_CONTROLS = "1";

    const res = await POST(
      new Request("http://local.test/api/internal/live-runtime/settlement-queue/review-1/execute", {
        method: "POST",
      }),
      { params: Promise.resolve({ reviewId: "review-1" }) },
    );

    expect(res.status).toBe(404);
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(requestExecutionDryRun).not.toHaveBeenCalled();
  });
});
