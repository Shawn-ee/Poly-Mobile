import fs from "node:fs/promises";
import path from "node:path";
import { Prisma, type PrismaClient } from "@prisma/client";
import { parseBotInitializationMetadata } from "@/server/services/referenceBotInitialization";
import { loadLocalEnvForScript } from "./local_env";

const DEFAULT_STALE_AFTER_SECONDS = 90;
const DEFAULT_MIN_MOBILE_EVENTS = 2;
const DEFAULT_MIN_MM_READY_MARKETS = 1;
const DEFAULT_REFERENCE_SOURCE = "polymarket";

let prisma: PrismaClient | null = null;

type Args = {
  summaryPath: string | null;
  staleAfterSeconds: number;
  minMobileEvents: number;
  minMmReadyMarkets: number;
  referenceSource: string;
  requireMmEligibleSnapshot: boolean;
  allowCachedProviderSnapshot: boolean;
  requireBotSeeded: boolean;
};

type MarketReadiness = {
  marketId: string;
  title: string;
  eventSlug: string | null;
  status: string;
  listed: boolean;
  mobileVisible: boolean;
  providerBacked: boolean;
  importStatus: string | null;
  tradable: boolean;
  mmEnabled: boolean;
  outcomeCount: number;
  mappedOutcomeCount: number;
  latestSnapshotAt: string | null;
  snapshotAgeSeconds: number | null;
  snapshotReady: boolean;
  snapshotQualityStatus: string | null;
  snapshotReason: string | null;
  snapshotBestBid: string | null;
  snapshotBestAsk: string | null;
  snapshotAcceptingOrders: boolean | null;
  snapshotMmEligible: boolean | null;
  snapshotBlockers: string[];
  localOpenOrderCount: number;
  botStatus: string | null;
  botSeeded: boolean;
  localMmReady: boolean;
  blockers: string[];
};

function parseArgs(argv: string[]): Args {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    summaryPath: stringArg(args.get("summaryPath")),
    staleAfterSeconds: intArg(args.get("staleAfterSeconds"), DEFAULT_STALE_AFTER_SECONDS),
    minMobileEvents: intArg(args.get("minMobileEvents"), DEFAULT_MIN_MOBILE_EVENTS),
    minMmReadyMarkets: intArg(args.get("minMmReadyMarkets"), DEFAULT_MIN_MM_READY_MARKETS),
    referenceSource: stringArg(args.get("referenceSource")) ?? DEFAULT_REFERENCE_SOURCE,
    requireMmEligibleSnapshot: boolArg(args.get("requireMmEligibleSnapshot"), (stringArg(args.get("referenceSource")) ?? DEFAULT_REFERENCE_SOURCE) === "polymarket"),
    allowCachedProviderSnapshot: boolArg(args.get("allowCachedProviderSnapshot"), (stringArg(args.get("referenceSource")) ?? DEFAULT_REFERENCE_SOURCE) !== "polymarket"),
    requireBotSeeded: boolArg(args.get("requireBotSeeded"), (stringArg(args.get("referenceSource")) ?? DEFAULT_REFERENCE_SOURCE) === "polymarket"),
  };
}

function stringArg(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function intArg(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function boolArg(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalized)) return true;
  if (["0", "false", "no", "n"].includes(normalized)) return false;
  return fallback;
}

