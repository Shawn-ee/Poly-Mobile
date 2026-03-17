import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/markets/[id]/invariants/route";

const requireAdmin = jest.fn();
const getPublicBinaryInvariantState = jest.fn();

jest.mock("@/lib/admin", () => ({
  requireAdmin: () => requireAdmin(),
}));

jest.mock("@/server/services/orderbookCollateral", () => ({
  getPublicBinaryInvariantState: (...args: unknown[]) =>
    getPublicBinaryInvariantState(...args),
}));

describe("admin market invariants route", () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getPublicBinaryInvariantState.mockReset();
  });

  test("admin can fetch invariant state", async () => {
    requireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    getPublicBinaryInvariantState.mockResolvedValue({
      marketId: "m1",
      marketStatus: "LIVE",
      marketMechanism: "ORDERBOOK",
      marketVisibility: "PUBLIC",
      outcome1: { id: "o1", name: "YES" },
      outcome2: { id: "o2", name: "NO" },
      bestBidOutcome1: "0.6",
      bestBidOutcome2: "0.3",
      bestAskOutcome1: "0.7",
      bestAskOutcome2: "0.4",
      bidSum: "0.9",
      askSum: "1.1",
      bidInvariantPass: true,
      askInvariantPass: true,
      marketCollateralUSDC: "5",
      outstandingSharesOutcome1: "5",
      outstandingSharesOutcome2: "5",
      outstandingSharesEqual: true,
      collateralMatchesOutstanding: true,
      invariantStatusSummary: "PASS",
      timestamp: new Date().toISOString(),
    });

    const req = new NextRequest("http://localhost/api/admin/markets/m1/invariants");
    const res = await GET(req, { params: Promise.resolve({ id: "m1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.marketId).toBe("m1");
    expect(body.invariantStatusSummary).toBe("PASS");
  });

  test("non-admin is rejected", async () => {
    requireAdmin.mockResolvedValue({ error: "Forbidden", status: 403 });
    const req = new NextRequest("http://localhost/api/admin/markets/m1/invariants");
    const res = await GET(req, { params: Promise.resolve({ id: "m1" }) });
    expect(res.status).toBe(403);
  });
});
