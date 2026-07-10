import { readFileSync } from "node:fs";

const appSource = () => readFileSync("mobile/App.tsx", "utf8");
const eventDetailSource = () => readFileSync("mobile/src/components/EventDetail.tsx", "utf8");

describe("Local MVP mobile order-book debug gate", () => {
  test("does not fetch order-book depth on the default retail Event Detail path", () => {
    const source = appSource();

    expect(source).toContain('const SHOW_ORDERBOOK_DEBUG = process.env.EXPO_PUBLIC_SHOW_ORDERBOOK === "1"');
    expect(source).toContain('if (!SHOW_ORDERBOOK_DEBUG || MARKET_DATA_MODE !== "server" || !selectedEvent) return undefined;');
    expect(source).toContain("requestMarketDepth={SHOW_ORDERBOOK_DEBUG ? setSelectedDepthMarketId : undefined}");
    expect(source).toContain("loadMarketQuotesById(api, marketIds)");
    expect(source).toContain("loadMarketDepthState(api, selectedEvent, selectedDepthMarketId)");
  });

  test("keeps Event Detail order-book controls behind the same debug-only flag", () => {
    const source = eventDetailSource();

    expect(source).toContain('const showOrderBookDebug = process.env.EXPO_PUBLIC_SHOW_ORDERBOOK === "1"');
    expect(source).toContain("if (!showOrderBookDebug) return;");
    expect(source).toContain("{showOrderBookDebug && orderBookVisible && renderOrderBook()}");
    expect(source).toContain("{showOrderBookDebug && group.backendMarket && (");
    expect(source).not.toContain("event-detail-inline-order-book");
  });
});
