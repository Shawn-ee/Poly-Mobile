export const LIVE_SPORTS_MARKET_GROUPS = [
  { key: "main", label: "Main" },
  { key: "spread", label: "Spread" },
  { key: "total", label: "Total" },
  { key: "game_prop", label: "Game Props" },
  { key: "team_prop", label: "Team Props" },
  { key: "player_prop", label: "Player Props" },
  { key: "period_prop", label: "Period Props" },
  { key: "special", label: "Specials" },
  { key: "live", label: "Live" },
] as const;

export type LiveSportsMarketGroupKey = (typeof LIVE_SPORTS_MARKET_GROUPS)[number]["key"];

export type LiveSportsMarketLike = {
  marketGroupKey?: string | null;
  marketGroupTitle?: string | null;
  marketType?: string | null;
  title: string;
  displayOrder?: number | null;
};

const GROUP_LABELS = new Map(LIVE_SPORTS_MARKET_GROUPS.map((group) => [group.key, group.label]));
const GROUP_KEYS = new Set<string>(LIVE_SPORTS_MARKET_GROUPS.map((group) => group.key));
const GROUP_ALIASES: Record<string, LiveSportsMarketGroupKey> = {
  game_props: "game_prop",
  goals: "game_prop",
  goal_props: "game_prop",
  handicap: "spread",
  handicaps: "spread",
  spreads: "spread",
  team_total: "team_prop",
  team_totals: "team_prop",
  team_total_goals: "team_prop",
  totals: "total",
  total_goals: "total",
};

const MARKET_TYPE_GROUPS: Record<string, LiveSportsMarketGroupKey> = {
  both_teams_to_score: "game_prop",
  clean_sheet: "game_prop",
  correct_score: "special",
  draw_no_bet: "main",
  generic: "main",
  match_winner_1x2: "main",
  moneyline: "main",
  player_prop: "player_prop",
  spread: "spread",
  team_prop: "team_prop",
  team_total_goals: "team_prop",
  team_to_qualify: "main",
  total: "total",
  total_goals: "total",
  yes_no: "main",
};

export function normalizeLiveSportsMarketGroup(value: string | null | undefined): LiveSportsMarketGroupKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return GROUP_KEYS.has(normalized)
    ? (normalized as LiveSportsMarketGroupKey)
    : GROUP_ALIASES[normalized] ?? null;
}

export function getLiveSportsMarketGroupKey(market: LiveSportsMarketLike): LiveSportsMarketGroupKey {
  const explicitGroup = normalizeLiveSportsMarketGroup(market.marketGroupKey);
  if (explicitGroup) return explicitGroup;

  const marketType = market.marketType?.trim().toLowerCase();
  if (marketType && MARKET_TYPE_GROUPS[marketType]) return MARKET_TYPE_GROUPS[marketType];

  return "main";
}

export function getLiveSportsMarketGroupLabel(market: LiveSportsMarketLike): string {
  const explicitGroup = normalizeLiveSportsMarketGroup(market.marketGroupKey);
  if (explicitGroup && market.marketGroupTitle?.trim()) return market.marketGroupTitle.trim();
  return GROUP_LABELS.get(getLiveSportsMarketGroupKey(market)) ?? "Main";
}

export function groupLiveSportsMarkets<T extends LiveSportsMarketLike>(markets: T[]) {
  const marketsByGroup = new Map<LiveSportsMarketGroupKey, T[]>();

  for (const market of markets) {
    const key = getLiveSportsMarketGroupKey(market);
    marketsByGroup.set(key, [...(marketsByGroup.get(key) ?? []), market]);
  }

  return LIVE_SPORTS_MARKET_GROUPS.map((group) => ({
    ...group,
    markets: [...(marketsByGroup.get(group.key) ?? [])].sort((left, right) => {
      const leftOrder = left.displayOrder ?? 0;
      const rightOrder = right.displayOrder ?? 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return left.title.localeCompare(right.title);
    }),
  }));
}

export function formatSportsMarketLine({
  line,
  unit,
  period,
  participantName,
  propCategory,
}: {
  line?: string | number | null;
  unit?: string | null;
  period?: string | null;
  participantName?: string | null;
  propCategory?: string | null;
}) {
  const parts = [
    participantName,
    propCategory?.replaceAll("_", " "),
    line == null || line === "" ? null : String(line),
    unit,
    period?.replaceAll("_", " "),
  ].filter(Boolean);

  return parts.join(" / ");
}
