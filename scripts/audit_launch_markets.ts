import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type LaunchClassification =
  | "KEEP_ACTIVE"
  | "KEEP_DRAFT"
  | "HIDE_OR_ARCHIVE"
  | "PENDING_REVIEW"
  | "NEEDS_REVIEW";

type AuditRow = {
  marketId: string;
  title: string;
  slug: string | null;
  status: string;
  visibility: string;
  isListed: boolean;
  category: string | null;
  eventId: string | null;
  eventTitle: string | null;
  outcomeCount: number;
  outcomes: Array<{
    id: string;
    name: string;
    isTradable: boolean;
    referenceTokenId: string | null;
    referenceOutcomeLabel: string | null;
  }>;
  externalMarketId: string | null;
  conditionId: string | null;
  externalSlug: string | null;
  referenceSource: string | null;
  referenceTokenIds: string[];
  localBestBid: number | null;
  localBestAsk: number | null;
  latestPolymarketMidpoint: number | null;
  latestPolymarketBestBid: number | null;
  latestPolymarketBestAsk: number | null;
  referenceFreshnessMs: number | null;
  referenceQualityStatus: string | null;
  referenceMmEligible: boolean;
  referenceReason: string | null;
  botEnabled: boolean;
  importStatus: string | null;
  launchEligibility: boolean;
  classification: LaunchClassification;
  skipReasons: string[];
  activity: {
    orderCount: number;
    openOrderCount: number;
    fillCount: number;
    tradeCount: number;
    positionCount: number;
    ledgerLikeHistory: boolean;
  };
};

const STALE_REFERENCE_MS = intFromEnv("REFERENCE_STALE_MS", 15_000);
const MAX_REFERENCE_SPREAD = numberFromEnv("MAX_REFERENCE_SPREAD", 0.1);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outputDir = path.resolve(args.outputDir ?? "../agent-orchestrator/runs/run_20260607_014713");
  await mkdir(outputDir, { recursive: true });

  const markets = await prisma.market.findMany({
    orderBy: [{ status: "asc" }, { title: "asc" }],
    include: {
      category: { select: { name: true } },
      event: { select: { title: true } },
      outcomes: {
        where: { isActive: true },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          isTradable: true,
          referenceTokenId: true,
          referenceOutcomeLabel: true,
        },
      },
      referenceQuoteSnapshots: {
        where: { source: "polymarket" },
        orderBy: { fetchedAt: "desc" },
      },
      _count: {
        select: {
          orders: true,
          fills: true,
          trades: true,
          positions: true,
        },
      },
    },
  });

  const rows: AuditRow[] = [];
  for (const market of markets) {
    const [bestBid, bestAsk, openOrderCount] = await Promise.all([
      prisma.order.findFirst({
        where: {
          marketId: market.id,
          side: "BUY",
          status: { in: ["OPEN", "PARTIAL"] },
          remaining: { gt: new Prisma.Decimal(0) },
        },
        orderBy: [{ price: "desc" }, { createdAt: "asc" }],
        select: { price: true },
      }),
      prisma.order.findFirst({
        where: {
          marketId: market.id,
          side: "SELL",
          status: { in: ["OPEN", "PARTIAL"] },
          remaining: { gt: new Prisma.Decimal(0) },
        },
        orderBy: [{ price: "asc" }, { createdAt: "asc" }],
        select: { price: true },
      }),
      prisma.order.count({
        where: {
          marketId: market.id,
          status: { in: ["OPEN", "PARTIAL"] },
          remaining: { gt: new Prisma.Decimal(0) },
        },
      }),
    ]);

    const metadata = parseMetadata(market.referenceMetadata);
    const primarySnapshot = choosePrimarySnapshot(market.referenceQuoteSnapshots);
    const referenceBestBid = decimalToNumber(primarySnapshot?.bestBid);
    const referenceBestAsk = decimalToNumber(primarySnapshot?.bestAsk);
    const referenceMidpoint =
      referenceBestBid != null && referenceBestAsk != null
        ? roundPrice((referenceBestBid + referenceBestAsk) / 2)
        : null;
    const freshnessMs = primarySnapshot
      ? Math.max(0, Date.now() - primarySnapshot.fetchedAt.getTime())
      : null;

    const skipReasons = classifySkipReasons({
      title: market.title,
      status: market.status,
      isListed: market.isListed,
      visibility: market.visibility,
      referenceSource: market.referenceSource,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      externalSlug: market.externalSlug,
      outcomes: market.outcomes,
      metadata,
      primarySnapshot,
      referenceBestBid,
      referenceBestAsk,
      freshnessMs,
    });

    const launchEligibility = skipReasons.length === 0;
    const classification = classifyMarket({
      status: market.status,
      isListed: market.isListed,
      importStatus: metadata.importStatus,
      launchEligibility,
      title: market.title,
      hasActivity:
        market._count.orders > 0 ||
        market._count.fills > 0 ||
        market._count.trades > 0 ||
        market._count.positions > 0,
      hasReferenceMapping:
        market.referenceSource === "polymarket" &&
        !!market.externalSlug &&
        market.outcomes.every((outcome) => !!outcome.referenceTokenId),
    });

    rows.push({
      marketId: market.id,
      title: market.title,
      slug: market.slug,
      status: market.status,
      visibility: market.visibility,
      isListed: market.isListed,
      category: market.category?.name ?? market.categoryLegacy ?? null,
      eventId: market.eventId,
      eventTitle: market.event?.title ?? null,
      outcomeCount: market.outcomes.length,
      outcomes: market.outcomes.map((outcome) => ({
        id: outcome.id,
        name: outcome.name,
        isTradable: outcome.isTradable,
        referenceTokenId: outcome.referenceTokenId,
        referenceOutcomeLabel: outcome.referenceOutcomeLabel,
      })),
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
      externalSlug: market.externalSlug,
      referenceSource: market.referenceSource,
      referenceTokenIds: market.outcomes
        .map((outcome) => outcome.referenceTokenId)
        .filter((value): value is string => !!value),
      localBestBid: decimalToNumber(bestBid?.price),
      localBestAsk: decimalToNumber(bestAsk?.price),
      latestPolymarketMidpoint: referenceMidpoint,
      latestPolymarketBestBid: referenceBestBid,
      latestPolymarketBestAsk: referenceBestAsk,
      referenceFreshnessMs: freshnessMs,
      referenceQualityStatus: primarySnapshot?.qualityStatus ?? null,
      referenceMmEligible: primarySnapshot?.mmEligible ?? false,
      referenceReason: primarySnapshot?.reason ?? null,
      botEnabled: metadata.mmEnabled === true,
      importStatus: metadata.importStatus,
      launchEligibility,
      classification,
      skipReasons,
      activity: {
        orderCount: market._count.orders,
        openOrderCount,
        fillCount: market._count.fills,
        tradeCount: market._count.trades,
        positionCount: market._count.positions,
        ledgerLikeHistory:
          market._count.orders > 0 ||
          market._count.fills > 0 ||
          market._count.trades > 0 ||
          market._count.positions > 0,
      },
    });
  }

  const summary = summarize(rows);
  const generatedAt = new Date().toISOString();
  const jsonPath = path.join(outputDir, "LAUNCH_MARKET_AUDIT.json");
  const mdPath = path.join(outputDir, "LAUNCH_MARKET_AUDIT.md");
  await writeFile(jsonPath, `${JSON.stringify({ generatedAt, summary, markets: rows }, null, 2)}\n`, "utf8");
  await writeFile(mdPath, renderMarkdown(generatedAt, summary, rows), "utf8");
  process.stdout.write(`${JSON.stringify({ generatedAt, summary, jsonPath, mdPath }, null, 2)}\n`);
}

