import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildImportedReferenceMetadata,
  upsertPolymarketReferenceMarket,
} from "@/server/services/polymarketReferenceImport";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const MAX_SPREAD = 0.03;

type ImportResult = {
  slug: string;
  title: string;
  localMarketId: string | null;
  conditionId: string | null;
  externalMarketId: string | null;
  outcomes: Array<{ name: string; tokenId: string | null }>;
  midpoint: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  imported: boolean;
  approvedLive: boolean;
  skippedReason: string | null;
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = (args.slugs ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    throw new Error("Provide --slugs slug-a,slug-b");
  }
  if (slugs.length > 10) {
    throw new Error("Launch pool import is capped at 10 slugs.");
  }

  const apply = args.mode === "apply" || args.apply === "true";
  if (apply && args.confirm !== "LAUNCH_POOL_IMPORT") {
    throw new Error("Live import requires --confirm LAUNCH_POOL_IMPORT.");
  }

  const outputDir = path.resolve(args.outputDir ?? "../agent-orchestrator/runs/run_20260607_014713");
  await mkdir(outputDir, { recursive: true });

  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No admin user found for launch import actor.");
  }

  const imported: ImportResult[] = [];
  for (const slug of slugs) {
    const candidate = await fetchMarketBySlug(slug);
    const skipReason = validateCandidate(candidate);
    if (skipReason) {
      imported.push({
        slug,
        title: candidate.question,
        localMarketId: null,
        conditionId: candidate.conditionId,
        externalMarketId: candidate.externalMarketId,
        outcomes: candidate.outcomes.map((outcome) => ({ name: outcome.label, tokenId: outcome.tokenId })),
        midpoint: midpoint(candidate.bestBid, candidate.bestAsk),
        bestBid: candidate.bestBid,
        bestAsk: candidate.bestAsk,
        spread: candidate.spread,
        imported: false,
        approvedLive: false,
        skippedReason: skipReason,
      });
      continue;
    }

    if (!apply) {
      imported.push({
        slug,
        title: candidate.question,
        localMarketId: null,
        conditionId: candidate.conditionId,
        externalMarketId: candidate.externalMarketId,
        outcomes: candidate.outcomes.map((outcome) => ({ name: outcome.label, tokenId: outcome.tokenId })),
        midpoint: midpoint(candidate.bestBid, candidate.bestAsk),
        bestBid: candidate.bestBid,
        bestAsk: candidate.bestAsk,
        spread: candidate.spread,
        imported: false,
        approvedLive: false,
        skippedReason: null,
      });
      continue;
    }

    const result = await upsertPolymarketReferenceMarket(
      {
        createEvents: true,
        event: candidate.event,
        market: {
          title: candidate.question,
          description: candidate.description,
          category: candidate.category,
          resolveTime: candidate.resolveTime,
          type: candidate.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
          desiredStatus: "live",
          externalMarketId: candidate.externalMarketId,
          conditionId: candidate.conditionId,
          externalSlug: candidate.slug,
          referenceSource: "polymarket",
          referenceMetadata: {
            importedFrom: "polymarket",
            importStatus: "approved",
            referenceOnly: true,
            tradable: true,
            mmEnabled: true,
            reviewedAt: new Date().toISOString(),
            reviewedBy: admin.id,
            reviewNotes: "Approved for first launch simulation pool.",
            bestBid: candidate.bestBid,
            bestAsk: candidate.bestAsk,
            spread: candidate.spread,
            lastTradePrice: candidate.lastTradePrice,
            volume: candidate.volume,
            volume24hr: candidate.volume24hr,
            liquidity: candidate.liquidity,
            acceptingOrders: candidate.acceptingOrders,
            maxLiquidityPerMarketUsd: Number(args.maxLiquidityPerMarketUsd ?? 200),
            maxOrderSizeUsd: Number(args.maxOrderSizeUsd ?? 10),
          },
          outcomes: candidate.outcomes.map((outcome, index) => ({
            name: outcome.label,
            displayOrder: index,
            isTradable: true,
            referenceTokenId: outcome.tokenId,
            referenceOutcomeLabel: outcome.label,
            referenceMetadata: {
              outcomePrice: outcome.outcomePrice,
              tokenId: outcome.tokenId,
            },
          })),
        },
      },
      admin.id,
    );

    const updated = await prisma.market.update({
      where: { id: result.marketId },
      data: {
        status: "LIVE",
        isListed: true,
        visibility: "PUBLIC",
        mechanism: "ORDERBOOK",
        referenceMetadata: buildImportedReferenceMetadata(
          {},
          {
            importedFrom: "polymarket",
            importStatus: "approved",
            referenceOnly: true,
            tradable: true,
            mmEnabled: true,
            reviewedAt: new Date().toISOString(),
            reviewedBy: admin.id,
            reviewNotes: "Approved for first launch simulation pool.",
            bestBid: candidate.bestBid,
            bestAsk: candidate.bestAsk,
            spread: candidate.spread,
            lastTradePrice: candidate.lastTradePrice,
            volume: candidate.volume,
            volume24hr: candidate.volume24hr,
            liquidity: candidate.liquidity,
            acceptingOrders: candidate.acceptingOrders,
            maxLiquidityPerMarketUsd: Number(args.maxLiquidityPerMarketUsd ?? 200),
            maxOrderSizeUsd: Number(args.maxOrderSizeUsd ?? 10),
          },
        ),
      },
      include: {
        outcomes: {
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        },
      },
    });

    await prisma.outcome.updateMany({
      where: { marketId: updated.id },
      data: { isTradable: true },
    });

    imported.push({
      slug,
      title: candidate.question,
      localMarketId: updated.id,
      conditionId: candidate.conditionId,
      externalMarketId: candidate.externalMarketId,
      outcomes: candidate.outcomes.map((outcome) => ({ name: outcome.label, tokenId: outcome.tokenId })),
      midpoint: midpoint(candidate.bestBid, candidate.bestAsk),
      bestBid: candidate.bestBid,
      bestAsk: candidate.bestAsk,
      spread: candidate.spread,
      imported: true,
      approvedLive: true,
      skippedReason: null,
    });
  }

  const generatedAt = new Date().toISOString();
  const summary = {
    generatedAt,
    mode: apply ? "apply" : "dryRun",
    requested: slugs.length,
    imported: imported.filter((item) => item.imported).length,
    skipped: imported.filter((item) => item.skippedReason).length,
  };
  await writeFile(
    path.join(outputDir, "LAUNCH_POOL_IMPORT_REPORT.json"),
    `${JSON.stringify({ summary, imported }, null, 2)}\n`,
    "utf8",
  );
  await writeFile(path.join(outputDir, "LAUNCH_POOL_IMPORT_REPORT.md"), renderMarkdown(summary, imported), "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function fetchMarketBySlug(slug: string) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("slug", slug);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Gamma API request failed for ${slug}: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0 || typeof payload[0] !== "object" || !payload[0]) {
    throw new Error(`No Gamma market found for slug ${slug}`);
  }
  const market = payload[0] as Record<string, unknown>;
  return {
    externalMarketId: asString(market.id) ?? asString(market.marketId) ?? slug,
    conditionId: asString(market.conditionId),
    slug: asString(market.slug) ?? slug,
    question: asString(market.question) ?? asString(market.title) ?? slug,
    description: asString(market.description),
    category: asString(market.category),
    resolveTime: asString(market.endDate),
    bestBid: asNumber(market.bestBid),
    bestAsk: asNumber(market.bestAsk),
    spread: asNumber(market.spread) ?? computeSpread(asNumber(market.bestBid), asNumber(market.bestAsk)),
    lastTradePrice: asNumber(market.lastTradePrice),
    volume: asNumber(market.volume ?? market.volumeNum),
    volume24hr: asNumber(market.volume24hr ?? market.volume24Hour ?? market.volume24h),
    liquidity: asNumber(market.liquidity ?? market.liquidityNum),
    acceptingOrders: market.acceptingOrders === true || market.acceptingOrders === "true",
    event: parseEvent(market),
    outcomes: parseOutcomes(market),
  };
}

