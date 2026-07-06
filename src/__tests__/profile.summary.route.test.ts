import { NextRequest, NextResponse } from "next/server";

const getProfileSummary = jest.fn();
const observedRouteScopes: Record<string, string[]> = {};
const observedRouteIds: Record<string, string> = {};

jest.mock("@/server/services/profileSummary", () => ({
  getProfileSummary: (...args: unknown[]) => getProfileSummary(...args),
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

import { GET } from "@/app/api/profile/summary/route";

describe("profile summary route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(observedRouteScopes)) delete observedRouteScopes[key];
    for (const key of Object.keys(observedRouteIds)) delete observedRouteIds[key];
    getProfileSummary.mockResolvedValue({
      profile: {
        id: "user-1",
        username: "holiwyn_user",
        displayName: "Holiwyn User",
        email: "user@example.test",
        image: null,
        hasCustomAvatar: false,
        isAdmin: false,
      },
      preferences: {
        locale: "en",
        ticketDefaultAmount: "100",
        ticketDefaultSide: "BUY",
        ticketDefaultSlippage: "1%",
        savedEventIds: ["match-1"],
      },
      account: {
        walletAvailableUSDC: "40.800000",
        walletLockedUSDC: "0.000000",
        walletTotalUSDC: "40.800000",
        portfolioValue: "100.060000",
        openPositionCount: 1,
        openOrderCount: 1,
        openOrderValue: "20.500000",
        totalExposure: "120.560000",
        tradingMode: "server",
      },
    });
  });

  test("GET loads profile summary for the authenticated account actor", async () => {
    const response = await GET(new NextRequest("http://localhost/api/profile/summary"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(observedRouteScopes.GET).toEqual(["account:read"]);
    expect(observedRouteIds.GET).toBe("account:summary");
    expect(getProfileSummary).toHaveBeenCalledWith({ userId: "user-1" });
    expect(body).toMatchObject({
      profile: { id: "user-1", username: "holiwyn_user" },
      preferences: { savedEventIds: ["match-1"] },
      account: {
        openPositionCount: 1,
        openOrderCount: 1,
        tradingMode: "server",
      },
    });
  });
});
