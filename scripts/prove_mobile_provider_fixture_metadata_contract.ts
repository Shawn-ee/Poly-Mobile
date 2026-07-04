import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { fetchPolymarketEventBySlug } from "@/server/services/polymarketEventImport";
import {
  extractProviderFixtureMetadataFromPolymarketEvent,
  mergeProviderFixtureMetadata,
} from "@/server/services/mobileLiveProviderFixtureMetadata";
import { getMobileLiveProviderMappingReadiness } from "@/server/services/mobileLiveProviderMapping";

const DEFAULT_PROVIDER_EVENT_SLUG = "fifwc-col-gha-2026-07-03";
const DEFAULT_LOCAL_EVENT_SLUG = "world-cup-2026-colombia-vs-ghana-2026-07-03";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/cycle-current-mobile-provider-fixture-metadata-contract.json";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const providerEventSlug = args.providerEventSlug ?? DEFAULT_PROVIDER_EVENT_SLUG;
  const eventSlug = args.eventSlug ?? DEFAULT_LOCAL_EVENT_SLUG;
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const providerEvent = await fetchPolymarketEventBySlug(providerEventSlug);
  const providerFixture = extractProviderFixtureMetadataFromPolymarketEvent(providerEvent);
  const event = await prisma.event.findFirst({ where: { slug: eventSlug } });
  if (!event) throw new Error(`No local event found for ${eventSlug}.`);

  await prisma.event.update({
    where: { id: event.id },
    data: {
      source: "polymarket",
      externalSlug: providerEventSlug,
      externalEventId: providerEvent.externalEventId,
      metadata: mergeProviderFixtureMetadata(event.metadata, providerFixture),
    },
  });

  const readiness = await getMobileLiveProviderMappingReadiness(eventSlug);
  const fixture = readiness.providerFixture;
  const summary = {
    generatedAt: new Date().toISOString(),
    eventSlug,
    providerEventSlug,
    providerFixture: fixture
      ? {
          providerEventSlug: fixture.providerEventSlug,
          providerEventId: fixture.providerEventId,
          seriesSlug: fixture.seriesSlug,
          sport: fixture.sport,
          live: fixture.live,
          score: fixture.score,
          elapsed: fixture.elapsed,
          period: fixture.period,
          opticOddsFixtureId: fixture.opticOddsFixtureId,
          opticOddsGameId: fixture.opticOddsGameId,
          opticOddsNumericalId: fixture.opticOddsNumericalId,
          sportradarGameId: fixture.sportradarGameId,
          teamCount: fixture.teams.length,
          teams: fixture.teams,
          moneylineMarketCount: fixture.moneylineMarkets.length,
          moneylineMarkets: fixture.moneylineMarkets,
          lineMarketSourceContract: fixture.lineMarketSourceContract,
        }
      : null,
    readiness: {
      compactMarketCount: readiness.compactMarketCount,
      providerRefreshableMarketCount: readiness.providerRefreshableMarketCount,
      providerRefreshableOutcomeCount: readiness.providerRefreshableOutcomeCount,
      nextRequiredAction: readiness.nextRequiredAction,
    },
    pass:
      fixture?.providerEventSlug === providerEventSlug &&
      Boolean(fixture.opticOddsFixtureId) &&
      Boolean(fixture.opticOddsGameId) &&
      fixture.teams.length >= 2 &&
      fixture.moneylineMarkets.length >= 3 &&
      fixture.lineMarketSourceContract.intendedProvider === "optic_odds" &&
      fixture.lineMarketSourceContract.missingFields.length === 0,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
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