function metadataObject(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringFromMetadata(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function booleanFromMetadata(metadata: Record<string, unknown>, key: string) {
  return metadata[key] === true;
}

function secondsSince(date: Date | null, now: Date) {
  if (!date) return null;
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
}

async function buildReport(args: Args) {
  const db = prisma;
  if (!db) {
    throw new Error("Prisma client was not initialized.");
  }
  const now = new Date();
  const [eventCount, marketCount, outcomeCount] = await Promise.all([
    db.event.count(),
    db.market.count(),
    db.outcome.count(),
  ]);

  const mobileEvents = await db.event.findMany({
    where: {
      markets: {
        some: {
          visibility: "PUBLIC",
          isListed: true,
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: 25,
    include: {
      markets: {
        where: {
          visibility: "PUBLIC",
          isListed: true,
        },
        select: {
          id: true,
          status: true,
          referenceSource: true,
        },
      },
    },
  });

  const providerMarkets = await db.market.findMany({
    where: {
      referenceSource: args.referenceSource,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      event: { select: { slug: true, title: true } },
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          referenceTokenId: true,
        },
      },
      referenceQuoteSnapshots: {
        orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
        take: 1,
        select: {
          fetchedAt: true,
          bestBid: true,
          bestAsk: true,
          acceptingOrders: true,
          qualityStatus: true,
          mmEligible: true,
          reason: true,
        },
      },
      orders: {
        where: { status: { in: ["OPEN", "PARTIAL"] } },
        select: { id: true },
      },
    },
  });

  const marketReadiness: MarketReadiness[] = providerMarkets.map((market) => {
    const metadata = metadataObject(market.referenceMetadata);
    const bot = parseBotInitializationMetadata(market.referenceMetadata);
    const latest = market.referenceQuoteSnapshots[0] ?? null;
    const snapshotAgeSeconds = secondsSince(latest?.fetchedAt ?? null, now);
    const snapshotBlockers = deriveSnapshotBlockers({
      latest,
      snapshotAgeSeconds,
      staleAfterSeconds: args.staleAfterSeconds,
      requireMmEligibleSnapshot: args.requireMmEligibleSnapshot,
      allowCachedProviderSnapshot: args.allowCachedProviderSnapshot,
    });
    const snapshotReady = snapshotBlockers.length === 0;
    const importStatus = stringFromMetadata(metadata, "importStatus");
    const tradable = booleanFromMetadata(metadata, "tradable");
    const mmEnabled = booleanFromMetadata(metadata, "mmEnabled");
    const mappedOutcomeCount = market.outcomes.filter((outcome) => outcome.referenceTokenId).length;
    const mobileVisible = market.visibility === "PUBLIC" && market.isListed;
    const botSeeded = Boolean(bot?.capital?.botUserId && bot.capital.botApiCredentialId);
    const localOrderBacked = market.orders.length > 0;
    const makerReady = args.requireBotSeeded
      ? Boolean(
          mmEnabled &&
            botSeeded &&
            (bot?.status === "live_ready" || bot?.status === "live_enabled" || bot?.status === "dry_run_ready"),
        )
      : localOrderBacked;
    const localMmReady = Boolean(
      mobileVisible &&
        market.status === "LIVE" &&
        importStatus === "approved" &&
        tradable &&
        mappedOutcomeCount === market.outcomes.length &&
        snapshotReady &&
        makerReady,
    );
    const blockers = [
      mobileVisible ? null : "not_mobile_visible",
      market.status === "LIVE" ? null : "not_live",
      importStatus === "approved" ? null : "not_approved",
      tradable ? null : "not_tradable",
      args.requireBotSeeded && !mmEnabled ? "mm_disabled" : null,
      mappedOutcomeCount === market.outcomes.length ? null : "missing_reference_token_mapping",
      snapshotReady ? null : `snapshot_not_ready:${snapshotBlockers.join(",")}`,
      makerReady ? null : args.requireBotSeeded ? "bot_not_seeded" : "no_local_open_orders",
      localMmReady ? null : "not_local_mm_ready",
    ].filter((value): value is string => Boolean(value));

    return {
      marketId: market.id,
      title: market.title,
      eventSlug: market.event?.slug ?? null,
      status: market.status,
      listed: market.isListed,
      mobileVisible,
      providerBacked: true,
      importStatus,
      tradable,
      mmEnabled,
      outcomeCount: market.outcomes.length,
      mappedOutcomeCount,
      latestSnapshotAt: latest?.fetchedAt?.toISOString() ?? null,
      snapshotAgeSeconds,
      snapshotReady,
      snapshotQualityStatus: latest?.qualityStatus ?? null,
      snapshotReason: latest?.reason ?? null,
      snapshotBestBid: latest?.bestBid?.toString() ?? null,
      snapshotBestAsk: latest?.bestAsk?.toString() ?? null,
      snapshotAcceptingOrders: latest?.acceptingOrders ?? null,
      snapshotMmEligible: latest?.mmEligible ?? null,
      snapshotBlockers,
      localOpenOrderCount: market.orders.length,
      botStatus: bot?.status ?? null,
      botSeeded,
      localMmReady,
      blockers,
    };
  });

  const providerVisibleMarkets = marketReadiness.filter((market) => market.mobileVisible);
  const snapshotReadyMarkets = marketReadiness.filter((market) => market.snapshotReady);
  const localMmReadyMarkets = marketReadiness.filter((market) => market.localMmReady);
  const mobileProviderEvents = new Set(providerVisibleMarkets.map((market) => market.eventSlug).filter(Boolean));
  const snapshotBlockerSummary = countBlockers(marketReadiness.flatMap((market) => market.snapshotBlockers));
  const providerUnavailableMarkets = providerVisibleMarkets.filter((market) =>
    market.snapshotBlockers.some((blocker) =>
      blocker === "snapshot_not_accepting_orders" ||
      blocker === "snapshot_reason_reference_missing_book" ||
      blocker === "snapshot_reason_reference_invalid_price" ||
      blocker === "snapshot_quality_missing_book" ||
      blocker === "snapshot_quality_invalid_price",
    ),
  );
  const providerBooksUnavailableOrClosed =
    providerVisibleMarkets.length > 0 &&
    snapshotReadyMarkets.length === 0 &&
    providerUnavailableMarkets.length === providerVisibleMarkets.length;
  const blockers = [
    mobileEvents.length >= args.minMobileEvents
      ? null
      : `mobile_event_count_below_${args.minMobileEvents}`,
    providerVisibleMarkets.length > 0 ? null : "no_mobile_visible_provider_markets",
    snapshotReadyMarkets.length > 0
      ? null
      : providerBooksUnavailableOrClosed
        ? "provider_books_unavailable_or_closed"
        : "no_ready_provider_snapshots",
    providerBooksUnavailableOrClosed || localMmReadyMarkets.length >= args.minMmReadyMarkets
      ? null
      : `local_mm_ready_market_count_below_${args.minMmReadyMarkets}`,
  ].filter((value): value is string => Boolean(value));

  return {
    generatedAt: now.toISOString(),
    readOnly: true,
    scope: "poly-internal-exchange-runtime-readiness",
    thresholds: {
      staleAfterSeconds: args.staleAfterSeconds,
      minMobileEvents: args.minMobileEvents,
      minMmReadyMarkets: args.minMmReadyMarkets,
    },
    database: {
      connected: true,
      eventCount,
      marketCount,
      outcomeCount,
    },
    mobileExposure: {
      mobileVisibleEventCount: mobileEvents.length,
      mobileVisibleProviderEventCount: mobileProviderEvents.size,
      sampleEvents: mobileEvents.slice(0, 10).map((event) => ({
        slug: event.slug,
        title: event.title,
        status: event.status,
        listedMarketCount: event.markets.length,
        providerMarketCount: event.markets.filter((market) => market.referenceSource === args.referenceSource).length,
      })),
    },
    providerMarkets: {
      referenceSource: args.referenceSource,
      requireMmEligibleSnapshot: args.requireMmEligibleSnapshot,
      allowCachedProviderSnapshot: args.allowCachedProviderSnapshot,
      requireBotSeeded: args.requireBotSeeded,
      totalInspected: marketReadiness.length,
      mobileVisibleCount: providerVisibleMarkets.length,
      snapshotReadyCount: snapshotReadyMarkets.length,
      localMmReadyCount: localMmReadyMarkets.length,
      openOrderBackedCount: marketReadiness.filter((market) => market.localOpenOrderCount > 0).length,
      providerUnavailableOrClosedCount: providerUnavailableMarkets.length,
      providerBooksUnavailableOrClosed,
      snapshotBlockerSummary,
      samples: marketReadiness.slice(0, 20),
    },
    readyForInternalMobileExchange:
      blockers.length === 0 &&
      mobileEvents.length >= args.minMobileEvents &&
      providerVisibleMarkets.length > 0 &&
      snapshotReadyMarkets.length > 0 &&
      localMmReadyMarkets.length >= args.minMmReadyMarkets,
    blockers,
    nextActions: deriveNextActions(blockers),
  };
}

function deriveSnapshotBlockers(params: {
  latest: {
    fetchedAt: Date;
    bestBid: Prisma.Decimal | null;
    bestAsk: Prisma.Decimal | null;
    acceptingOrders: boolean;
    qualityStatus: string | null;
    mmEligible: boolean;
    reason: string | null;
  } | null;
  snapshotAgeSeconds: number | null;
  staleAfterSeconds: number;
  requireMmEligibleSnapshot: boolean;
  allowCachedProviderSnapshot: boolean;
}) {
  const { latest, snapshotAgeSeconds, staleAfterSeconds, requireMmEligibleSnapshot, allowCachedProviderSnapshot } = params;
  if (!latest) {
    return ["snapshot_missing"];
  }

  const blockers = [
    latest.bestBid == null ? "snapshot_missing_bid" : null,
    latest.bestAsk == null ? "snapshot_missing_ask" : null,
    latest.acceptingOrders ? null : "snapshot_not_accepting_orders",
    !allowCachedProviderSnapshot && (snapshotAgeSeconds == null || snapshotAgeSeconds > staleAfterSeconds) ? "snapshot_stale" : null,
    requireMmEligibleSnapshot && !latest.mmEligible ? "snapshot_not_mm_eligible" : null,
  ].filter((value): value is string => Boolean(value));

  const reason = latest.reason?.trim();
  const allowedCachedReasons = new Set(["temporary_sportsbook_odds_single_event_provider", "cached_live_runtime_restore"]);
  if (reason && !(allowCachedProviderSnapshot && allowedCachedReasons.has(reason))) {
    blockers.push(`snapshot_reason_${reason}`);
  }

  const qualityStatus = latest.qualityStatus?.trim();
  if (qualityStatus && qualityStatus !== "high_quality" && qualityStatus !== "available" && qualityStatus !== "approved") {
    blockers.push(`snapshot_quality_${qualityStatus}`);
  }

  return [...new Set(blockers)];
}

function countBlockers(blockers: string[]) {
  return blockers.reduce<Record<string, number>>((summary, blocker) => {
    summary[blocker] = (summary[blocker] ?? 0) + 1;
    return summary;
  }, {});
}

function deriveNextActions(blockers: string[]) {
  if (blockers.length === 0) {
    return [
      "Start the backend and mobile app in server mode.",
      "Run S23 route/UI proof against the shared Poly backend.",
      "Run poly-bot dry-run against the ready allowlist before any live-local quoting.",
    ];
  }
  const actions = new Set<string>();
  for (const blocker of blockers) {
    if (blocker.startsWith("mobile_event_count")) {
      actions.add("Import, classify, and list more backend events before expecting Home/Search breadth.");
    }
    if (blocker === "no_mobile_visible_provider_markets") {
      actions.add("Import/list approved provider-backed markets into local Event/Market/Outcome rows for the selected reference source.");
    }
    if (blocker === "no_ready_provider_snapshots") {
      actions.add("Refresh reference snapshots for the mobile-visible provider allowlist.");
    }
    if (blocker === "provider_books_unavailable_or_closed") {
      actions.add("Keep Local MVP contract-fixture trading active and do not seed local MM against closed/unusable Polymarket books.");
      actions.add("Continue provider discovery only when the batch finds a new usable World Cup match candidate.");
    }
    if (blocker.startsWith("local_mm_ready_market_count")) {
      actions.add("Seed/enable local market-maker readiness for at least one allowlisted provider market.");
    }
  }
  return [...actions];
}

async function writeSummary(summaryPath: string | null, report: unknown) {
  if (!summaryPath) return;
  const absolutePath = path.resolve(process.cwd(), summaryPath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    const envLoad = loadLocalEnvForScript(["DATABASE_URL"]);
    if (envLoad.missingKeys.includes("DATABASE_URL")) {
      throw new Error(
        "DATABASE_URL is required for internal exchange readiness. Set DATABASE_URL, set DOTENV_CONFIG_PATH, or run from a workspace with a local .env.",
      );
    }
    const dbModule = await import("@/lib/db");
    prisma = dbModule.prisma;
    const report = await buildReport(args);
    await writeSummary(args.summaryPath, report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.readyForInternalMobileExchange) {
      process.exitCode = 1;
    }
  } catch (error) {
    const report = {
      generatedAt: new Date().toISOString(),
      readOnly: true,
      scope: "poly-internal-exchange-runtime-readiness",
      database: {
        connected: false,
      },
      readyForInternalMobileExchange: false,
      blockers: ["database_unavailable"],
      error: error instanceof Error ? error.message : String(error),
      nextActions: [
        "Start the Poly database/backend prerequisites, then rerun the internal exchange readiness check.",
      ],
    };
    await writeSummary(args.summaryPath, report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    process.exitCode = 1;
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
  }
}

main();
