import fs from "node:fs/promises";
import path from "node:path";
import { GET as getMobileLiveDetail } from "@/app/api/mobile/events/[slug]/live-detail/route";
import { prisma } from "@/lib/db";

const DEFAULT_EVENT_SLUG = "argentina-vs-egypt";
const DEFAULT_OUTPUT_PATH =
  "docs/mobile/harness/cycle-OK-current-provider-readiness-gate/cycle-OK-provider-match-line-availability.json";

type GammaEvent = {
  title?: string;
  slug?: string;
  markets?: Array<{
    id?: string;
    slug?: string;
    question?: string;
    conditionId?: string;
  }>;
};

type Family = "match_winner_1x2" | "spread" | "total_goals" | "team_total_goals" | "halves" | "corners" | "correct_score" | "other";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function classifyMarket(question: string): Family {
  const value = question.toLowerCase();
  if (/\bwill\b.+\bwin\b/.test(value) || /\bend in a draw\b/.test(value) || /\bdraw\b/.test(value)) {
    return "match_winner_1x2";
  }
  if (/\bspread\b|\bhandicap\b|\bcover\b|\b[+-]\d+(\.\d+)?\b/.test(value)) return "spread";
  if (/\bteam total\b|\bteam goals\b/.test(value)) return "team_total_goals";
  if (/\btotal\b|\bover\b|\bunder\b/.test(value) && /\bgoal/.test(value)) return "total_goals";
  if (/\bfirst half\b|\bsecond half\b|\b1h\b|\b2h\b/.test(value)) return "halves";
  if (/\bcorner\b/.test(value)) return "corners";
  if (/\bcorrect score\b|\bscoreline\b/.test(value)) return "correct_score";
  return "other";
}

function countBy<T extends string>(values: T[]) {
  return values.reduce<Record<T, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {} as Record<T, number>);
}

