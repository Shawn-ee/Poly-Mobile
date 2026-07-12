import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/live-runtime/status/route";

const getLocalLiveRuntimeStatus = jest.fn();

jest.mock("@/server/services/liveRuntimeStatus", () => ({
  getLocalLiveRuntimeStatus: () => getLocalLiveRuntimeStatus(),
}));

describe("internal live-runtime status route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    getLocalLiveRuntimeStatus.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  afterAll(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  test("returns ready status without exposing provider secrets", async () => {
    getLocalLiveRuntimeStatus.mockResolvedValue({
      status: "ready",
      runtimeTruth: {
        localInternalRuntimeReady: true,
        providerQuotaUsedByStatus: false,
      },
      answers: {
        oddsRefreshLiveOrReplay: "Live refresh is explicit and key-gated.",
      },
    });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/status"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("returns 503 when audited runtime needs attention", async () => {
    getLocalLiveRuntimeStatus.mockResolvedValue({
      status: "needs_attention",
      gaps: { p0: ["watchdog_missing"] },
    });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/status"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("needs_attention");
  });

  test("can be disabled outside local runtime contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS = "1";

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/status"));
    expect(res.status).toBe(404);
    expect(getLocalLiveRuntimeStatus).not.toHaveBeenCalled();
  });
});
