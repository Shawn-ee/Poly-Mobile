import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";

const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-JQ-backend-event-market-cashout-safety/cycle-JQ-market-rule-profiles.json";
const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

async function readLiveDetailRoute(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  assert(response.status === 200, `Expected live-detail status 200, received ${response.status}.`);
  return response.json();
}

function marketInput(params: {
  suffix: string;
  slugPart: string;
  title: string;
  marketType: string;
  marketGroupKey: string;
  marketGroupTitle: string;
  displayOrder: number;
  period?: string;
  line?: string;
  unit?: string;
  outcomes: Array<[name: string, label: string, side: string]>;
}) {
  const now = new Date();
  return {
    slug: `mobile-jq-${params.slugPart}-${params.suffix}`,
    title: params.title,
    description: "JQ backend market-rule profile proof market.",
    status: "LIVE",
    mechanism: "ORDERBOOK",
    visibility: "PUBLIC",
    kind: "ORDERBOOK",
    type: "BINARY",
    marketType: params.marketType,
    marketGroupKey: params.marketGroupKey,
    marketGroupTitle: params.marketGroupTitle,
    displayOrder: params.displayOrder,
    period: params.period ?? "full-game",
    line: params.line ? dec(params.line) : undefined,
    unit: params.unit,
    referenceSource: "polymarket",
    externalSlug: `jq-${params.slugPart}-${params.suffix}`,
    externalMarketId: `gamma-jq-${params.slugPart}-${params.suffix}`,
    conditionId: `condition-jq-${params.slugPart}-${params.suffix}`,
    sourceUpdatedAt: now,
    isListed: true,
    outcomes: {
      create: params.outcomes.map(([name, label, side], index) => ({
        name,
        label,
        side,
        code: side.toUpperCase(),
        slug: `mobile-jq-${params.slugPart}-${side}-${params.suffix}`,
        displayOrder: index,
        isActive: true,
        isTradable: true,
        referenceTokenId: `token-jq-${params.slugPart}-${side}-${params.suffix}`,
        referenceOutcomeLabel: label,
      })),
    },
  };
}

