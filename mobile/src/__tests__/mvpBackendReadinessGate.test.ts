import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");
const portfolioSource = () => readFileSync("mobile/src/components/Portfolio.tsx", "utf8");

describe("MVP backend readiness gate", () => {
  test("server-mode Home does not render bundled events after route fallback", () => {
    const source = appSource();

    expect(source).toContain('if (page.source === "local-fallback")');
    expect(source).not.toContain("const filteredFallbackEvents = worldCupEvents.filter((event) => matchesHomeFilter(event, homeFilter))");
    expect(source).not.toContain("setEvents(worldCupEvents)");
    expect(source).toContain("if (!append) setEvents([])");
  });

  test("Portfolio value chart keeps server route failure visible instead of deterministic fallback", () => {
    const source = portfolioSource();

    expect(source).toContain("routeErrorValueHistory");
    expect(source).toContain('source: "portfolio-value-history-route"');
    expect(source).toContain('status: "error"');
    expect(source).toContain("loadValueHistory");
    expect(source).not.toContain("serverValueHistory?.range === activeRange && serverValueHistory.status !== \"error\"");
  });

  test("server-mode cancel waits for backend success before local removal", () => {
    const source = appSource();
    const cancelBlock = source.slice(source.indexOf("const cancelOpenOrder ="), source.indexOf("return (", source.indexOf("const cancelOpenOrder =")));

    expect(cancelBlock).toContain('if (ORDER_MODE !== "server")');
    expect(cancelBlock).toContain("cancelOpenOrderOnServer({ mode: ORDER_MODE, api, order })");
    expect(cancelBlock.indexOf('if (ORDER_MODE !== "server")')).toBeLessThan(cancelBlock.indexOf("cancelOpenOrderOnServer"));
    expect(cancelBlock.lastIndexOf("setOpenOrders((current) => current.filter((item) => item.id !== order.id))")).toBeGreaterThan(cancelBlock.indexOf("cancelOpenOrderOnServer"));
  });
});
