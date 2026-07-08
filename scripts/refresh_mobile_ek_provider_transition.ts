import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { executeMobileLiveProviderRefreshRoute } from "@/app/api/mobile/events/[slug]/provider-refresh/route";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const eventSlug = argValue("eventSlug");
const summaryPath = argValue("summaryPath");

if (!eventSlug) {
  throw new Error("Missing --eventSlug");
}

type ProofMarket = NonNullable<Awaited<ReturnType<typeof loadMarkets>>[number]>;

async function loadMarkets() {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        orderBy: { displayOrder: "asc" },
        include: { outcomes: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });
  if (!event) throw new Error(`No event found for slug ${eventSlug}`);
  return event.markets;
}

function jsonResponse(payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function installProviderFetchStub(markets: ProofMarket[]) {
  const originalFetch = globalThis.fetch;
  const bySlug = new Map(markets.flatMap((market) => market.externalSlug ? [[market.externalSlug, market]] : []));

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.hostname === "gamma-api.polymarket.com" && url.pathname === "/markets") {
      const slug = url.searchParams.get("slug");
      const market = slug ? bySlug.get(slug) : null;
      if (!market) return jsonResponse([]);
      return jsonResponse([{
        slug,
        bestBid: market.marketGroupKey === "spread" ? 0.5 : 0.56,
        bestAsk: market.marketGroupKey === "spread" ? 0.54 : 0.6,
        spread: 0.04,
        lastTradePrice: market.marketGroupKey === "spread" ? 0.52 : 0.58,
        volume: 2400,
        volume24hr: 410,
        liquidity: 1500,
        liquidityClob: 1900,
        acceptingOrders: true,
        outcomes: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceOutcomeLabel ?? outcome.name)),
        clobTokenIds: JSON.stringify(market.outcomes.map((outcome) => outcome.referenceTokenId)),
        outcomePrices: JSON.stringify(market.outcomes.map((_, index) => index === 0 ? 0.52 : 0.48)),
      }]);
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/book") {
      const tokenId = url.searchParams.get("token_id") ?? "unknown";
      const away = tokenId.includes("away");
      return jsonResponse({
        asset_id: tokenId,
        timestamp: String(Math.floor(Date.now() / 1000)),
        bids: [
          { price: away ? "0.46" : "0.50", size: "180" },
          { price: away ? "0.45" : "0.49", size: "160" },
        ],
        asks: [
          { price: away ? "0.50" : "0.54", size: "170" },
          { price: away ? "0.51" : "0.55", size: "150" },
        ],
      });
    }

    if (url.hostname === "clob.polymarket.com" && url.pathname === "/prices-history") {
      const tokenId = url.searchParams.get("market") ?? "unknown";
      const nowSeconds = Math.floor(Date.now() / 1000);
      return jsonResponse({
        history: [
          { t: nowSeconds - 120, p: tokenId.includes("away") ? 0.47 : 0.53 },
          { t: nowSeconds - 60, p: tokenId.includes("away") ? 0.48 : 0.52 },
          { t: nowSeconds, p: tokenId.includes("away") ? 0.49 : 0.51 },
        ],
      });
    }

    if (url.hostname.includes("api.opticodds.com")) {
      return jsonResponse({ data: [] });
    }

    return originalFetch(input, init);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function main() {
  const markets = await loadMarkets();
  const restoreFetch = installProviderFetchStub(markets);
  try {
    const payload = await executeMobileLiveProviderRefreshRoute(eventSlug, {
      allowContractProofFallback: false,
    });
    const summary = {
      eventSlug,
      result: payload.providerLifecycle.ready ? "pass" : "partial",
      providerLifecycle: payload.providerLifecycle,
      providerSnapshotsUpdated: payload.refresh.provider.snapshotsUpdated,
      depthRowsUpdated: payload.refresh.providerDepth.depthRowsUpdated,
      historySnapshotsCreated: payload.refresh.providerHistory.snapshotsCreated,
      fallbackApplied: payload.providerLifecycle.fallbackApplied,
    };
    if (summaryPath) {
      const resolved = path.resolve(summaryPath);
      await fs.mkdir(path.dirname(resolved), { recursive: true });
      await fs.writeFile(resolved, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
    }
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (!payload.providerLifecycle.ready || payload.providerLifecycle.fallbackApplied) {
      process.exitCode = 1;
    }
  } finally {
    restoreFetch();
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  await prisma.$disconnect();
  process.exitCode = 1;
});