async function createRegulationProfileEvent(suffix: string) {
  return prisma.event.create({
    data: {
      slug: `mobile-jq-regulation-90-draw-${suffix}`,
      title: "JQ Regulation 90 Draw Proof",
      description: "Disposable event proving a regulation 90-minute winner market with draw.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Regulation Home",
      awayTeamName: "Regulation Away",
      status: "upcoming",
      startTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `jq-regulation-event-${suffix}`,
          providerEventId: `gamma-jq-regulation-${suffix}`,
          sport: "soccer",
        },
      },
      markets: {
        create: [
          marketInput({
            suffix,
            slugPart: "regulation-winner",
            title: "Regulation Home vs Regulation Away - 90 Minute Winner",
            marketType: "moneyline",
            marketGroupKey: "main",
            marketGroupTitle: "Regulation Time Winner",
            displayOrder: 0,
            period: "regulation",
            outcomes: [
              ["Home", "Regulation Home", "home"],
              ["Tie", "Tie", "draw"],
              ["Away", "Regulation Away", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "spread",
            title: "Regulation Home vs Regulation Away - Spread 1.5",
            marketType: "spread",
            marketGroupKey: "spread",
            marketGroupTitle: "Spread",
            displayOrder: 1,
            period: "regulation",
            line: "1.5",
            unit: "goals",
            outcomes: [
              ["Home", "Regulation Home -1.5", "home"],
              ["Away", "Regulation Away +1.5", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "totals",
            title: "Regulation Home vs Regulation Away - Total Goals 2.5",
            marketType: "total_goals",
            marketGroupKey: "totals",
            marketGroupTitle: "Totals",
            displayOrder: 2,
            period: "regulation",
            line: "2.5",
            unit: "goals",
            outcomes: [
              ["Over", "Over 2.5", "over"],
              ["Under", "Under 2.5", "under"],
            ],
          }),
        ],
      },
    },
  });
}

async function createAdvanceProfileEvent(suffix: string) {
  return prisma.event.create({
    data: {
      slug: `mobile-jq-to-advance-no-draw-${suffix}`,
      title: "JQ Knockout Advance Proof",
      description: "Disposable event proving a knockout match with regulation-time draw and separate no-draw advance market.",
      category: "Sports / Soccer",
      sportKey: "soccer",
      leagueKey: "world_cup",
      eventType: "match",
      homeTeamName: "Advance Home",
      awayTeamName: "Advance Away",
      status: "upcoming",
      startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
      metadata: {
        providerFixture: {
          providerSource: "polymarket-gamma",
          providerEventSlug: `jq-advance-event-${suffix}`,
          providerEventId: `gamma-jq-advance-${suffix}`,
          sport: "soccer",
        },
      },
      markets: {
        create: [
          marketInput({
            suffix,
            slugPart: "knockout-regulation-winner",
            title: "Advance Home vs Advance Away - 90 Minute Winner",
            marketType: "moneyline",
            marketGroupKey: "regulation-winner",
            marketGroupTitle: "Regulation Time Winner",
            displayOrder: 0,
            period: "regulation",
            outcomes: [
              ["Home", "Advance Home", "home"],
              ["Tie", "Tie", "draw"],
              ["Away", "Advance Away", "away"],
            ],
          }),
          marketInput({
            suffix,
            slugPart: "to-advance",
            title: "Advance Home vs Advance Away - To Advance",
            marketType: "to_advance",
            marketGroupKey: "to-advance",
            marketGroupTitle: "To Advance",
            displayOrder: 1,
            period: "full-match",
            outcomes: [
              ["Home", "Advance Home", "home"],
              ["Away", "Advance Away", "away"],
            ],
          }),
        ],
      },
    },
  });
}

async function main() {
  const suffix = randomUUID().slice(0, 8);
  const regulationEvent = await createRegulationProfileEvent(suffix);
  const advanceEvent = await createAdvanceProfileEvent(suffix);

  const regulationDetail = await readLiveDetailRoute(regulationEvent.slug);
  const advanceDetail = await readLiveDetailRoute(advanceEvent.slug);

  assert(regulationDetail.event.marketProfile === "regulation_90", "Regulation event did not report regulation_90.");
  assert(regulationDetail.event.resultMode === "can_draw", "Regulation event did not report can_draw.");
  assert(
    regulationDetail.event.supportedMarketTypes.includes("spread") &&
      regulationDetail.event.supportedMarketTypes.includes("totals"),
    "Regulation event did not expose backend line-market availability.",
  );
  assert(
    regulationDetail.markets.some((market: any) => market.outcomes?.some((outcome: any) => outcome.side === "draw")),
    "Regulation event route did not include draw outcome.",
  );

  assert(advanceDetail.event.supportedMarketTypes.includes("to_advance"), "Knockout event did not report to_advance availability.");
  assert(advanceDetail.event.supportedMarketTypes.includes("regulation_90"), "Knockout event did not report regulation_90 availability.");
  assert(advanceDetail.event.resultMode === "can_draw", "Knockout regulation market did not report can_draw.");
  assert(
    advanceDetail.markets.some((market: any) => market.outcomes?.some((outcome: any) => outcome.side === "draw")),
    "Knockout event route did not include regulation draw outcome.",
  );
  assert(
    advanceDetail.markets.some((market: any) =>
      `${market.marketType ?? ""} ${market.marketGroupKey ?? ""} ${market.marketGroupTitle ?? ""} ${market.title ?? ""}`.toLowerCase().includes("advance") &&
      !market.outcomes?.some((outcome: any) => outcome.side === "draw")),
    "Knockout event route did not include a no-draw advance market.",
  );

  const summary = {
    pass: true,
    createdAt: new Date().toISOString(),
    regulation90Draw: {
      eventSlug: regulationEvent.slug,
      title: regulationEvent.title,
      marketProfile: regulationDetail.event.marketProfile,
      resultMode: regulationDetail.event.resultMode,
      supportedMarketTypes: regulationDetail.event.supportedMarketTypes,
    },
    toAdvanceNoDraw: {
      eventSlug: advanceEvent.slug,
      title: advanceEvent.title,
      marketProfile: advanceDetail.event.marketProfile,
      resultMode: advanceDetail.event.resultMode,
      supportedMarketTypes: advanceDetail.event.supportedMarketTypes,
    },
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
