import { NextRequest } from "next/server";
import { GET } from "@/app/api/internal/live-runtime/result-review/route";

const requireAdmin = jest.fn();
const getLocalLiveRuntimeResultReview = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/liveRuntimeResultReview", () => ({
  getLocalLiveRuntimeResultReview: (params: unknown) => getLocalLiveRuntimeResultReview(params),
}));

describe("internal live-runtime result-review route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    requireAdmin.mockReset();
    getLocalLiveRuntimeResultReview.mockReset();
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
    requireAdmin.mockResolvedValue({
      user: {
        id: "admin-1",
        email: "admin@holiwyn.local",
        username: "admin",
      },
    });
  });

  afterAll(() => {
    Object.defineProperty(process.env, "NODE_ENV", {
      value: originalNodeEnv,
      configurable: true,
    });
    delete process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS;
  });

  test("returns redacted canonical result review without exposing confirmation strings", async () => {
    getLocalLiveRuntimeResultReview.mockResolvedValue({
      status: "ready",
      providerQuotaUsed: false,
      executionDecision: {
        exactConfirmationRequiredKnown: true,
        exactConfirmationRedacted: true,
      },
      reviewTrail: {
        settlementApprovalEvent: {
          payload: {
            confirmationKnown: true,
          },
        },
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/internal/live-runtime/result-review?eventSlug=odds-api-single-soccer-test"),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(getLocalLiveRuntimeResultReview).toHaveBeenCalledWith({
      eventSlug: "odds-api-single-soccer-test",
      marketId: null,
    });
    const body = await res.json();
    expect(body.status).toBe("ready");
    expect(body.executionDecision.exactConfirmationRedacted).toBe(true);
    expect(JSON.stringify(body)).not.toContain("SETTLE_FROM_RESULT:");
    expect(JSON.stringify(body)).not.toContain("THE_ODDS_API_KEY");
  });

  test("returns 503 when canonical review evidence needs attention", async () => {
    getLocalLiveRuntimeResultReview.mockResolvedValue({
      status: "needs_attention",
      gaps: { p0: ["settlementApprovalAuditEventFound"] },
    });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/result-review"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("needs_attention");
  });

  test("returns 200 while an unresolved active market is awaiting its final result", async () => {
    getLocalLiveRuntimeResultReview.mockResolvedValue({
      status: "awaiting_result",
      providerQuotaUsed: false,
      runtimeTruth: {
        settlementEvidenceRequired: false,
        awaitingFinalResult: true,
      },
      gaps: { p0: [] },
    });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/result-review"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("awaiting_result");
    expect(body.runtimeTruth.awaitingFinalResult).toBe(true);
  });

  test("requires admin authentication", async () => {
    requireAdmin.mockResolvedValue({ error: "Unauthorized", status: 401 });

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/result-review"));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(getLocalLiveRuntimeResultReview).not.toHaveBeenCalled();
  });

  test("can be disabled outside local runtime contexts", async () => {
    process.env.HOLIWYN_DISABLE_INTERNAL_RUNTIME_STATUS = "1";

    const res = await GET(new NextRequest("http://localhost/api/internal/live-runtime/result-review"));
    expect(res.status).toBe(404);
    expect(requireAdmin).not.toHaveBeenCalled();
    expect(getLocalLiveRuntimeResultReview).not.toHaveBeenCalled();
  });
});
