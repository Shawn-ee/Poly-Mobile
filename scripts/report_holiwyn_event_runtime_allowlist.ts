import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { buildHoliwynEventRuntimeAllowlist } from "@/server/services/holiwynEventRuntimeAllowlist";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/the-odds-api-event-catalog/runtime-allowlist-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to report the local runtime allowlist in production.");
  }
  loadLocalEnvForScript(["DATABASE_URL"]);

  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const requestedSlugs = (argValue("eventSlugs") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const providerEvents = await prisma.event.findMany({
    where: { source: "the-odds-api" },
    orderBy: [{ startTime: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      source: true,
      externalEventId: true,
      status: true,
      liveStatus: true,
      startTime: true,
      markets: {
        where: { referenceSource: { in: ["sportsbook-odds", "contract-fixture"] } },
        select: {
          status: true,
          isListed: true,
          referenceSource: true,
          referenceQuoteSnapshots: {
            select: { acceptingOrders: true, fetchedAt: true },
          },
          orders: {
            where: { status: "OPEN" },
            select: { id: true },
          },
        },
      },
    },
  });

  const assessment = buildHoliwynEventRuntimeAllowlist({
    requestedSlugs,
    events: providerEvents.map((event) => {
      const snapshots = event.markets.flatMap((market) => market.referenceQuoteSnapshots);
      const sportsbookMarkets = event.markets.filter((market) => market.referenceSource === "sportsbook-odds");
      const contractFixtureMarkets = event.markets.filter((market) => market.referenceSource === "contract-fixture");
      const latestSnapshotAt = snapshots.reduce<Date | null>(
        (latest, snapshot) => (!latest || snapshot.fetchedAt > latest ? snapshot.fetchedAt : latest),
        null,
      );
      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        source: event.source,
        externalEventId: event.externalEventId,
        status: event.status,
        liveStatus: event.liveStatus,
        startTime: event.startTime,
        providerMarketCount: sportsbookMarkets.length,
        contractFixtureMarketCount: contractFixtureMarkets.length,
        listedMarketCount: event.markets.filter(
          (market) => market.isListed && ["LIVE", "UPCOMING", "PAUSED"].includes(market.status),
        ).length,
        acceptingSnapshotCount: snapshots.filter((snapshot) => snapshot.acceptingOrders).length,
        openOrderCount: event.markets.reduce((count, market) => count + market.orders.length, 0),
        latestSnapshotAt,
      };
    }),
  });

  const entries = assessment.entries.map((entry) => ({
    ...entry,
    commands: entry.slug && entry.allowlisted && entry.runtimeEligible
      ? {
          cachedRuntimeCheck: `npm run mobile:one-event-live-runtime -- -EventSlug ${entry.slug}`,
          makerSeed: `npm run mobile:one-event-live-maker-seed -- --eventSlug=${entry.slug}`,
          supervisor:
            `npm run mobile:one-event-live-supervisor -- -EventSlug ${entry.slug} ` +
            `-RuntimeArtifactDir docs/mobile/harness/odds-api-live-runtime/events/${entry.slug}`,
          staleGuard: `npm run mobile:one-event-stale-guard-run -- --eventSlug=${entry.slug} --dryRun`,
          lifecycle: `npm run mobile:one-event-lifecycle-scheduler-run -- --eventSlug=${entry.slug} --dryRun`,
        }
      : null,
  }));
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "holiwyn-event-runtime-allowlist",
    pass: assessment.pass,
    policy: {
      providerSource: "the-odds-api",
      fakeTokenOnly: true,
      providerApiCalls: 0,
      providerQuotaUsed: false,
      explicitWorkerEventSelection: true,
      archivedCatalogEventsOwnNoRuntimeWorkers: true,
      liveProviderRefreshRemainsOperatorTriggered: true,
    },
    counts: {
      providerEvents: entries.length,
      currentOrUpcomingProviderEvents: entries.filter((entry) => !entry.archived).length,
      runtimeEligibleEvents: entries.filter((entry) => entry.runtimeEligible).length,
      allowlistedRuntimeOwners: entries.filter((entry) => entry.allowlisted && entry.runtimeEligible).length,
      archivedEvents: entries.filter((entry) => entry.archived).length,
    },
    requestedSlugs: assessment.requestedSlugs,
    entries,
    checks: assessment.checks,
    rc1Catalog: {
      targetProviderEventCount: 3,
      targetCurrentOrUpcomingEventCount: 3,
      providerEventCountReady: entries.length >= 3,
      currentOrUpcomingBreadthReady: entries.filter((entry) => !entry.archived).length >= 3,
      ready:
        entries.length >= 3 &&
        entries.filter((entry) => !entry.archived).length >= 3,
    },
    gaps: {
      p0: Object.entries(assessment.checks)
        .filter(([, passed]) => !passed)
        .map(([check]) => check),
      p1: entries.length < 3 ? ["The provider catalog still needs at least three provider-shaped event records."] : [],
      p2: ["A future operator UI may edit the runtime allowlist; the current contract is CLI/report based."],
    },
    rc1Gaps: {
      p0:
        entries.filter((entry) => !entry.archived).length < 3
          ? ["RC1 still needs at least three current/upcoming provider-shaped events."]
          : [],
    },
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
