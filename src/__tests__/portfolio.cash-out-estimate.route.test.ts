import { NextRequest, NextResponse } from "next/server";

const estimateCashOut = jest.fn();
const observedRouteScopes: Record<string, string[]> = {};
const observedRouteIds: Record<string, string> = {};

jest.mock("@/server/services/cashOut", () => ({
  estimateCashOut: (...args: unknown[]) => estimateCashOut(...args),
}));

jest.mock("@/lib/canonicalRoute", () => ({
  runCanonicalRoute: async (params: {
    request: NextRequest;
    scopes: string[];
    routeId: string;
    handler: (actor: { userId: string }) => Promise<{ body: unknown }>;
  }) => {
    observedRouteScopes[params.request.method] = params.scopes;
    observedRouteIds[params.request.method] = params.routeId;
    const result = await params.handler({ userId: "user-1" });
    return NextResponse.json(result.body);
  },
}));

import { GET } from "@/app/api/portfolio/cash-out/estimate/route";

describe("GET /api/portfolio/cash-out/estimate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(observedRouteScopes)) delete observedRouteScopes[key];
    for (const key of Object.keys(observedRouteIds)) delete observedRouteIds[key];
    estimateCashOut.mockResolvedValue({
      supported: true,
      positionType: "single_leg",
      marketId: "market-1",
      outcomeId: "outcome-1",
      quantity: "12.345000",
      exitPrice: "0.57",
      estimatedExitValue: "7.036650",
    });
  });

  test("returns a server-owned close-position estimate for the authenticated portfolio actor", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/portfolio/cash-out/estimate?marketId=market-1&outcomeId=outcome-1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(observedRouteScopes.GET).toEqual(["account:read"]);
    expect(observedRouteIds.GET).toBe("portfolio:cash-out-estimate");
    expect(estimateCashOut).toHaveBeenCalledWith({
      userId: "user-1",
      marketId: "market-1",
      outcomeId: "outcome-1",
      comboOrderId: null,
    });
    expect(body).toMatchObject({
      supported: true,
      positionType: "single_leg",
      marketId: "market-1",
      outcomeId: "outcome-1",
      quantity: "12.345000",
      exitPrice: "0.57",
    });
  });
});
