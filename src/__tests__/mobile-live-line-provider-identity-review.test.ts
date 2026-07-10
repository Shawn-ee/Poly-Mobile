import { Prisma } from "@prisma/client";
import {
  summarizeLineProviderIdentityReadiness,
  validateLineProviderIdentityReviews,
} from "@/server/services/mobileLiveLineProviderIdentityReview";
import { buildOpticOddsReferenceQuoteRows } from "@/server/services/mobileLiveOpticOddsLineIngestion";
import type { MobileLiveProviderFixtureMetadata } from "@/server/services/mobileLiveProviderFixtureMetadata";

describe("mobile live line provider identity review", () => {
  test("validates complete reviewed OpticOdds identity for a line market", () => {
    const market = lineMarket();
    const validation = validateLineProviderIdentityReviews({
      compactMarkets: [market],
      reviews: [validReview()],
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  test("rejects wrong family, wrong line, and incomplete outcomes", () => {
    const validation = validateLineProviderIdentityReviews({
      compactMarkets: [lineMarket()],
      reviews: [{
        ...validReview(),
        providerMarketId: "moneyline",
        points: 3.5,
        outcomes: [validReview().outcomes[0]],
      }],
    });

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "provider_market_type_mismatch" }),
      expect.objectContaining({ reason: "provider_line_value_mismatch" }),
      expect.objectContaining({ reason: "review_must_include_every_compact_market_outcome" }),
    ]));
  });

  test("readiness counts reviewed external market and outcome identities as optional enrichment", () => {
    const readyMarket = {
      ...lineMarket(),
      referenceMetadata: {
        lineProviderIdentity: {
          providerSource: "optic_odds",
          providerMarketId: "total_goals",
        },
      },
      outcomes: lineMarket().outcomes.map((outcome) => ({
        ...outcome,
        referenceMetadata: {
          lineProviderIdentity: {
            providerSource: "optic_odds",
            providerOddId: `odd-${outcome.id}`,
          },
        },
      })),
    };

    expect(summarizeLineProviderIdentityReadiness([readyMarket])).toEqual(expect.objectContaining({
      lineMarketCount: 1,
      polymarketLineMarketReadyCount: 0,
      optionalExternalLineProviderReadyCount: 1,
      lineProviderReadyMarketCount: 1,
      nextRequiredAction: "optional_external_line_provider_enrichment_ready",
    }));
  });

  test("readiness treats route-visible Polymarket line markets as primary-ready without Optic Odds", () => {
    const readyMarket = {
      ...lineMarket(),
      referenceSource: "polymarket",
      externalMarketId: "gamma-total-market",
      conditionId: "condition-total-market",
      outcomes: lineMarket().outcomes.map((outcome) => ({
        ...outcome,
        referenceSource: "polymarket",
        referenceTokenId: `token-${outcome.id}`,
      })),
    };

    expect(summarizeLineProviderIdentityReadiness([readyMarket])).toEqual(expect.objectContaining({
      lineMarketCount: 1,
      polymarketLineMarketReadyCount: 1,
      optionalExternalLineProviderReadyCount: 0,
      lineProviderReadyMarketCount: 1,
      nextRequiredAction: "polymarket_line_markets_ready",
    }));
  });

  test("readiness does not block on missing Optic Odds when Polymarket line identity is absent", () => {
    expect(summarizeLineProviderIdentityReadiness([lineMarket()])).toEqual(expect.objectContaining({
      lineMarketCount: 1,
      polymarketLineMarketReadyCount: 0,
      optionalExternalLineProviderReadyCount: 0,
      lineProviderReadyMarketCount: 0,
      nextRequiredAction: "discover_attach_ready_polymarket_line_markets_or_configure_approved_line_provider",
    }));
  });

  test("OpticOdds rows use reviewed provider market and odd ids when present", () => {
    const rows = buildOpticOddsReferenceQuoteRows({
      providerFixture: fixture(),
      compactMarkets: [{
        ...lineMarket(),
        referenceMetadata: {
          lineProviderIdentity: {
            providerSource: "optic_odds",
            providerMarketId: "total_goals",
          },
        },
        outcomes: lineMarket().outcomes.map((outcome) => ({
          ...outcome,
          referenceMetadata: {
            lineProviderIdentity: {
              providerSource: "optic_odds",
              providerOddId: outcome.side === "over" ? "reviewed-over" : "reviewed-under",
            },
          },
        })),
      }],
      response: {
        data: [{
          id: "fixture-123",
          odds: [
            opticOdd("loose-over", "Over 2.5", "over", 0.11),
            opticOdd("reviewed-over", "Over 2.5", "over", 0.47),
            opticOdd("reviewed-under", "Under 2.5", "under", 0.53),
          ],
        }],
      },
      fetchedAt: "2026-07-04T12:00:00.000Z",
    });

    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ outcomeId: "over-outcome", externalMarketId: "reviewed-over", outcomePrice: 0.47 }),
      expect.objectContaining({ outcomeId: "under-outcome", externalMarketId: "reviewed-under", outcomePrice: 0.53 }),
    ]));
  });
});

function lineMarket() {
  return {
    id: "total-market",
    title: "Over/Under 2.5 total goals",
    marketType: "total_goals",
    line: new Prisma.Decimal("2.5"),
    period: null,
    referenceMetadata: null,
    outcomes: [
      { id: "over-outcome", name: "Over 2.5", label: "Over", side: "over", referenceMetadata: null },
      { id: "under-outcome", name: "Under 2.5", label: "Under", side: "under", referenceMetadata: null },
    ],
  };
}

function validReview() {
  return {
    marketId: "total-market",
    providerSource: "optic_odds" as const,
    fixtureId: "fixture-123",
    gameId: "game-456",
    sportsbook: "BetMGM",
    providerMarketId: "total_goals",
    providerMarketName: "Total Goals",
    points: 2.5,
    period: null,
    outcomes: [
      { outcomeId: "over-outcome", providerOddId: "reviewed-over", selection: "Over 2.5", selectionLine: "over" },
      { outcomeId: "under-outcome", providerOddId: "reviewed-under", selection: "Under 2.5", selectionLine: "under" },
    ],
  };
}

function fixture(): MobileLiveProviderFixtureMetadata {
  return {
    providerSource: "polymarket-gamma",
    providerEventSlug: "fifwc-col-gha-2026-07-03",
    providerEventId: "643888",
    seriesSlug: "soccer-fifwc",
    sport: "fifwc",
    live: true,
    score: "1-0",
    elapsed: "74",
    period: "2H",
    opticOddsFixtureId: "fixture-123",
    opticOddsGameId: "game-456",
    opticOddsNumericalId: 956965,
    sportradarGameId: "sr:sport_event:53452507",
    teams: [],
    moneylineMarkets: [],
    lineMarketSourceContract: {
      intendedProvider: "optic_odds",
      fixtureKey: "fixture-123",
      missingFields: [],
      requiredForFamilies: ["total_goals"],
    },
  };
}

function opticOdd(id: string, name: string, selectionLine: string, price: number) {
  return {
    id,
    sportsbook: "BetMGM",
    market: "total_goals",
    market_id: "total_goals",
    name,
    selection: name,
    normalized_selection: name.toLowerCase().replace(/\s+/g, "_"),
    selection_line: selectionLine,
    points: 2.5,
    price,
    is_main: true,
  };
}
