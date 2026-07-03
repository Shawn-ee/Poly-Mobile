export type Locale = "en" | "zh";

export type Outcome = {
  id: string;
  label: string;
  zhLabel: string;
  probability: number;
  bestBid?: number | null;
  bestAsk?: number | null;
  bestBidSize?: number | null;
  bestAskSize?: number | null;
  color: string;
};

export type Market = {
  id: string;
  title: string;
  zhTitle: string;
  type: "game-line" | "prop" | "future" | "live";
  outcomes: Outcome[];
};

export type Event = {
  id: string;
  title: string;
  zhTitle: string;
  league: string;
  startsAt: string;
  status: "live" | "today" | "tomorrow" | "future";
  tag: string;
  zhTag: string;
  teams: Array<{ name: string; zhName: string; flag: string }>;
  markets: Market[];
};

export const worldCupEvents: Event[] = [
  {
    id: "mexico-ecuador",
    title: "Mexico vs. Ecuador",
    zhTitle: "墨西哥 vs 厄瓜多尔",
    league: "World Cup",
    startsAt: "Today 8:00 PM",
    status: "today",
    tag: "Group Stage",
    zhTag: "小组赛",
    teams: [
      { name: "Mexico", zhName: "墨西哥", flag: "🇲🇽" },
      { name: "Ecuador", zhName: "厄瓜多尔", flag: "🇪🇨" },
    ],
    markets: [
      {
        id: "mexico-ecuador-winner",
        title: "Match winner",
        zhTitle: "比赛获胜方",
        type: "game-line",
        outcomes: [
          { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 64, color: "#0a8f61" },
          { id: "ecuador", label: "Ecuador", zhLabel: "厄瓜多尔", probability: 36, color: "#f4c20d" },
        ],
      },
      {
        id: "mexico-ecuador-total",
        title: "Total goals over 2.5",
        zhTitle: "总进球大于 2.5",
        type: "prop",
        outcomes: [
          { id: "over", label: "Over", zhLabel: "大于", probability: 47, color: "#2563eb" },
          { id: "under", label: "Under", zhLabel: "小于", probability: 53, color: "#7c3aed" },
        ],
      },
      {
        id: "mexico-ecuador-both-score",
        title: "Both teams to score",
        zhTitle: "双方都进球",
        type: "prop",
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "是", probability: 51, color: "#0a8f61" },
          { id: "no", label: "No", zhLabel: "否", probability: 49, color: "#64748b" },
        ],
      },
      {
        id: "mexico-ecuador-first-goal",
        title: "First goal scorer team",
        zhTitle: "首球球队",
        type: "prop",
        outcomes: [
          { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 55, color: "#0a8f61" },
          { id: "ecuador", label: "Ecuador", zhLabel: "厄瓜多尔", probability: 45, color: "#f4c20d" },
        ],
      },
    ],
  },
  {
    id: "england-congo",
    title: "England vs. Congo DR",
    zhTitle: "英格兰 vs 刚果（金）",
    league: "World Cup",
    startsAt: "Tomorrow 11:00 AM",
    status: "tomorrow",
    tag: "International Friendly",
    zhTag: "国际友谊赛",
    teams: [
      { name: "England", zhName: "英格兰", flag: "🏴" },
      { name: "Congo DR", zhName: "刚果（金）", flag: "🇨🇩" },
    ],
    markets: [
      {
        id: "england-congo-winner",
        title: "Match winner",
        zhTitle: "比赛获胜方",
        type: "game-line",
        outcomes: [
          { id: "england", label: "England", zhLabel: "英格兰", probability: 88, color: "#ef233c" },
          { id: "congo", label: "Congo DR", zhLabel: "刚果（金）", probability: 12, color: "#0a84ff" },
        ],
      },
      {
        id: "england-clean-sheet",
        title: "England clean sheet",
        zhTitle: "英格兰零封",
        type: "prop",
        outcomes: [
          { id: "yes", label: "Yes", zhLabel: "是", probability: 58, color: "#0a8f61" },
          { id: "no", label: "No", zhLabel: "否", probability: 42, color: "#64748b" },
        ],
      },
    ],
  },
  {
    id: "france-argentina-final",
    title: "France vs. Argentina",
    zhTitle: "法国 vs 阿根廷",
    league: "World Cup",
    startsAt: "Live · 63'",
    status: "live",
    tag: "Live",
    zhTag: "滚球",
    teams: [
      { name: "France", zhName: "法国", flag: "🇫🇷" },
      { name: "Argentina", zhName: "阿根廷", flag: "🇦🇷" },
    ],
    markets: [
      {
        id: "france-argentina-live",
        title: "Live match winner",
        zhTitle: "滚球获胜方",
        type: "live",
        outcomes: [
          { id: "france", label: "France", zhLabel: "法国", probability: 41, color: "#2563eb" },
          { id: "argentina", label: "Argentina", zhLabel: "阿根廷", probability: 39, color: "#60a5fa" },
          { id: "draw", label: "Draw", zhLabel: "平局", probability: 20, color: "#94a3b8" },
        ],
      },
      {
        id: "france-argentina-next-goal",
        title: "Next goal",
        zhTitle: "下一球",
        type: "live",
        outcomes: [
          { id: "france", label: "France", zhLabel: "法国", probability: 44, color: "#2563eb" },
          { id: "argentina", label: "Argentina", zhLabel: "阿根廷", probability: 38, color: "#60a5fa" },
          { id: "none", label: "No goal", zhLabel: "无进球", probability: 18, color: "#94a3b8" },
        ],
      },
    ],
  },
];

