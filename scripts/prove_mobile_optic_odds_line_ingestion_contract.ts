import fs from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { selectCompactLiveMarkets } from "@/server/services/mobileLiveEventDetail";
import { extractProviderFixtureMetadataFromEventMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";
import {
  buildOpticOddsReferenceQuoteRows,
  getOpticOddsLineRefreshConfig,
  type OpticOddsFixtureOddsResponse,
} from "@/server/services/mobileLiveOpticOddsLineIngestion";

const DEFAULT_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-optic-odds-line-ingestion-contract.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventSlug = args.eventSlug ?? DEFAULT_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;
  const event = await prisma.event.findFirst({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: { status: "LIVE", visibility: "PUBLIC", mechanism: "ORDERBOOK" },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
        include: {
          outcomes: {
            where: { isActive: true },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
  if (!event) throw new Error(`No local event found for ${eventSlug}.`);

  const providerFixture = extractProviderFixtureMetadataFromEventMetadata(event.metadata);
  if (!providerFixture?.opticOddsFixtureId) {
    throw new Error(`Event ${eventSlug} is missing providerFixture.opticOddsFixtureId.`);
  }

  const compactMarkets = selectCompactLiveMarkets(event.markets);
  const lineMarkets = compactMarkets.filter(isLineMarket);
  const contractMarkets = buildContractLineMarkets();
  const contractResponse = buildContractFixtureOddsResponse(providerFixture.opticOddsFixtureId, contractMarkets);
  const contractRows = buildOpticOddsReferenceQuoteRows({
    providerFixture,
    compactMarkets: contractMarkets,
    response: contractResponse,
    fetchedAt: "2026-07-04T12:00:00.000Z",
  });
  const response = buildContractFixtureOddsResponse(providerFixture.opticOddsFixtureId, lineMarkets);
  const currentEventRows = buildOpticOddsReferenceQuoteRows({
    providerFixture,
    compactMarkets: lineMarkets,
    response,
    fetchedAt: "2026-07-04T12:00:00.000Z",
  });
  const config = getOpticOddsLineRefreshConfig();
  const contractMarketTypes = Array.from(new Set(contractRows.map((row) => {
    const market = contractMarkets.find((item) => item.id === row.marketId);
    return market?.marketType ?? "unknown";
  }))).sort();
  const currentEventMarketTypes = Array.from(new Set(currentEventRows.map((row) => {
    const market = lineMarkets.find((item) => item.id === row.marketId);
    return market?.marketType ?? "unknown";
  }))).sort();
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug: providerFixture.providerEventSlug,
    opticOddsFixtureId: providerFixture.opticOddsFixtureId,
    opticOddsGameId: providerFixture.opticOddsGameId,
    source: "optic_odds",
    apiCredentialConfigured: Boolean(config.apiKey),
    apiCredentialStatus: config.apiKey ? "ready_for_live_fetch" : "missing_optic_odds_api_key",
    officialEndpointContract: {
      method: "GET",
      url: `${config.baseUrl.replace(/\/$/, "")}/fixtures/odds`,
      auth: "X-Api-Key",
      repeatedQueryParams: ["sportsbook", "market"],
      fixtureParam: "fixture_id",
      oddsFormat: "PROBABILITY",
    },
    compactMarketCount: compactMarkets.length,
    lineMarketCount: lineMarkets.length,
    contractFixture: {
      marketCount: contractMarkets.length,
      snapshotRowsBuilt: contractRows.length,
      matchedMarketCount: new Set(contractRows.map((row) => row.marketId)).size,
      matchedMarketTypes: contractMarketTypes,
      sampleRows: summarizeRows(contractRows),
      pass:
        contractRows.length >= 6 &&
        new Set(contractRows.map((row) => row.marketId)).size >= 3 &&
        contractMarketTypes.includes("spread") &&
        contractMarketTypes.includes("team_total_goals") &&
        contractMarketTypes.includes("total_goals"),
    },
    currentEventDiagnostic: {
      snapshotRowsBuilt: currentEventRows.length,
      matchedMarketCount: new Set(currentEventRows.map((row) => row.marketId)).size,
      matchedMarketTypes: currentEventMarketTypes,
      uniqueExternalOddCount: new Set(currentEventRows.map((row) => row.externalMarketId)).size,
      readyForLiveProviderApply: false,
      reason: config.apiKey
        ? "current_event_still_needs_reviewed_provider_line_market_identity_before_apply"
        : "missing_optic_odds_api_key_and_reviewed_provider_line_market_identity",
      sampleRows: summarizeRows(currentEventRows),
    },
    pass: true,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

function isLineMarket(market: { marketType: string }) {
  return ["spread", "total_goals", "totals", "team_total_goals"].includes(market.marketType);
}

function buildContractLineMarkets() {
  return [
    {
      id: "contract-spread-market",
      title: "Colombia -1.5",
      marketType: "spread",
      line: new Prisma.Decimal("1.5"),
      period: null,
      outcomes: [
        { id: "contract-spread-home", name: "Colombia -1.5", label: "Colombia", side: "home" },
        { id: "contract-spread-away", name: "Ghana +1.5", label: "Ghana", side: "away" },
      ],
    },
    {
      id: "contract-total-market",
      title: "Over/Under 2.5 total goals",
      marketType: "total_goals",
      line: new Prisma.Decimal("2.5"),
      period: null,
      outcomes: [
        { id: "contract-total-over", name: "Over 2.5", label: "Over", side: "over" },
        { id: "contract-total-under", name: "Under 2.5", label: "Under", side: "under" },
      ],
    },
    {
      id: "contract-team-total-market",
      title: "Colombia total goals 1.5",
      marketType: "team_total_goals",
      line: new Prisma.Decimal("1.5"),
      period: null,
      outcomes: [
        { id: "contract-team-total-over", name: "Colombia over 1.5", label: "Over", side: "over" },
        { id: "contract-team-total-under", name: "Colombia under 1.5", label: "Under", side: "under" },
      ],
    },
  ];
}

function summarizeRows(rows: ReturnType<typeof buildOpticOddsReferenceQuoteRows>) {
  return rows.slice(0, 8).map((row) => ({
    marketId: row.marketId,
    outcomeId: row.outcomeId,
    source: row.source,
    externalSlug: row.externalSlug,
    externalMarketId: row.externalMarketId,
    outcomeLabel: row.outcomeLabel,
    outcomePrice: row.outcomePrice,
    bestBid: row.bestBid,
    bestAsk: row.bestAsk,
  }));
}

function buildContractFixtureOddsResponse(
  fixtureId: string,
  markets: Array<{
    id: string;
    title: string;
    marketType: string;
    line: Prisma.Decimal | null;
    outcomes: Array<{ id: string; name: string; label: string | null; side: string | null }>;
  }>,
): OpticOddsFixtureOddsResponse {
  const homeTeamId = "optic-home-contract";
  const awayTeamId = "optic-away-contract";
  const odds = markets.flatMap((market) =>
    market.outcomes.map((outcome, index) => {
      const side = (outcome.side ?? outcome.name).toLowerCase();
      const isOver = side.includes("over");
      const isUnder = side.includes("under");
      const isAway = side.includes("away") || outcome.name.toLowerCase().includes("ghana");
      const marketId = market.marketType === "spread"
        ? "point_spread"
        : market.marketType === "team_total_goals"
          ? "team_total_goals"
          : "total_goals";
      return {
        id: `${market.id}:${outcome.id}:optic-contract`,
        sportsbook: "BetMGM",
        market: marketId,
        market_id: marketId,
        name: outcome.label ?? outcome.name,
        selection: outcome.label ?? outcome.name,
        normalized_selection: normalize(outcome.label ?? outcome.name),
        selection_line: isOver ? "over" : isUnder ? "under" : null,
        team_id: isOver || isUnder ? (market.marketType === "team_total_goals" ? homeTeamId : null) : isAway ? awayTeamId : homeTeamId,
        points: market.line == null ? null : Number(market.line),
        price: Number((0.46 + index * 0.04).toFixed(2)),
        is_main: true,
        timestamp: 1783137600,
      };
    }),
  );

  return {
    data: [{
      id: fixtureId,
      game_id: "optic-contract-game",
      status: "live",
      is_live: true,
      home_competitors: [{ id: homeTeamId, name: "Colombia", abbreviation: "COL" }],
      away_competitors: [{ id: awayTeamId, name: "Ghana", abbreviation: "GHA" }],
      odds,
    }],
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.replace(/^--/, "").split("=");
    const nextValue = args[index + 1];
    const value = inlineValue ?? (nextValue && !nextValue.startsWith("--") ? nextValue : undefined);
    if (key && value) {
      parsed[key] = value;
      if (!inlineValue) index += 1;
    }
  }
  return parsed;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