function validateCandidate(candidate: Awaited<ReturnType<typeof fetchMarketBySlug>>) {
  if (!candidate.conditionId) return "missing_condition_id";
  if (!candidate.acceptingOrders) return "not_accepting_orders";
  if (candidate.bestBid == null || candidate.bestAsk == null) return "missing_book";
  if (candidate.spread == null || candidate.spread > MAX_SPREAD) return "spread_too_wide";
  if (candidate.bestBid < 0.01 || candidate.bestAsk > 0.99 || candidate.bestBid > candidate.bestAsk) return "invalid_book";
  if (candidate.outcomes.length !== 2) return "non_binary_market";
  if (candidate.outcomes.some((outcome) => !outcome.tokenId)) return "missing_token_id";
  return null;
}

function parseEvent(market: Record<string, unknown>) {
  const events = market.events;
  if (!Array.isArray(events) || !events[0] || typeof events[0] !== "object") {
    return null;
  }
  const event = events[0] as Record<string, unknown>;
  const title = asString(event.title) ?? asString(event.name);
  if (!title) return null;
  return {
    title,
    slug: asString(event.slug),
    description: asString(event.description),
    category: asString(event.category),
    status: asString(event.status),
    source: "polymarket",
    externalEventId: asString(event.id),
    externalSlug: asString(event.slug),
    image: asString(event.image),
    icon: asString(event.icon),
    metadata: event as Prisma.InputJsonObject,
  };
}

function parseOutcomes(market: Record<string, unknown>) {
  const labels = parseStringArray(market.outcomes);
  const tokenIds = parseStringArray(market.clobTokenIds);
  const outcomePrices = parseNumberArray(market.outcomePrices);
  return labels.map((label, index) => ({
    label,
    tokenId: tokenIds[index] ?? null,
    outcomePrice: outcomePrices[index] ?? null,
  }));
}

function renderMarkdown(summary: Record<string, unknown>, imported: ImportResult[]) {
  return [
    "# Launch Pool Import Report",
    "",
    `Generated: ${summary.generatedAt}`,
    `Mode: ${summary.mode}`,
    "",
    `- Requested: ${summary.requested}`,
    `- Imported: ${summary.imported}`,
    `- Skipped: ${summary.skipped}`,
    "",
    "| Local Market ID | Title | Slug | Midpoint | Best Bid | Best Ask | Spread | Imported | Skip Reason |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...imported.map(
      (item) =>
        `| ${item.localMarketId ?? ""} | ${escapeMd(item.title)} | ${item.slug} | ${formatNumber(item.midpoint)} | ${formatNumber(item.bestBid)} | ${formatNumber(item.bestAsk)} | ${formatNumber(item.spread)} | ${item.imported} | ${item.skippedReason ?? ""} |`,
    ),
    "",
  ].join("\n");
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
    const key = part.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) index += 1;
  }
  return args;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => asNumber(part.trim())).filter((item): item is number => item != null);
    }
  }
  return [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  return bestBid == null || bestAsk == null ? null : Number((bestAsk - bestBid).toFixed(6));
}

function midpoint(bestBid: number | null, bestAsk: number | null) {
  return bestBid == null || bestAsk == null ? null : Number(((bestBid + bestAsk) / 2).toFixed(4));
}

function formatNumber(value: number | null) {
  return value == null ? "" : value.toFixed(4);
}

function escapeMd(value: string) {
  return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
