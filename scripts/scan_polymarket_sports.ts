import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_OUTPUT_PATH =
  "C:\\Users\\shawn\\Desktop\\Poly\\Poly\\test-logs\\polymarket-sports-candidates.json";
const DEFAULT_TARGET_COUNT = 5;
const DEFAULT_FETCH_LIMIT = 200;
const MAX_SPREAD = 0.1;

type GammaWire = Record<string, unknown>;

type Candidate = {
  question: string;
  slug: string;
  eventTitle: string | null;
  outcomes: string[];
  outcomePrices: number[];
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  lastTradePrice: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  acceptingOrders: boolean;
  qualityStatus: "usable" | "review" | "reject";
  mmEligibleCandidate: boolean;
};

type NormalizedMarket = Candidate & {
  active: boolean;
  closed: boolean;
  archived: boolean;
  volume: number | null;
  liquidityClob: number | null;
  tags: string[];
  category: string | null;
  score: number;
  rejectionReasons: string[];
  reviewReasons: string[];
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const targetCount = parsePositiveInt(args.count, DEFAULT_TARGET_COUNT);
  const fetchLimit = parsePositiveInt(args.fetchLimit, DEFAULT_FETCH_LIMIT);
  const dryRun = parseBooleanFlag(args.dryRun, true);
  const createLocalMarkets = parseBooleanFlag(args.createLocalMarkets, false);
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const markets = await fetchActiveMarkets(fetchLimit);
  const sportsMarkets = markets
    .map(normalizeMarket)
    .filter((market): market is NormalizedMarket => market != null)
    .filter(isSportsRelated)
    .sort(compareCandidates);

  const selected = sportsMarkets.slice(0, targetCount).map(toCandidate);
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "gamma-api.polymarket.com",
    dryRun,
    createLocalMarkets,
    targetCount,
    selectedCount: selected.length,
    notes: [
      "Read-only scanner. No local markets were created.",
      "Scanner does not make markets tradable, enable MM, or place orders.",
      createLocalMarkets
        ? "createLocalMarkets=true was provided, but this scanner remains metadata-only."
        : "Local market creation remains disabled by default.",
    ],
    candidates: selected,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function fetchActiveMarkets(limit: number): Promise<GammaWire[]> {
  const perPage = Math.min(Math.max(limit, 50), 200);
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(perPage));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Gamma API request failed: ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("Gamma API returned unexpected payload.");
  }

  return payload
    .filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object")
    .slice(0, limit);
}

function normalizeMarket(input: GammaWire): NormalizedMarket | null {
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  if (!slug || !question) {
    return null;
  }

  const outcomes = parseStringArray(input.outcomes);
  const outcomePrices = parseNumberArray(input.outcomePrices);
  const tags = parseTags(input.tags);
  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  const spread = firstDefinedNumber(asNumber(input.spread), computeSpread(bestBid, bestAsk));
  const volume24hr = asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h);
  const liquidity = asNumber(input.liquidity ?? input.liquidityNum);
  const active = asBoolean(input.active);
  const closed = asBoolean(input.closed);
  const archived = asBoolean(input.archived);
  const acceptingOrders = asBoolean(input.acceptingOrders);
  const eventTitle = parseEventTitle(input);
  const rejectionReasons: string[] = [];
  const reviewReasons: string[] = [];

  if (!active || closed || archived) {
    rejectionReasons.push("inactive");
  }
  if (!acceptingOrders) {
    reviewReasons.push("not_accepting_orders");
  }
  if (bestBid == null || bestAsk == null) {
    rejectionReasons.push("missing_bid_ask");
  }
  if (spread == null) {
    rejectionReasons.push("missing_spread");
  } else if (spread > MAX_SPREAD) {
    rejectionReasons.push("wide_spread");
  } else if (spread > 0.05) {
    reviewReasons.push("spread_above_0_05");
  }
  if (isStubBook(bestBid, bestAsk, outcomePrices)) {
    rejectionReasons.push("stub_book");
  }
  if (outcomes.length === 0) {
    reviewReasons.push("missing_outcomes");
  }
  if (outcomePrices.length === 0 || outcomePrices.every((price) => price <= 0 || price >= 1)) {
    rejectionReasons.push("unusable_outcome_prices");
  }

  const qualityStatus: Candidate["qualityStatus"] =
    rejectionReasons.length > 0 ? "reject" : reviewReasons.length > 0 ? "review" : "usable";
  const mmEligibleCandidate =
    qualityStatus === "usable" &&
    acceptingOrders &&
    bestBid != null &&
    bestAsk != null &&
    spread != null &&
    spread <= MAX_SPREAD;

  const score =
    (volume24hr ?? 0) * 1000 +
    (liquidity ?? 0) * 10 +
    (acceptingOrders ? 1000000 : 0) +
    (mmEligibleCandidate ? 500000 : 0) -
    ((spread ?? 1) * 10000);

  return {
    question,
    slug,
    eventTitle,
    outcomes,
    outcomePrices,
    bestBid,
    bestAsk,
    spread,
    lastTradePrice: asNumber(input.lastTradePrice),
    volume24hr,
    liquidity,
    acceptingOrders,
    qualityStatus,
    mmEligibleCandidate,
    active,
    closed,
    archived,
    volume: asNumber(input.volume ?? input.volumeNum),
    liquidityClob: asNumber(input.liquidityClob),
    tags,
    category: asString(input.category),
    score,
    rejectionReasons,
    reviewReasons,
  };
}

