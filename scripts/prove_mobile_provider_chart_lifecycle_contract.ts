import fs from "node:fs/promises";
import path from "node:path";
import { buildMobileLiveProviderRefreshCachePaths } from "@/server/services/mobileLiveProviderRefreshCache";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-DN-mobile-provider-chart-lifecycle-contract.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputPath = args.output ?? args.summaryPath ?? DEFAULT_OUTPUT_PATH;
  const eventSlug = args.eventSlug ?? "world-cup-live";
  const marketIds = (args.marketIds ?? "market-world-cup-live,market-total-goals")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const cachePaths = buildMobileLiveProviderRefreshCachePaths({ eventSlug, marketIds });
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    marketIds,
    cacheInvalidationContract: {
      source: "next-revalidate-path",
      liveDetailPath: cachePaths.liveDetailPath,
      eventPath: cachePaths.eventPath,
      chartPaths: cachePaths.chartPaths,
      orderbookPaths: cachePaths.orderbookPaths,
      chartMarketCount: cachePaths.chartPaths.length,
      orderbookMarketCount: cachePaths.orderbookPaths.length,
    },
    lifecycleAssertions: {
      liveDetailInvalidated: cachePaths.liveDetailPath === `/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`,
      eventInvalidated: cachePaths.eventPath === `/api/events/${encodeURIComponent(eventSlug)}`,
      chartInvalidatedForEveryMarket: cachePaths.chartPaths.length === marketIds.length,
      orderbookInvalidatedForEveryMarket: cachePaths.orderbookPaths.length === marketIds.length,
      chartAndOrderbookUseSameMarketSet:
        cachePaths.chartPaths.map((item) => item.replace(/^\/api\/markets\//, "").replace(/\/chart$/, "")).join("|") ===
        cachePaths.orderbookPaths.map((item) => item.replace(/^\/api\/orderbook\//, "").replace(/\/book$/, "")).join("|"),
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const [rawKey, inlineValue] = part.slice(2).split("=", 2);
    if (inlineValue != null) {
      args[rawKey] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[rawKey] = "true";
      continue;
    }
    args[rawKey] = next;
    index += 1;
  }
  return args;
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
