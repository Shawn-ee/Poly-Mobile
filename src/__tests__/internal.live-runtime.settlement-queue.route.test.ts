import { GET } from "@/app/api/internal/live-runtime/settlement-queue/route";

const getLocalLiveRuntimeSettlementQueue = jest.fn();

jest.mock("@/server/services/liveRuntimeSettlementQueue", () => ({
  getLocalLiveRuntimeSettlementQueue: () => getLocalLiveRuntimeSettlementQueue(),
}));

describe("internal live-runtime settlement-queue route", () => {
  beforeEach(() => {
    getLocalLiveRuntimeSettlementQueue.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
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
            operatorAction: {
              exactConfirmationExposed: false,
              nextCommand: "npm run mobile:one-event-settlement-preflight",
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

  test("can be disabled outside local runtime contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS = "1";

    const res = await GET();
    expect(res.status).toBe(404);
    expect(getLocalLiveRuntimeSettlementQueue).not.toHaveBeenCalled();
  });
});
