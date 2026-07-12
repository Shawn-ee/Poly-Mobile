import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/odds-api-live-runtime/one-event-stale-guard-run-summary.redacted.json";
const DEFAULT_STALE_AFTER_SECONDS = 90;

type GuardAction = "none" | "would_pause" | "pause";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};
const boolFlag = (name: string) => process.argv.includes(`--${name}`);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function latestFetchedAt(snapshots: Array<{ fetchedAt: Date }>) {
  return snapshots.reduce<Date | null>(
    (latest, snapshot) => (!latest || snapshot.fetchedAt > latest ? snapshot.fetchedAt : latest),
    null,
  );
}

async function loadMarkets(eventSlug: string, marketId?: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          ...(marketId ? { id: marketId } : {}),
          referenceSource: "sportsbook-odds",
          visibility: "PUBLIC",
          mechanism: "ORDERBOOK",
          isListed: true,
          isCanceled: false,
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          referenceQuoteSnapshots: {
            where: { source: "sportsbook-odds" },
            select: { fetchedAt: true },
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Event ${eventSlug} was not found.`);
  assert(event.startTime == null || event.startTime.getTime() > Date.now(), `Event ${eventSlug} starts in the past.`);
  assert(event.markets.length > 0, `Event ${eventSlug} has no listed sportsbook markets.`);
  return event;
}

async function guardMarket(params: {
  market: Awaited<ReturnType<typeof loadMarkets>>["markets"][number];
  staleAfterSeconds: number;
  dryRun: boolean;
}) {
  const latest = latestFetchedAt(params.market.referenceQuoteSnapshots);
  const stalenessSeconds = latest ? Math.max(0, Math.round((Date.now() - latest.getTime()) / 1000)) : null;
  const stale = stalenessSeconds == null || stalenessSeconds > params.staleAfterSeconds;
  let action: GuardAction = "none";
  if (stale && params.market.status === "LIVE") {
    action = params.dryRun ? "would_pause" : "pause";
    if (!params.dryRun) {
      await prisma.market.update({
        where: { id: params.market.id },
        data: {
          status: "PAUSED",
          settlementStatus: "paused_provider_stale",
          referenceMetadata: {
            ...(params.market.referenceMetadata &&
            typeof params.market.referenceMetadata === "object" &&
            !Array.isArray(params.market.referenceMetadata)
              ? (params.market.referenceMetadata as Record<string, unknown>)
              : {}),
            staleGuard: {
              appliedAt: new Date().toISOString(),
              reason: "one-event-supervisor-stale-provider-guard",
              stalenessSeconds,
              staleAfterSeconds: params.staleAfterSeconds,
            },
          },
        },
      });
    }
  }
  return {
    marketId: params.market.id,
    title: params.market.title,
    statusBefore: params.market.status,
    latestFetchedAt: latest?.toISOString() ?? null,
    stalenessSeconds,
    staleAfterSeconds: params.staleAfterSeconds,
    stale,
    action,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run one-event stale guard in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const staleAfterSeconds = Number(argValue("staleAfterSeconds") ?? DEFAULT_STALE_AFTER_SECONDS);
  const dryRun = boolFlag("dryRun");
  assert(Number.isFinite(staleAfterSeconds) && staleAfterSeconds > 0, "staleAfterSeconds must be a positive number.");

  const event = await loadMarkets(eventSlug, marketId);
  const marketResults = [];
  for (const market of event.markets) {
    marketResults.push(await guardMarket({ market, staleAfterSeconds, dryRun }));
  }
  const pausedCount = marketResults.filter((market) => market.action === "pause").length;
  const wouldPauseCount = marketResults.filter((market) => market.action === "would_pause").length;
  const staleCount = marketResults.filter((market) => market.stale).length;
  const checks = {
    eventFound: true,
    marketsChecked: marketResults.length > 0,
    noProductionMutation: process.env.NODE_ENV !== "production",
    dryRunDidNotMutate: dryRun ? pausedCount === 0 : true,
  };
  const summary = {
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-stale-provider-guard-run",
    pass: Object.values(checks).every(Boolean),
    mode: dryRun ? "dry-run-monitor" : "enforce-pause",
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      startTime: event.startTime?.toISOString() ?? null,
    },
    policy: {
      source: "sportsbook-odds",
      staleAfterSeconds,
      dryRun,
      actionWhenStale: dryRun ? "report-would-pause" : "pause-live-market",
      providerQuotaUsed: false,
    },
    result: {
      checkedMarketCount: marketResults.length,
      staleMarketCount: staleCount,
      pausedCount,
      wouldPauseCount,
    },
    markets: marketResults,
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: [
        "stale guard can run inside the local supervisor, but it is still local process behavior rather than an installed production service",
      ],
      p2: ["multi-event stale provider policy remains future work"],
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
