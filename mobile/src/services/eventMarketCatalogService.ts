import { normalizeMarket } from "../adapters/worldCupAdapter";
import type { Market as AppMarket } from "../mocks/worldCup";
import type { Market as BackendMarket } from "../types";

export type EventMarketCatalogApi = {
  getEventMarkets?: (slug: string) => Promise<{ markets: BackendMarket[] }>;
};

export type EventMarketCatalogResult = {
  source: "server-route" | "local-fallback";
  markets: AppMarket[];
};

export async function loadEventMarketCatalog(input: {
  api?: EventMarketCatalogApi | null;
  slug: string;
  fallbackMarkets?: AppMarket[];
}): Promise<EventMarketCatalogResult> {
  const slug = input.slug.trim();
  if (slug && input.api?.getEventMarkets) {
    try {
      const payload = await input.api.getEventMarkets(slug);
      return {
        source: "server-route",
        markets: payload.markets.map(normalizeMarket).filter((market) => market.outcomes.length > 0),
      };
    } catch {
      // Fallback remains explicit and caller-provided so server mode never invents markets after a successful route read.
    }
  }

  return {
    source: "local-fallback",
    markets: input.fallbackMarkets ?? [],
  };
}
