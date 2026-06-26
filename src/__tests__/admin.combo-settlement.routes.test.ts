import { NextRequest } from "next/server";
import { MarketGuardError } from "@/lib/marketGuards";

const assertAdmin = jest.fn();
const enforceSensitiveRateLimit = jest.fn();
const previewComboSettlement = jest.fn();
const settleComboOrder = jest.fn();
const applySportsMarketResolution = jest.fn();

jest.mock("@/lib/marketGuards", () => {
  const actual = jest.requireActual("@/lib/marketGuards");
  return {
    ...actual,
    assertAdmin: (...args: unknown[]) => assertAdmin(...args),
  };
});

jest.mock("@/server/services/orderRateLimiter", () => ({
  enforceSensitiveRateLimit: (...args: unknown[]) => enforceSensitiveRateLimit(...args),
}));

jest.mock("@/server/services/comboSettlement", () => ({
  previewComboSettlement: (...args: unknown[]) => previewComboSettlement(...args),
  settleComboOrder: (...args: unknown[]) => settleComboOrder(...args),
}));

jest.mock("@/server/services/sportsMarketResolution", () => ({
  applySportsMarketResolution: (...args: unknown[]) => applySportsMarketResolution(...args),
}));

import { POST as PREVIEW_COMBO } from "@/app/api/admin/combo-orders/[id]/settlement-preview/route";
import { POST as SETTLE_COMBO } from "@/app/api/admin/combo-orders/[id]/settle/route";
import { POST as RESOLVE_SPORTS_MARKET } from "@/app/api/admin/markets/[id]/sports-resolution/route";

describe("admin combo settlement routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assertAdmin.mockResolvedValue({ id: "admin-1", isAdmin: true });
    previewComboSettlement.mockResolvedValue({ comboOrderId: "combo-1", outcome: "win", mutation: "none" });
    settleComboOrder.mockResolvedValue({ comboOrderId: "combo-1", applied: true, status: "SETTLED" });
    applySportsMarketResolution.mockResolvedValue({ action: "resolve", market: { id: "market-1", status: "RESOLVED" } });
  });

  test("blocks anonymous or non-admin combo settlement preview before service call", async () => {
    assertAdmin.mockRejectedValue(new MarketGuardError("Unauthorized", 401));

    const response = await PREVIEW_COMBO(
      new NextRequest("http://localhost/api/admin/combo-orders/combo-1/settlement-preview", { method: "POST" }),
      { params: Promise.resolve({ id: "combo-1" }) },
    );

    expect(response.status).toBe(401);
    expect(previewComboSettlement).not.toHaveBeenCalled();
  });

  test("admin can preview and settle a combo order", async () => {
    const previewResponse = await PREVIEW_COMBO(
      new NextRequest("http://localhost/api/admin/combo-orders/combo-1/settlement-preview", { method: "POST" }),
      { params: Promise.resolve({ id: "combo-1" }) },
    );
    const settleResponse = await SETTLE_COMBO(
      new NextRequest("http://localhost/api/admin/combo-orders/combo-1/settle", { method: "POST" }),
      { params: Promise.resolve({ id: "combo-1" }) },
    );

    expect(previewResponse.status).toBe(200);
    expect(settleResponse.status).toBe(200);
    expect(enforceSensitiveRateLimit).toHaveBeenCalledWith("admin-1", "admin_market_resolve");
    expect(previewComboSettlement).toHaveBeenCalledWith({ comboOrderId: "combo-1" });
    expect(settleComboOrder).toHaveBeenCalledWith({ comboOrderId: "combo-1", actorUserId: "admin-1" });
  });

  test("admin sports resolution route supports resolve, void, and push actions", async () => {
    const response = await RESOLVE_SPORTS_MARKET(
      new NextRequest("http://localhost/api/admin/markets/market-1/sports-resolution", {
        method: "POST",
        body: JSON.stringify({
          action: "resolve",
          winningOutcomeId: "outcome-1",
          resolutionNote: "Final score verified.",
        }),
      }),
      { params: Promise.resolve({ id: "market-1" }) },
    );

    expect(response.status).toBe(200);
    expect(applySportsMarketResolution).toHaveBeenCalledWith({
      marketId: "market-1",
      actorUserId: "admin-1",
      action: "resolve",
      winningOutcomeId: "outcome-1",
      pushOutcomeId: null,
      resolutionNote: "Final score verified.",
      resolutionSourceUrl: null,
      voidReason: null,
    });
  });

  test("rejects invalid sports resolution action before admin mutation service", async () => {
    const response = await RESOLVE_SPORTS_MARKET(
      new NextRequest("http://localhost/api/admin/markets/market-1/sports-resolution", {
        method: "POST",
        body: JSON.stringify({ action: "settle_everything" }),
      }),
      { params: Promise.resolve({ id: "market-1" }) },
    );

    expect(response.status).toBe(400);
    expect(applySportsMarketResolution).not.toHaveBeenCalled();
  });
});
