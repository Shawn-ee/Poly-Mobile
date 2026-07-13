import { GET } from "@/app/api/internal/live-runtime/settlement-queue/route";

const requireAdmin = jest.fn();
const getLocalLiveRuntimeSettlementQueue = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/liveRuntimeSettlementQueue", () => ({
  getLocalLiveRuntimeSettlementQueue: () => getLocalLiveRuntimeSettlementQueue(),
}));

describe("internal live-runtime settlement-queue route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getLocalLiveRuntimeSettlementQueue.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
    requireAdmin.mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
      },
    });
  });

  afterEach(() => {
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  test("returns local settlement queue without exposing confirmation strings", async () => {
    getLocalLiveRuntimeSettlementQueue.mockResolvedValue({
      status: "ready",
      providerQuotaUsed: false,
      queue: {
        itemCount: 1,
        items: [
          {
            exactConfirmationRedacted: true,
            exactConfirmationStored: false,
            approvalEvidence: {
              status: "approved",
              canonicalApprovalEventAvailable: true,
              canonicalApprovalEventId: "11",
              exactConfirmationStored: false,
              exactConfirmationRedacted: true,
            },
            executionEvidence: {
              status: "not_executed",
              canonicalExecutionEventAvailable: false,
              canonicalExecutionEventId: null,
              exactConfirmationStored: false,
              exactConfirmationRedacted: true,
              activeMarketExecutionAttempted: false,
            },
            operatorAction: {
              exactConfirmationExposed: false,
              nextCommand: "npm run mobile:one-event-settlement-preflight",
            },
            operatorExecutionPlan: {
              version: 1,
              mode: "blocked_or_review_required",
              executableNow: false,
              providerQuotaRequired: false,
              exactConfirmationExposed: false,
              exactConfirmationStored: false,
              command: {
                exactConfirmationArgumentRedacted: true,
              },
            },
          },
        ],
      },
    });

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.queue.items[0].operatorAction).toMatchObject({
      exactConfirmationExposed: false,
      nextCommand: "npm run mobile:one-event-settlement-preflight",
    });
    expect(body.queue.items[0].operatorExecutionPlan).toMatchObject({
      version: 1,
      providerQuotaRequired: false,
      exactConfirmationExposed: false,
      exactConfirmationStored: false,
      command: {
        exactConfirmationArgumentRedacted: true,
      },
    });
    expect(body.queue.items[0].approvalEvidence).toMatchObject({
      status: "approved",
      canonicalApprovalEventAvailable: true,
      exactConfirmationStored: false,
      exactConfirmationRedacted: true,
    });
    expect(body.queue.items[0].executionEvidence).toMatchObject({
      status: "not_executed",
      canonicalExecutionEventAvailable: false,
      exactConfirmationStored: false,
      exactConfirmationRedacted: true,
      activeMarketExecutionAttempted: false,
    });
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("returns 503 when queue evidence needs attention", async () => {
    getLocalLiveRuntimeSettlementQueue.mockResolvedValue({
      status: "needs_attention",
      gaps: { p0: ["durableReviewRowsFound"] },
    });

    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("needs_attention");
  });

  test("requires admin authentication", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(getLocalLiveRuntimeSettlementQueue).not.toHaveBeenCalled();
  });

  test("can be disabled outside local runtime contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS = "1";

    const res = await GET();
    expect(res.status).toBe(404);
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(getLocalLiveRuntimeSettlementQueue).not.toHaveBeenCalled();
  });
});
