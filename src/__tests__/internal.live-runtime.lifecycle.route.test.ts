import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/live-runtime/lifecycle/route";

const getLocalLiveRuntimeLifecycle = jest.fn();

jest.mock("@/server/services/liveRuntimeLifecycle", () => ({
  getLocalLiveRuntimeLifecycle: (params: unknown) => getLocalLiveRuntimeLifecycle(params),
}));

describe("internal live-runtime lifecycle route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    getLocalLiveRuntimeLifecycle.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  afterAll(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  test("returns no-quota lifecycle status without exposing settlement confirmation", async () => {
    getLocalLiveRuntimeLifecycle.mockResolvedValue({
      status: "ready",
      providerQuotaUsed: false,
      lifecycle: {
        open: { proven: true },
        suspended: { proven: true },
        closed: { proven: true },
        settledResolved: {
          proven: true,
          activeTesterEventSettlementExecuted: false,
          executionRequiresMarketStatus: "CLOSED",
        },
      },
      runtimeTruth: {
        readOnlyRoute: true,
        activeTesterEventSettlementExecuted: false,
      },
      gaps: { p0: [] },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/internal/live-runtime/lifecycle?eventSlug=odds-api-single-soccer-test"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(getLocalLiveRuntimeLifecycle).toHaveBeenCalledWith({
      eventSlug: "odds-api-single-soccer-test",
    });
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.providerQuotaUsed).toBe(false);
    expect(body.lifecycle.settledResolved.activeTesterEventSettlementExecuted).toBe(false);
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("returns 503 when lifecycle evidence needs attention", async () => {
    getLocalLiveRuntimeLifecycle.mockResolvedValue({
      status: "needs_attention",
      gaps: { p0: ["closedStateProven"] },
    });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/lifecycle"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("needs_attention");
  });

  test("can be disabled outside local runtime contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS = "1";

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/lifecycle"));
    expect(res.status).toBe(404);
    expect(getLocalLiveRuntimeLifecycle).not.toHaveBeenCalled();
  });
});
