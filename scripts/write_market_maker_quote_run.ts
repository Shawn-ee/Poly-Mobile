import fs from "node:fs/promises";
import { prisma } from "@/lib/db";
import { writeMarketMakerQuoteRun } from "@/server/services/marketMakerQuoteRun";

type JsonObject = Record<string, unknown>;

const DEFAULT_SUMMARY_PATH = "docs/mobile/harness/odds-api-live-runtime/shifted-maker-seed-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const getPath = (source: unknown, keys: string[]) => {
  let cursor = source;
  for (const key of keys) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) return null;
    cursor = (cursor as JsonObject)[key];
  }
  return cursor;
};

const stringValue = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);
const numberValue = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write local market-maker quote run in production.");
  }

  const summaryPath = argValue("summaryPath") ?? argValue("input") ?? DEFAULT_SUMMARY_PATH;
  const summary = JSON.parse(await fs.readFile(summaryPath, "utf8")) as JsonObject;
  const selectedMarket = getPath(summary, ["selectedMarket"]);
  const providerSnapshot = getPath(summary, ["providerSnapshot"]);
  const plan = getPath(summary, ["plan"]);
  const maker = getPath(summary, ["maker"]);
  const checks = getPath(summary, ["checks"]);
  const restingOrders = getPath(summary, ["restingOrders"]);
  const canceledOrders = getPath(summary, ["canceledPreviousOrders"]);

  const marketId = stringValue(getPath(selectedMarket, ["id"]));
  const outcomeId = stringValue(getPath(selectedMarket, ["outcomeId"]));
  if (!marketId || !outcomeId) throw new Error("Missing selected market/outcome in maker summary.");

  const run = await writeMarketMakerQuoteRun({
    marketId,
    outcomeId,
    eventSlug: stringValue(getPath(summary, ["event", "slug"])),
    status: summary.pass === true ? "passed" : "failed",
    mode: stringValue(getPath(summary, ["mode"])) ?? "seed-resting-shifted-maker-quotes",
    startedAt: stringValue(getPath(summary, ["startedAt"])) ?? stringValue(getPath(summary, ["generatedAt"])) ?? new Date().toISOString(),
    finishedAt: stringValue(getPath(summary, ["generatedAt"])) ?? new Date().toISOString(),
    makerUserId: stringValue(getPath(maker, ["id"])),
    bidOrderId: Array.isArray(restingOrders)
      ? stringValue(getPath(restingOrders.find((order) => getPath(order, ["side"]) === "BUY"), ["id"]))
      : null,
    askOrderId: Array.isArray(restingOrders)
      ? stringValue(getPath(restingOrders.find((order) => getPath(order, ["side"]) === "SELL"), ["id"]))
      : null,
    providerSource: stringValue(getPath(providerSnapshot, ["source"])) ?? "sportsbook-odds",
    referenceBid: numberValue(getPath(providerSnapshot, ["referenceBid"])),
    referenceAsk: numberValue(getPath(providerSnapshot, ["referenceAsk"])),
    outcomePrice: numberValue(getPath(providerSnapshot, ["outcomePrice"])),
    plannedBid: numberValue(getPath(plan, ["plannedBid"])),
    plannedAsk: numberValue(getPath(plan, ["plannedAsk"])),
    quoteOffsetTicks: numberValue(getPath(plan, ["quoteOffsetTicks"])) ?? 0,
    size: stringValue(getPath(plan, ["size"])),
    mintQuantity: stringValue(getPath(plan, ["mintQuantity"])),
    canceledOrderCount: Array.isArray(canceledOrders) ? canceledOrders.length : 0,
    restingOrderCount: Array.isArray(restingOrders) ? restingOrders.length : 0,
    quoteRouteStatus: numberValue(getPath(summary, ["quoteRoute", "status"])),
    shiftedBidWorseThanProvider: getPath(checks, ["shiftedBidWorseThanProvider"]) === true,
    shiftedAskWorseThanProvider: getPath(checks, ["shiftedAskWorseThanProvider"]) === true,
    quoteRouteShowsBid: getPath(checks, ["quoteRouteShowsBid"]) === true,
    quoteRouteShowsAsk: getPath(checks, ["quoteRouteShowsAsk"]) === true,
    snapshotFresh: getPath(checks, ["snapshotFresh"]) === true,
    installedOsService: false,
    metadata: {
      source: "local-shifted-maker-proof",
      emittedBy: "scripts/write_market_maker_quote_run.ts",
      localOnly: true,
      summaryPath,
      selectedMarket,
      checks,
      gaps: getPath(summary, ["gaps"]),
    },
  });

  process.stdout.write(`${JSON.stringify({ pass: true, run }, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