function isSportsRelated(market: NormalizedMarket) {
  const haystack = [
    market.category,
    market.eventTitle,
    market.question,
    ...market.tags,
    ...market.outcomes,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  const keywords = [
    "sports",
    "nba",
    "nfl",
    "mlb",
    "nhl",
    "wnba",
    "soccer",
    "football",
    "baseball",
    "basketball",
    "tennis",
    "golf",
    "mma",
    "ufc",
    "boxing",
    "formula 1",
    "f1",
    "cricket",
    "ncaa",
    "champions league",
    "premier league",
    "la liga",
    "serie a",
    "bundesliga",
    "world cup",
    "fight",
    "playoff",
    "playoffs",
    "match",
    "tournament",
    "grand slam",
  ];

  return keywords.some((keyword) => haystack.includes(keyword));
}

function compareCandidates(a: NormalizedMarket, b: NormalizedMarket) {
  const qualityRank = qualityWeight(b.qualityStatus) - qualityWeight(a.qualityStatus);
  if (qualityRank !== 0) return qualityRank;
  return b.score - a.score;
}

function qualityWeight(status: Candidate["qualityStatus"]) {
  if (status === "usable") return 2;
  if (status === "review") return 1;
  return 0;
}

function toCandidate(market: NormalizedMarket): Candidate {
  return {
    question: market.question,
    slug: market.slug,
    eventTitle: market.eventTitle,
    outcomes: market.outcomes,
    outcomePrices: market.outcomePrices,
    bestBid: market.bestBid,
    bestAsk: market.bestAsk,
    spread: market.spread,
    lastTradePrice: market.lastTradePrice,
    volume24hr: market.volume24hr,
    liquidity: market.liquidity,
    acceptingOrders: market.acceptingOrders,
    qualityStatus: market.qualityStatus,
    mmEligibleCandidate: market.mmEligibleCandidate,
  };
}

function parseEventTitle(input: GammaWire): string | null {
  const events = input.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event && typeof event === "object") {
        const title = asString((event as GammaWire).title) ?? asString((event as GammaWire).name);
        if (title) {
          return title;
        }
      }
    }
  }

  const series = input.series;
  if (series && typeof series === "object") {
    return asString((series as GammaWire).title) ?? asString((series as GammaWire).name);
  }

  return null;
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) {
      continue;
    }
    const key = part.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    index += 1;
  }
  return args;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (value == null) {
    return fallback;
  }
  return value === "true";
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) {
    return null;
  }
  return Number((bestAsk - bestBid).toFixed(6));
}

function isStubBook(bestBid: number | null, bestAsk: number | null, outcomePrices: number[]) {
  if (bestBid != null && bestAsk != null && bestBid <= 0.0011 && bestAsk >= 0.9989) {
    return true;
  }
  return outcomePrices.length > 1 && outcomePrices.every((price) => price <= 0.0011 || price >= 0.9989);
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (typeof value === "string") {
    try {
      return parseStringArray(JSON.parse(value) as unknown);
    } catch {
      return value.split(",").map((part) => part.trim()).filter(Boolean);
    }
  }
  return [];
}

function parseNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => asNumber(item)).filter((item): item is number => item != null);
  }
  if (typeof value === "string") {
    try {
      return parseNumberArray(JSON.parse(value) as unknown);
    } catch {
      return value
        .split(",")
        .map((part) => asNumber(part.trim()))
        .filter((item): item is number => item != null);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (entry && typeof entry === "object") {
        return asString((entry as GammaWire).label) ?? asString((entry as GammaWire).name);
      }
      return null;
    })
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true";
}

function firstDefinedNumber(...values: Array<number | null>) {
  for (const value of values) {
    if (value != null) {
      return value;
    }
  }
  return null;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
