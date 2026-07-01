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
