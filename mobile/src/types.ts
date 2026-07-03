export type Outcome = {
  id: string;
  name: string;
  label: string;
  side?: string | null;
  price: number | string | null;
  bestBid: number | string | null;
  bestAsk: number | string | null;
  bestBidSize?: number | string | null;
  bestAskSize?: number | string | null;
  isTradable: boolean;
};

export type EventLiveStat = {
  statId: string;
  label: string;
  home: string;
  away: string;
};

export type EventChartPoint = {
  outcomeId: string;
  timestamp: string;
  probability: number;
};

export type OrderbookDepthLevel = {
  outcomeId?: string;
  side: "bid" | "ask";
  price: number;
  shares: number;
  total: number;
};

export type EventSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  sportKey: string | null;
  leagueKey: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  startTime: string | null;
  status: string;
  liveStatus: string | null;
  period: string | null;
  clock: string | null;
  homeScore: number | null;
  awayScore: number | null;
  imageUrl?: string | null;
  marketCount: number;
  activeMarketCount: number;
  liveStats?: EventLiveStat[];
  chartHistory?: EventChartPoint[];
  topOutcomes?: string[];
};

export type Market = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  outcomes: Outcome[];
  event: EventSummary | null;
  rulesText: string | null;
  marketGroupKey?: string | null;
  marketGroupId?: string | null;
  marketGroupTitle: string | null;
  marketType?: string | null;
  period?: string | null;
  line?: string | null;
  liquidity?: number | string | null;
  orderbookDepth?: OrderbookDepthLevel[];
  propCategory: string | null;
};

export type EventDetail = {
  event: EventSummary;
  markets: Market[];
};

export type Quote = {
  outcomeId: string;
  outcomeName: string;
  bestBid: string | number | null;
  bestAsk: string | number | null;
  bestBidSize?: string | number | null;
  bestAskSize?: string | number | null;
  midPrice: string | number | null;
  lastPrice: string | number | null;
};

export type PortfolioHistoryItem = {
  market: {
    id: string;
    title: string;
    status: string;
    resolveTime: string | null;
    resolvedOutcomeId: string | null;
    createdAt: string;
  };
  resolvedOutcomeName: string | null;
  totalBuyCostTokens: number;
  totalSellProceedsTokens: number;
  netInvestedTokens: number;
  winningsTokens: number;
  refundsTokens: number;
  realizedPnLTokens: number;
};

export type PortfolioCanceledOrderItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
  } | null;
  side: "BUY" | "SELL";
  status: string;
  price: number;
  size: number;
  remaining: number;
  canceledAt: string;
};

export type PortfolioRecentTradeItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
  } | null;
  side: "BUY" | "SELL";
  shares: number;
  cost: number;
  fee: number;
  createdAt: string;
};

export type PortfolioPositionItem = {
  market: {
    id: string;
    title: string;
    status: string;
    resolveTime: string | null;
    createdAt: string;
  };
  outcomeId?: string;
  outcome: string;
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
  } | null;
  shares: number;
  avgCost: number;
  currentPrice: number;
  bestBid?: number | string | null;
  bestAsk?: number | string | null;
  bestBidSize?: number | string | null;
  bestAskSize?: number | string | null;
  valueTokens: number;
  costBasisTokens: number;
  totalCostBasisTokens: number;
  pnlTokens: number;
};

export type PortfolioOpenOrderItem = {
  id: string;
  market: {
    id: string;
    title: string;
    status: string;
  };
  outcome: {
    id: string;
    name: string;
  };
  selection?: {
    marketId?: string;
    outcomeId?: string;
    marketGroupId?: string;
    marketType?: string;
    line?: string;
    period?: string;
    side?: string;
    displayLabel?: string;
  } | null;
  side: "BUY" | "SELL";
  status: string;
  price: number;
  size: number;
  remaining: number;
  reservedNotional: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioSnapshot = {
  walletAvailableUSDC: number;
  walletLockedUSDC: number;
  walletTotalUSDC: number;
  walletBalance: number;
  totalValue: number;
  totalCostBasis: number;
  totalRealizedPnl: number;
  totalPnl: number;
  positions: PortfolioPositionItem[];
  openOrders: PortfolioOpenOrderItem[];
  comboOrders: unknown[];
};

export type ProfilePreferences = {
  locale: "en" | "zh";
  ticketDefaultAmount: string;
  ticketDefaultSide: "BUY" | "SELL";
  ticketDefaultSlippage?: string;
  savedEventIds: string[];
  updatedAt?: string;
};
