import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertReferenceQuoteSnapshots } from "@/server/services/referenceQuoteSnapshots";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_PROVIDER_SLUG = "new-rhianna-album-before-gta-vi-926";
const DEFAULT_EVENT_SLUG = "mobile-provider-refresh-proof-live";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-live-provider-refresh-proof-prep.json";

type GammaWire = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerSlug = args.providerSlug ?? args.slug ?? DEFAULT_PROVIDER_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const staleFetchedAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const gamma = await fetchGammaMarketBySlug(providerSlug);
  const outcomeLabels = parseStringArray(gamma.outcomes);
  const tokenIds = parseStringArray(gamma.clobTokenIds);
  const outcomePrices = parseNumberArray(gamma.outcomePrices);

  if (outcomeLabels.length === 0 || tokenIds.length !== outcomeLabels.length) {
    throw new Error(`Provider market ${providerSlug} does not expose complete outcome/token identity.`);
  }

  const event = await prisma.event.upsert({
    where: { slug: eventSlug },
    create: {
      slug: eventSlug,
      title: "Mobile Provider Refresh Proof",
      description: "Disposable local proof event for provider-owned compact live refresh.",
      category: "sports",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "provider_refresh_proof",
      homeTeamName: "Provider",
      awayTeamName: "Market",
      status: "live",
      liveStatus: "LIVE",
      period: "Proof",
      clock: "00:00",
      homeScore: 0,
      awayScore: 0,
      source: "polymarket-proof",
      externalSlug: providerSlug,
      sourceUpdatedAt: new Date(),
      metadata: {
        disposableProof: true,
        providerRefreshProof: true,
        providerSlug,
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: new Date().toISOString(),
            reason: "Disposable provider refresh proof event.",
          },
        },
      },
    },
    update: {
      title: "Mobile Provider Refresh Proof",
      status: "live",
      liveStatus: "LIVE",
      period: "Proof",
      clock: "00:00",
      sourceUpdatedAt: new Date(),
      externalSlug: providerSlug,
      metadata: {
        disposableProof: true,
        providerRefreshProof: true,
        providerSlug,
        mobileLiveDetail: {
          liveDataStatus: {
            source: "polymarket-gamma",
            status: "ready",
            lastUpdated: new Date().toISOString(),
            reason: "Disposable provider refresh proof event.",
          },
        },
      },
    },
  });

  const marketSlug = `${eventSlug}-${providerSlug}`;
  const market = await prisma.market.upsert({
    where: { slug: marketSlug },
    create: {
      slug: marketSlug,
      title: asString(gamma.question) ?? asString(gamma.title) ?? providerSlug,
      description: asString(gamma.description) ?? providerSlug,
      categoryLegacy: asString(gamma.category) ?? "sports",
      type: outcomeLabels.length > 2 ? "MULTI_WINNER" : "BINARY",
      marketType: outcomeLabels.length > 2 ? "match_winner_1x2" : "moneyline",
      marketGroupKey: "main",
      marketGroupTitle: "Main",
      displayOrder: 0,
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: asString(gamma.id) ?? providerSlug,
      conditionId: asString(gamma.conditionId),
      referenceSource: "polymarket",
      externalSlug: providerSlug,
      referenceMetadata: referenceMetadata(gamma),
      rulesText: "Disposable local proof market. Provider-owned quotes come from Polymarket Gamma.",
      sourceUpdatedAt: new Date(),
    },
    update: {
      title: asString(gamma.question) ?? asString(gamma.title) ?? providerSlug,
      description: asString(gamma.description) ?? providerSlug,
      type: outcomeLabels.length > 2 ? "MULTI_WINNER" : "BINARY",
      marketType: outcomeLabels.length > 2 ? "match_winner_1x2" : "moneyline",
      marketGroupKey: "main",
      marketGroupTitle: "Main",
      status: "LIVE",
      eventId: event.id,
      visibility: "PUBLIC",
      mechanism: "ORDERBOOK",
      isListed: true,
      externalMarketId: asString(gamma.id) ?? providerSlug,
      conditionId: asString(gamma.conditionId),
      referenceSource: "polymarket",
      externalSlug: providerSlug,
      referenceMetadata: referenceMetadata(gamma),
      sourceUpdatedAt: new Date(),
    },
  });

  const outcomes = [];
  for (const [index, label] of outcomeLabels.entries()) {
    const normalizedCode = label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `OUTCOME_${index + 1}`;
    const existingOutcome = await prisma.outcome.findFirst({
      where: {
        marketId: market.id,
        OR: [
          { code: normalizedCode },
          { referenceTokenId: tokenIds[index] ?? undefined },
        ],
      },
    });
    const outcomeData = {
      name: label,
      label,
      code: normalizedCode,
      side: sideForOutcome(label, index),
      displayOrder: index,
      isTradable: true,
      referenceTokenId: tokenIds[index] ?? null,
      referenceOutcomeLabel: label,
      referenceMetadata: {
        tokenId: tokenIds[index] ?? null,
        outcomePrice: outcomePrices[index] ?? null,
      },
    };
    const outcome = existingOutcome
      ? await prisma.outcome.update({
          where: { id: existingOutcome.id },
          data: outcomeData,
        })
      : await prisma.outcome.create({
          data: {
            marketId: market.id,
            slug: `${market.slug}-${normalizedCode.toLowerCase()}-${tokenIds[index]?.slice(-6) ?? index}`,
            ...outcomeData,
          },
        });
    outcomes.push(outcome);
  }

  const snapshotRows = outcomes.map((outcome, index) => ({
    marketId: market.id,
    outcomeId: outcome.id,
    source: "polymarket",
    externalSlug: providerSlug,
    externalMarketId: asString(gamma.id) ?? providerSlug,
    conditionId: asString(gamma.conditionId),
    tokenId: outcome.referenceTokenId,
    outcomeLabel: outcome.referenceOutcomeLabel,
    outcomePrice: outcomePrices[index] ?? null,
    bestBid: asNumber(gamma.bestBid),
    bestAsk: asNumber(gamma.bestAsk),
    spread: asNumber(gamma.spread) ?? computeSpread(asNumber(gamma.bestBid), asNumber(gamma.bestAsk)),
    lastTradePrice: asNumber(gamma.lastTradePrice),
    volume: asNumber(gamma.volume ?? gamma.volumeNum),
    volume24hr: asNumber(gamma.volume24hr ?? gamma.volume24Hour ?? gamma.volume24h),
    liquidity: asNumber(gamma.liquidity ?? gamma.liquidityNum),
    liquidityClob: asNumber(gamma.liquidityClob),
    acceptingOrders: asBoolean(gamma.acceptingOrders),
    qualityStatus: "stale_proof_seed",
    mmEligible: false,
    reason: "stale_provider_refresh_proof_seed",
    fetchedAt: staleFetchedAt,
  }));
  const upsertedSnapshots = await upsertReferenceQuoteSnapshots(snapshotRows);

  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerSlug,
    providerSource: GAMMA_BASE_URL,
    staleFetchedAt,
    eventId: event.id,
    marketId: market.id,
    marketSlug: market.slug,
    conditionId: market.conditionId,
    outcomeCount: outcomes.length,
    snapshotCount: upsertedSnapshots.length,
    nextProofSteps: [
      `GET /api/mobile/events/${eventSlug}/live-detail should show stale/refresh-due provider snapshots.`,
      `POST /api/mobile/events/${eventSlug}/provider-refresh with allowContractProofFallback=false should execute Gamma refresh.`,
      `GET /api/mobile/events/${eventSlug}/live-detail should then show ready and refresh-due=false.`,
    ],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

