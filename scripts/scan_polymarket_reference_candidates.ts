import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_OUTPUT_PATH =
  "C:\\Users\\hecto\\Desktop\\projects\\PolyProj\\Poly\\test-logs\\polymarket-reference-candidates.json";
const DEFAULT_TARGET_COUNT = 5;
const MAX_SPREAD = 0.1;
const SEARCH_QUERIES = ["sports", "politics", "finance", "election", "crypto"];

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
  volume: number | null;
  volume24hr: number | null;
  liquidity: number | null;
  acceptingOrders: boolean;
  qualityStatus: "usable" | "review" | "reject";
  mmEligibleCandidate: boolean;
};

type NormalizedMarket = Candidate & {
  externalMarketId: string;
  active: boolean;
  closed: boolean;
  archived: boolean;
  score: number;
  category: string | null;
  tags: string[];
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = parsePositiveInt(args.count, DEFAULT_TARGET_COUNT);
  const outputPath = args.output ?? DEFAULT_OUTPUT_PATH;

  const seen = new Map<string, NormalizedMarket>();
  for (const query of SEARCH_QUERIES) {
    const markets = await fetchMarkets(query, 100);
    for (const wire of markets) {
      const normalized = normalizeMarket(wire);
      if (!normalized) continue;
      const key = normalized.externalMarketId || normalized.slug;
      if (!seen.has(key)) {
        seen.set(key, normalized);
      }
    }
  }

  const selected = Array.from(seen.values())
    .filter((market) => market.qualityStatus !== "reject")
    .sort(compareCandidates)
    .slice(0, limit)
    .map(toCandidate);

  const payload = {
    generatedAt: new Date().toISOString(),
    source: "gamma-api.polymarket.com",
    targetCount: limit,
    selectedCount: selected.length,
    candidates: selected,
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function fetchMarkets(query: string, limit: number): Promise<GammaWire[]> {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("archived", "false");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("search", query);

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Gamma API request failed: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error("Gamma API returned unexpected payload.");
  }
  return payload.filter((entry): entry is GammaWire => Boolean(entry) && typeof entry === "object");
}

function normalizeMarket(input: GammaWire): NormalizedMarket | null {
  const externalMarketId = asString(input.id) ?? asString(input.marketId);
  const slug = asString(input.slug);
  const question = asString(input.question) ?? asString(input.title) ?? asString(input.name);
  if (!externalMarketId || !slug || !question) {
    return null;
  }

  const bestBid = asNumber(input.bestBid);
  const bestAsk = asNumber(input.bestAsk);
  const spread = asNumber(input.spread) ?? computeSpread(bestBid, bestAsk);
  const outcomePrices = parseNumberArray(input.outcomePrices);
  const outcomes = parseStringArray(input.outcomes);
  const volume = asNumber(input.volume ?? input.volumeNum);
  const volume24hr = asNumber(input.volume24hr ?? input.volume24Hour ?? input.volume24h);
  const liquidity = asNumber(input.liquidity ?? input.liquidityNum);
  const acceptingOrders = asBoolean(input.acceptingOrders);
  const active = asBoolean(input.active);
  const closed = asBoolean(input.closed);
  const archived = asBoolean(input.archived);
  const mmEligibleCandidate =
    acceptingOrders &&
    bestBid != null &&
    bestAsk != null &&
    spread != null &&
    spread <= MAX_SPREAD &&
    bestBid >= 0.01 &&
    bestAsk <= 0.99;
  const qualityStatus =
    !active || closed || archived || !bestBid || !bestAsk || spread == null
      ? "reject"
      : spread > MAX_SPREAD || isStubBook(bestBid, bestAsk, outcomePrices)
        ? "reject"
        : mmEligibleCandidate
          ? "usable"
          : "review";

  return {
    externalMarketId,
    question,
    slug,
    eventTitle: parseEventTitle(input),
    outcomes,
    outcomePrices,
    bestBid,
    bestAsk,
    spread,
    lastTradePrice: asNumber(input.lastTradePrice),
    volume,
    volume24hr,
    liquidity,
    acceptingOrders,
    qualityStatus,
    mmEligibleCandidate,
    active,
    closed,
    archived,
    score: (volume24hr ?? 0) * 1000 + (liquidity ?? 0) * 100 - ((spread ?? 1) * 10000),
    category: asString(input.category),
    tags: parseTags(input.tags),
  };
}

function compareCandidates(a: NormalizedMarket, b: NormalizedMarket) {
  return (
    qualityRank(b.qualityStatus) - qualityRank(a.qualityStatus) ||
    (b.score - a.score) ||
    ((b.volume24hr ?? 0) - (a.volume24hr ?? 0))
  );
}

function qualityRank(status: Candidate["qualityStatus"]) {
  return status === "usable" ? 2 : status === "review" ? 1 : 0;
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
    volume: market.volume,
    volume24hr: market.volume24hr,
    liquidity: market.liquidity,
    acceptingOrders: market.acceptingOrders,
    qualityStatus: market.qualityStatus,
    mmEligibleCandidate: market.mmEligibleCandidate,
  };
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const part = argv[index];
    if (!part.startsWith("--")) continue;
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
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseEventTitle(input: GammaWire): string | null {
  const events = input.events;
  if (Array.isArray(events)) {
    for (const event of events) {
      if (event && typeof event === "object") {
        const title = asString((event as GammaWire).title) ?? asString((event as GammaWire).name);
        if (title) return title;
      }
    }
  }
  return null;
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
      return value.split(",").map((part) => asNumber(part.trim())).filter((item): item is number => item != null);
    }
  }
  return [];
}

function parseTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (typeof entry === "string") return entry;
      if (entry && typeof entry === "object") {
        return asString((entry as GammaWire).label) ?? asString((entry as GammaWire).name);
      }
      return null;
    })
    .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function computeSpread(bestBid: number | null, bestAsk: number | null) {
  if (bestBid == null || bestAsk == null) return null;
  return Number((bestAsk - bestBid).toFixed(6));
}

function isStubBook(bestBid: number | null, bestAsk: number | null, outcomePrices: number[]) {
  if (bestBid != null && bestAsk != null && bestBid <= 0.0011 && bestAsk >= 0.9989) return true;
  return outcomePrices.length > 1 && outcomePrices.every((price) => price <= 0.0011 || price >= 0.9989);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
