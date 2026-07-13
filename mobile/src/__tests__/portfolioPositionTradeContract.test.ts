import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readRepoFile = (path: string) => readFileSync(resolve(repoRoot, path), "utf8");
const portfolioSource = () => readRepoFile("mobile/src/components/Portfolio.tsx");

describe("Portfolio position trade actions", () => {
  test("keeps explicit Sell trade affordance for manual position adds", () => {
    const source = portfolioSource();
    const sellActionIndex = source.indexOf("position-trade-sell-");
    const sellActionBlock = source.slice(sellActionIndex, sellActionIndex + 500);

    expect(sellActionIndex).toBeGreaterThan(0);
    expect(sellActionBlock).toContain('openPositionTrade(position, "sell")');
    expect(sellActionBlock).not.toContain("openCashoutPosition(position)");
  });

  test("routes the visible Cash out action into close-position TradeTicket mode", () => {
    const source = portfolioSource();
    const app = readRepoFile("mobile/App.tsx");
    const cashOutActionIndex = source.indexOf("portfolio-position-cash-out-");
    const cashOutActionBlock = source.slice(cashOutActionIndex, cashOutActionIndex + 500);

    expect(cashOutActionIndex).toBeGreaterThan(0);
    expect(cashOutActionBlock).toContain('openPositionTrade(position, "sell")');
    expect(cashOutActionBlock).not.toContain("openCashoutPosition(position)");
    expect(app).toContain("closePosition:");
    expect(app).toContain("sellPrice: positionSellPrice");
    expect(app).toContain("availableShares: availablePositionShares(position)");
  });

  test("does not keep a hidden dedicated cashout component in the default MVP path", () => {
    const app = readRepoFile("mobile/App.tsx");

    expect(app).not.toContain("CashoutTicket");
    expect(app).not.toContain("openCashoutPosition");
  });
});
