import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { expireMobileLiveProviderQuoteSnapshots } from "@/server/services/mobileLiveProviderRefresh";
import { runScheduledMobileLiveProviderRefresh } from "@/server/services/mobileLiveProviderScheduler";
import { selectCompactLiveMarkets, serializeMobileLiveEventDetail } from "@/server/services/mobileLiveEventDetail";

const DEFAULT_EVENT_SLUG = "mobile-provider-refresh-proof-live";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-DR-A-mobile-scheduled-provider-refresh-run-report.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const staleSeconds = Number(args.staleSeconds ?? 180);

  const expired = await expireMobileLiveProviderQuoteSnapshots({ eventSlug, staleSeconds });
  const before = await probeLiveDetail(eventSlug);
  const scheduler = await runScheduledMobileLiveProviderRefresh({
    eventSlugs: [eventSlug],
    maxEvents: 1,
    refreshTtlSeconds: 60,
  });
  const after = await probeLiveDetail(eventSlug);

  const pass =
    expired.expiredSnapshotCount > 0 &&
    before.batchedProviderQuoteSnapshotRefreshDueCount > 0 &&
    scheduler.status === "completed" &&
    scheduler.attemptedEventCount === 1 &&
    scheduler.dueEventCount === 1 &&
    scheduler.refreshedEventCount === 1 &&
    scheduler.successfulEventCount === 1 &&
    scheduler.failedEventCount === 0 &&
    scheduler.refreshed[0]?.status === "completed" &&
    after.batchedProviderQuoteSnapshotReadyCount > 0 &&
    after.batchedProviderQuoteSnapshotRefreshDueCount === 0;

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: "scheduled-provider-refresh",
    eventSlug,
    expired,
    before,
    scheduler,
    after,
    assertions: {
      expiredSnapshots: expired.expiredSnapshotCount > 0,
      beforeRefreshDue: before.batchedProviderQuoteSnapshotRefreshDueCount > 0,
      schedulerRunCompleted: scheduler.status === "completed",
      schedulerAttemptedOneEvent: scheduler.attemptedEventCount === 1,
      schedulerFoundDueEvent: scheduler.dueEventCount === 1,
      schedulerRefreshedEvent: scheduler.refreshedEventCount === 1,
      schedulerSuccessfulEventCount: scheduler.successfulEventCount === 1,
      schedulerFailedEventCount: scheduler.failedEventCount === 0,
      schedulerRefreshItemCompleted: scheduler.refreshed[0]?.status === "completed",
      afterReady: after.batchedProviderQuoteSnapshotReadyCount > 0,
      afterNotRefreshDue: after.batchedProviderQuoteSnapshotRefreshDueCount === 0,
    },
    pass,
  };

  if (!pass) {
    throw new Error(`Scheduled provider refresh proof failed: ${JSON.stringify(summary.assertions)}`);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function probeLiveDetail(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          status: "LIVE",
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!event) throw new Error(`Event not found: ${eventSlug}. Run prepare_mobile_provider_refresh_proof_event first.`);

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const primaryMarketId = compactMarkets[0]?.id ?? null;
  const chartSnapshots = primaryMarketId
    ? await prisma.marketOutcomeSnapshot.findMany({
        where: { marketId: primaryMarketId },
        orderBy: { ts: "asc" },
        take: 240,
      })
    : [];
  const detail = await serializeMobileLiveEventDetail({ event, chartSnapshots });

  return {
    eventTitle: detail.event.title,
    compactMarketCount: detail.contract.marketCount,
    batchedProviderQuoteSnapshotMarketCount: detail.contract.batchedProviderQuoteSnapshotMarketCount,
    batchedProviderQuoteSnapshotReadyCount: detail.contract.batchedProviderQuoteSnapshotReadyCount,
    batchedProviderQuoteSnapshotStaleCount: detail.contract.batchedProviderQuoteSnapshotStaleCount,
    batchedProviderQuoteSnapshotRefreshDueCount: detail.contract.batchedProviderQuoteSnapshotRefreshDueCount,
    batchedProviderQuoteSnapshotNextRefreshAt: detail.contract.batchedProviderQuoteSnapshotNextRefreshAt,
    batchedProviderOrderbookDepthReadyCount: detail.contract.batchedProviderOrderbookDepthReadyCount,
    chartHistorySource: detail.contract.chartHistorySource,
  };
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