async function fetchGammaEvent(providerEventSlug: string) {
  const url = `https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(providerEventSlug)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gamma event fetch failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as GammaEvent[];
  return { url, event: payload[0] ?? null };
}

async function readLiveDetail(eventSlug: string) {
  const response = await getMobileLiveDetail(
    new Request(`http://localhost/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    { params: Promise.resolve({ slug: eventSlug }) },
  );
  const payload = await response.json();
  return { status: response.status, payload };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local MVP provider availability proof in production.");
  }

  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const cycle = argValue("cycle") ?? "OK";
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: { id: true, slug: true, title: true, externalSlug: true, source: true },
  });
  if (!event) throw new Error(`Event ${eventSlug} was not found.`);
  if (!event.externalSlug) throw new Error(`Event ${eventSlug} has no externalSlug.`);

  const gamma = await fetchGammaEvent(event.externalSlug);
  const gammaMarkets = gamma.event?.markets ?? [];
  const gammaFamilies = gammaMarkets.map((market) => classifyMarket(market.question ?? ""));
  const gammaFamilyCounts = countBy(gammaFamilies);
  const gammaLineMarketCount = gammaFamilies.filter((family) =>
    ["spread", "total_goals", "team_total_goals", "halves", "corners", "correct_score"].includes(family),
  ).length;

  const liveDetail = await readLiveDetail(eventSlug);
  if (liveDetail.status !== 200) {
    throw new Error(`Live detail route returned ${liveDetail.status}: ${JSON.stringify(liveDetail.payload)}`);
  }
  const marketSourceSummary = liveDetail.payload.event?.marketSourceSummary ?? liveDetail.payload.contract?.marketSourceSummary ?? null;
  const lineProviderAvailability = marketSourceSummary?.lineMarkets?.providerAvailability ?? null;
  const localMarkets = Array.isArray(liveDetail.payload.markets) ? liveDetail.payload.markets : [];
  const localSummary = localMarkets.map((market) => ({
    title: market.title,
    marketType: market.marketType,
    marketGroupTitle: market.marketGroupTitle,
    line: market.line ?? null,
    period: market.period ?? null,
    referenceSource: market.referenceSource ?? null,
    externalMarketId: market.externalMarketId ?? null,
  }));
  const localRealPolymarketMarkets = localSummary.filter((market) => market.referenceSource === "polymarket");
  const localContractFixtureMarkets = localSummary.filter((market) => market.referenceSource === "contract-fixture");
  const localContractLineFamilies = Array.from(new Set(
    localContractFixtureMarkets
      .map((market) => market.marketType)
      .filter((type) => ["spread", "total_goals", "team_total_goals"].includes(type)),
  ));

  const summary = {
    generatedAt: new Date().toISOString(),
    cycle,
    scope: "provider-match-line-availability",
    event: {
      slug: event.slug,
      title: event.title,
      source: event.source,
      providerEventSlug: event.externalSlug,
    },
    provider: {
      source: "polymarket-gamma",
      url: gamma.url,
      eventTitle: gamma.event?.title ?? null,
      marketCount: gammaMarkets.length,
      familyCounts: gammaFamilyCounts,
      lineMarketCount: gammaLineMarketCount,
      markets: gammaMarkets.map((market) => ({
        id: market.id ?? null,
        slug: market.slug ?? null,
        question: market.question ?? null,
        conditionId: market.conditionId ?? null,
        family: classifyMarket(market.question ?? ""),
      })),
    },
    holiwynRoute: {
      route: `/api/mobile/events/${eventSlug}/live-detail`,
      status: liveDetail.status,
      marketCount: localSummary.length,
      realPolymarketMarketCount: localRealPolymarketMarkets.length,
      contractFixtureMarketCount: localContractFixtureMarkets.length,
      contractLineFamilies: localContractLineFamilies,
      marketSourceSummary,
      lineProviderAvailability,
      markets: localSummary,
    },
    decision: {
      realRegulationWinnerAvailable:
        (gammaFamilyCounts.match_winner_1x2 ?? 0) >= 3 && localRealPolymarketMarkets.length >= 3,
      realLineMarketsAvailableFromGamma: gammaLineMarketCount > 0,
      contractFixturesJustifiedForLocalMvp:
        gammaLineMarketCount === 0 &&
        localContractLineFamilies.includes("spread") &&
        localContractLineFamilies.includes("total_goals") &&
        localContractLineFamilies.includes("team_total_goals"),
      routeSourceSummaryMatches:
        marketSourceSummary?.regulationWinner?.status === "provider-backed" &&
        marketSourceSummary?.lineMarkets?.status === "contract-fixture",
      routeReportsExpectedLineFamilies:
        Array.isArray(lineProviderAvailability?.expectedFamilies) &&
        ["spread", "total", "team_total"].every((family) => lineProviderAvailability.expectedFamilies.includes(family)),
      routeReportsUnavailableProviderFamilies:
        Array.isArray(lineProviderAvailability?.providerUnavailableFamilies) &&
        ["spread", "total", "team_total"].every((family) => lineProviderAvailability.providerUnavailableFamilies.includes(family)),
      routeReportsFixtureOnlyFamilies:
        Array.isArray(lineProviderAvailability?.fixtureOnlyFamilies) &&
        ["spread", "total", "team_total"].every((family) => lineProviderAvailability.fixtureOnlyFamilies.includes(family)),
      routeReportsNoMissingFixtureFamilies:
        Array.isArray(lineProviderAvailability?.missingFamilies) &&
        lineProviderAvailability.missingFamilies.length === 0,
      nextPath:
        gammaLineMarketCount > 0
          ? "map_real_gamma_line_markets_before_using_fixtures"
          : "continue_local_mvp_with_contract_fixture_lines_until_real_provider_line_markets_exist",
    },
    pass:
      gammaMarkets.length >= 3 &&
      (gammaFamilyCounts.match_winner_1x2 ?? 0) >= 3 &&
      gammaLineMarketCount === 0 &&
      localRealPolymarketMarkets.length >= 3 &&
      localContractLineFamilies.includes("spread") &&
      localContractLineFamilies.includes("total_goals") &&
      localContractLineFamilies.includes("team_total_goals") &&
      marketSourceSummary?.regulationWinner?.status === "provider-backed" &&
      marketSourceSummary?.lineMarkets?.status === "contract-fixture" &&
      Array.isArray(lineProviderAvailability?.expectedFamilies) &&
      ["spread", "total", "team_total"].every((family) => lineProviderAvailability.expectedFamilies.includes(family)) &&
      Array.isArray(lineProviderAvailability?.providerUnavailableFamilies) &&
      ["spread", "total", "team_total"].every((family) => lineProviderAvailability.providerUnavailableFamilies.includes(family)) &&
      Array.isArray(lineProviderAvailability?.fixtureOnlyFamilies) &&
      ["spread", "total", "team_total"].every((family) => lineProviderAvailability.fixtureOnlyFamilies.includes(family)) &&
      Array.isArray(lineProviderAvailability?.missingFamilies) &&
      lineProviderAvailability.missingFamilies.length === 0,
    limitations: [
      "This is a backend/provider availability proof only; Android proof is handled by the visible Local MVP journey harness.",
      "Contract-fixture line markets are acceptable for local MVP UI/order proof but are not Polymarket-backed parity.",
      "If a future Polymarket event exposes line markets through Gamma/CLOB, those real mappings should replace the fixture rows.",
      "The default event slug intentionally follows the current Home MVP match so stale disposable-event defaults do not hide real service readiness.",
    ],
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