export const worldCupFutures: Market[] = [
  {
    id: "world-cup-winner",
    title: "World Cup winner",
    zhTitle: "世界杯冠军",
    type: "future",
    outcomes: [
      { id: "france", label: "France", zhLabel: "法国", probability: 34, color: "#2563eb" },
      { id: "argentina", label: "Argentina", zhLabel: "阿根廷", probability: 20, color: "#60a5fa" },
      { id: "spain", label: "Spain", zhLabel: "西班牙", probability: 13, color: "#ef4444" },
      { id: "england", label: "England", zhLabel: "英格兰", probability: 9, color: "#f97316" },
      { id: "brazil", label: "Brazil", zhLabel: "巴西", probability: 8, color: "#16a34a" },
      { id: "portugal", label: "Portugal", zhLabel: "葡萄牙", probability: 6, color: "#dc2626" },
      { id: "germany", label: "Germany", zhLabel: "德国", probability: 5, color: "#eab308" },
      { id: "netherlands", label: "Netherlands", zhLabel: "荷兰", probability: 4, color: "#fb923c" },
      { id: "italy", label: "Italy", zhLabel: "意大利", probability: 3, color: "#0ea5e9" },
      { id: "uruguay", label: "Uruguay", zhLabel: "乌拉圭", probability: 2.8, color: "#38bdf8" },
      { id: "belgium", label: "Belgium", zhLabel: "比利时", probability: 2.4, color: "#facc15" },
      { id: "croatia", label: "Croatia", zhLabel: "克罗地亚", probability: 2.1, color: "#ef4444" },
      { id: "colombia", label: "Colombia", zhLabel: "哥伦比亚", probability: 1.9, color: "#f59e0b" },
      { id: "usa", label: "USA", zhLabel: "美国", probability: 1.7, color: "#2563eb" },
      { id: "mexico", label: "Mexico", zhLabel: "墨西哥", probability: 1.5, color: "#22c55e" },
      { id: "japan", label: "Japan", zhLabel: "日本", probability: 1.3, color: "#f43f5e" },
      { id: "morocco", label: "Morocco", zhLabel: "摩洛哥", probability: 1.1, color: "#be123c" },
      { id: "switzerland", label: "Switzerland", zhLabel: "瑞士", probability: 1, color: "#ef4444" },
      { id: "denmark", label: "Denmark", zhLabel: "丹麦", probability: 0.9, color: "#dc2626" },
      { id: "senegal", label: "Senegal", zhLabel: "塞内加尔", probability: 0.8, color: "#16a34a" },
      { id: "australia", label: "Australia", zhLabel: "澳大利亚", probability: 0.6, color: "#fbbf24" },
    ],
  },
  {
    id: "golden-boot",
    title: "Golden Boot winner",
    zhTitle: "金靴奖得主",
    type: "future",
    outcomes: [
      { id: "mbappe", label: "Mbappe", zhLabel: "姆巴佩", probability: 22, color: "#2563eb" },
      { id: "haaland", label: "Haaland", zhLabel: "哈兰德", probability: 18, color: "#0a8f61" },
      { id: "messi", label: "Messi", zhLabel: "梅西", probability: 13, color: "#60a5fa" },
    ],
  },
];
