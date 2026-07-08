import fs from "node:fs/promises";
import path from "node:path";
import { executeMobileLiveProviderRefreshRoute } from "@/app/api/mobile/events/[slug]/provider-refresh/route";

const DEFAULT_EVENT_SLUG = "argentina-vs-egypt";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-NL-current-match-provider-refresh/current-match-provider-refresh.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const payload = await executeMobileLiveProviderRefreshRoute(eventSlug, {
    allowContractProofFallback: false,
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    ok: payload.ok,
    providerLifecycle: {
      status: payload.providerLifecycle.status,
      ready: payload.providerLifecycle.ready,
      reason: payload.providerLifecycle.reason,
      quote: payload.providerLifecycle.quote,
      orderbookDepth: payload.providerLifecycle.orderbookDepth,
      chartHistory: payload.providerLifecycle.chartHistory,
      lineProvider: payload.providerLifecycle.lineProvider,
    },
    provider: {
      source: payload.refresh.provider.source,
      attempted: payload.refresh.provider.attempted,
      refreshedCount: payload.refresh.provider.refreshedCount,
      skippedCount: payload.refresh.provider.skippedCount,
      snapshotsUpdated: payload.refresh.provider.snapshotsUpdated,
      skipped: payload.refresh.provider.skipped,
    },
    providerHistory: {
      source: payload.refresh.providerHistory.source,
      requestedMarketCount: payload.refresh.providerHistory.requestedMarketCount,
      refreshedCount: payload.refresh.providerHistory.refreshedCount,
      snapshotsCreated: payload.refresh.providerHistory.snapshotsCreated,
      skippedCount: payload.refresh.providerHistory.skippedCount,
    },
    lineFamilyCoverage: {
      providerRefreshableMarketCount: payload.refresh.lineFamilyCoverage.providerRefreshableMarketCount,
      readyProviderRefreshableMarketCount: payload.refresh.lineFamilyCoverage.readyProviderRefreshableMarketCount,
      families: payload.refresh.lineFamilyCoverage.families,
    },
    pass:
      payload.ok === true &&
      payload.refresh.provider.refreshedCount >= 3 &&
      payload.refresh.provider.skippedCount === 0 &&
      payload.refresh.provider.snapshotsUpdated >= 6 &&
      payload.providerLifecycle.quote.status === "ready" &&
      payload.providerLifecycle.quote.ready === true,
    nonBlockingNotes: [
      "Orderbook depth remains internal and is not required for the Local MVP retail flow.",
      "Chart history can remain stale for old provider timestamps while still proving Polymarket-backed history source.",
      "Line markets remain contract fixtures until attach-ready provider-backed line markets exist.",
    ],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string> = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) parsed[match[1]] = match[2];
  }
  return parsed;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
