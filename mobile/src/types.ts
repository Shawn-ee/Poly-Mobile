export type Outcome = {
  id: string;
  name: string;
  label: string;
  price: number | string | null;
  bestBid: number | string | null;
  bestAsk: number | string | null;
  isTradable: boolean;
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
  marketGroupTitle: string | null;
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
  side: "BUY" | "SELL";
  status: string;
  price: number;
  size: number;
  remaining: number;
  canceledAt: string;
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
  shares: number;
  avgCost: number;
  currentPrice: number;
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