function classifySkipReasons(input: {
  title: string;
  status: string;
  isListed: boolean;
  visibility: string;
  referenceSource: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
  externalSlug: string | null;
  outcomes: Array<{ name: string; isTradable: boolean; referenceTokenId: string | null }>;
  metadata: Record<string, unknown>;
  primarySnapshot: { spread: Prisma.Decimal | null; mmEligible: boolean; reason: string | null } | null;
  referenceBestBid: number | null;
  referenceBestAsk: number | null;
  freshnessMs: number | null;
}) {
  const reasons: string[] = [];
  const lowerTitle = input.title.toLowerCase();
  if (input.status !== "LIVE") reasons.push("market_not_live");
  if (!input.isListed) reasons.push("market_unlisted");
  if (input.visibility !== "PUBLIC") reasons.push("market_not_public");
  if (/\b(test|fake|placeholder|demo)\b/i.test(lowerTitle)) reasons.push("test_or_placeholder_title");
  if (input.outcomes.length < 2) reasons.push("invalid_outcome_count");
  if (input.outcomes.some((outcome) => !outcome.isTradable)) reasons.push("outcome_not_tradable");
  if (input.referenceSource !== "polymarket") reasons.push("not_polymarket_reference");
  if (!input.externalMarketId) reasons.push("missing_external_market_id");
  if (!input.conditionId) reasons.push("missing_condition_id");
  if (!input.externalSlug) reasons.push("missing_external_slug");
  if (input.outcomes.some((outcome) => !outcome.referenceTokenId)) reasons.push("missing_reference_token_id");
  if (input.metadata.importStatus !== "approved") reasons.push("reference_not_approved");
  if (input.metadata.mmEnabled !== true) reasons.push("bot_not_enabled");
  if (!input.primarySnapshot) reasons.push("missing_reference_snapshot");
  if (input.primarySnapshot && input.freshnessMs != null && input.freshnessMs > STALE_REFERENCE_MS) {
    reasons.push("reference_stale");
  }
  if (input.referenceBestBid == null || input.referenceBestAsk == null) reasons.push("reference_missing_book");
  if (
    input.referenceBestBid != null &&
    input.referenceBestAsk != null &&
    (input.referenceBestBid < 0.01 || input.referenceBestAsk > 0.99 || input.referenceBestBid > input.referenceBestAsk)
  ) {
    reasons.push("reference_invalid_price");
  }
  const spread = decimalToNumber(input.primarySnapshot?.spread);
  if (spread != null && spread > MAX_REFERENCE_SPREAD) reasons.push("reference_spread_too_wide");
  if (input.primarySnapshot && !input.primarySnapshot.mmEligible) {
    reasons.push(input.primarySnapshot.reason ?? "reference_not_mm_eligible");
  }
  return [...new Set(reasons)];
}