async function fetchGammaMarketBySlug(slug: string) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("slug", slug);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Gamma API request failed for ${slug}: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0 || !payload[0] || typeof payload[0] !== "object") {
    throw new Error(`No Gamma market found for ${slug}.`);
  }
  return payload[0] as GammaWire;
}

function referenceMetadata(gamma: GammaWire): Prisma.InputJsonValue {
  return {
    importedFrom: "polymarket",
    importStatus: "approved",
    referenceOnly: true,
    tradable: false,
    mmEnabled: false,
    providerRefreshProof: true,
    bestBid: asNumber(gamma.bestBid),
    bestAsk: asNumber(gamma.bestAsk),
    spread: asNumber(gamma.spread) ?? computeSpread(asNumber(gamma.bestBid), asNumber(gamma.bestAsk)),
    lastTradePrice: asNumber(gamma.lastTradePrice),
    volume: asNumber(gamma.volume ?? gamma.volumeNum),
    volume24hr: asNumber(gamma.volume24hr ?? gamma.volume24Hour ?? gamma.volume24h),
    liquidity: asNumber(gamma.liquidity ?? gamma.liquidityNum),
    acceptingOrders: asBoolean(gamma.acceptingOrders),
  };
}

function sideForOutcome(label: string, index: number) {
  const normalized = label.trim().toLowerCase();
  if (normalized === "yes") return "yes";
  if (normalized === "no") return "no";
  if (index === 0) return "home";
  if (index === 1) return "draw";
  if (index === 2) return "away";
  return null;
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

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
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
  if (Array.isArray(value)) {
    return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  }
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

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
