export type MobileLiveProviderQuoteSnapshotSeed = {
  marketId: string;
  outcomeId: string;
  source: "polymarket";
  externalSlug: string | null;
  externalMarketId: string | null;
  conditionId: string | null;
  tokenId: string | null;
  outcomeLabel: string;
  outcomePrice: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  lastTradePrice: number;
  volume: number;
  volume24hr: number;
  liquidity: number;
  liquidityClob: number;
  acceptingOrders: boolean;
  qualityStatus: "high_quality";
  mmEligible: boolean;
  reason: null;
  fetchedAt: string;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const probabilityForIndex = (marketIndex: number, outcomeIndex: number, outcomeCount: number) => {
  const head = outcomeCount >= 3 ? 0.56 : 0.62;
  const tail = outcomeCount >= 3 ? 0.18 : 0.34;
  const step = outcomeCount <= 1 ? 0 : (head - tail) / Math.max(1, outcomeCount - 1);
  const marketDrift = (marketIndex % 5) * 0.01;
  return clamp(head - outcomeIndex * step - marketDrift, 0.08, 0.88);
};

export const buildMobileLiveProviderQuoteSnapshotRows = (
  markets: Array<{
    id: string;
    externalSlug?: string | null;
    externalMarketId?: string | null;
    conditionId?: string | null;
    outcomes: Array<{
      id: string;
      name: string;
      referenceTokenId?: string | null;
      referenceOutcomeLabel?: string | null;
      displayOrder?: number | null;
    }>;
  }>,
  fetchedAt = new Date().toISOString(),
): MobileLiveProviderQuoteSnapshotSeed[] =>
  markets.flatMap((market, marketIndex) =>
    market.outcomes.map((outcome, outcomeIndex) => {
      const probability = probabilityForIndex(marketIndex, outcomeIndex, market.outcomes.length);
      const bestBid = Number(clamp(probability - 0.03, 0.02, 0.96).toFixed(2));
      const bestAsk = Number(clamp(probability + 0.03, 0.04, 0.98).toFixed(2));
      const spread = Number((bestAsk - bestBid).toFixed(6));
      const liquidity = 2400 + marketIndex * 180 + outcomeIndex * 90;

      return {
        marketId: market.id,
        outcomeId: outcome.id,
        source: "polymarket",
        externalSlug: market.externalSlug ?? null,
        externalMarketId: market.externalMarketId ?? null,
        conditionId: market.conditionId ?? null,
        tokenId: outcome.referenceTokenId ?? `mobile-provider-proof-${market.id}-${outcome.id}`,
        outcomeLabel: outcome.referenceOutcomeLabel ?? outcome.name,
        outcomePrice: Number(probability.toFixed(4)),
        bestBid,
        bestAsk,
        spread,
        lastTradePrice: Number(probability.toFixed(4)),
        volume: liquidity * 3,
        volume24hr: liquidity,
        liquidity,
        liquidityClob: liquidity,
        acceptingOrders: true,
        qualityStatus: "high_quality",
        mmEligible: true,
        reason: null,
        fetchedAt,
      };
    }),
  );