function classifyMarket(input: {
  status: string;
  isListed: boolean;
  importStatus: unknown;
  launchEligibility: boolean;
  title: string;
  hasActivity: boolean;
  hasReferenceMapping: boolean;
}): LaunchClassification {
  if (input.launchEligibility) return "KEEP_ACTIVE";
  if (!input.isListed || input.status === "CLOSED" || input.status === "RESOLVED") return "HIDE_OR_ARCHIVE";
  if (/\b(test|fake|placeholder|demo)\b/i.test(input.title)) return "HIDE_OR_ARCHIVE";
  if (input.importStatus === "pending_review") return "PENDING_REVIEW";
  if (input.status === "UPCOMING" && input.hasReferenceMapping) return "KEEP_DRAFT";
  return input.hasActivity ? "NEEDS_REVIEW" : "HIDE_OR_ARCHIVE";
}

function summarize(rows: AuditRow[]) {
  const byClassification = countBy(rows, (row) => row.classification);
  const reasonCounts = new Map<string, number>();
  for (const row of rows) {
    for (const reason of row.skipReasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }
  return {
    totalMarkets: rows.length,
    activeListed: rows.filter((row) => row.status === "LIVE" && row.isListed).length,
    eligibleLaunchMarkets: rows.filter((row) => row.launchEligibility).length,
    polymarketMappedMarkets: rows.filter((row) => row.referenceSource === "polymarket").length,
    botEnabledMarkets: rows.filter((row) => row.botEnabled).length,
    classifications: Object.fromEntries(byClassification),
    reasonCounts: Object.fromEntries([...reasonCounts.entries()].sort((a, b) => b[1] - a[1])),
  };
}

function renderMarkdown(generatedAt: string, summary: ReturnType<typeof summarize>, rows: AuditRow[]) {
  const launchRows = rows
    .filter((row) => row.launchEligibility || row.classification === "PENDING_REVIEW")
    .slice(0, 50);
  const lines = [
    "# Launch Market Audit",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `- Total markets scanned: ${summary.totalMarkets}`,
    `- Active listed markets: ${summary.activeListed}`,
    `- Eligible launch markets: ${summary.eligibleLaunchMarkets}`,
    `- Polymarket mapped markets: ${summary.polymarketMappedMarkets}`,
    `- Bot-enabled markets: ${summary.botEnabledMarkets}`,
    "",
    "## Classifications",
    "",
    "| Classification | Count |",
    "| --- | ---: |",
    ...Object.entries(summary.classifications).map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "## Top Skip Reasons",
    "",
    "| Reason | Count |",
    "| --- | ---: |",
    ...Object.entries(summary.reasonCounts)
      .slice(0, 25)
      .map(([key, value]) => `| ${key} | ${value} |`),
    "",
    "## Launch Candidates / Pending Review",
    "",
    "| Market ID | Title | Status | Listed | Midpoint | PM Bid | PM Ask | Freshness ms | Bot | Classification | Reasons |",
    "| --- | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |",
    ...launchRows.map(
      (row) =>
        `| ${row.marketId} | ${escapeMd(row.title)} | ${row.status} | ${row.isListed} | ${formatNumber(row.latestPolymarketMidpoint)} | ${formatNumber(row.latestPolymarketBestBid)} | ${formatNumber(row.latestPolymarketBestAsk)} | ${row.referenceFreshnessMs ?? ""} | ${row.botEnabled} | ${row.classification} | ${row.skipReasons.join(", ")} |`,
    ),
    "",
    "## Full Report",
    "",
    "See `LAUNCH_MARKET_AUDIT.json` for every market, outcome mapping, reference snapshot, local orderbook, activity counts, and skip reasons.",
    "",
  ];
  return `${lines.join("\n")}`;
}

function choosePrimarySnapshot<T extends { outcomeLabel: string | null; fetchedAt: Date }>(snapshots: T[]) {
  return (
    snapshots.find((snapshot) => snapshot.outcomeLabel?.trim().toUpperCase() === "YES") ??
    snapshots[0] ??
    null
  );
}

function parseMetadata(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}

function roundPrice(value: number) {
  return Number(value.toFixed(4));
}

function countBy<T>(rows: T[], keyFn: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatNumber(value: number | null) {
  return value == null ? "" : value.toFixed(4);
}

function escapeMd(value: string) {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key?.startsWith("--")) continue;
    const next = argv[index + 1];
    args.set(key.slice(2), next && !next.startsWith("--") ? next : "true");
  }
  return {
    outputDir: args.get("outputDir"),
  };
}

function intFromEnv(key: string, fallback: number) {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberFromEnv(key: string, fallback: number) {
  const value = process.env[key];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
