import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { prisma } from "@/lib/db";
import { buildImportedReferenceMetadata, upsertPolymarketReferenceMarket } from "@/server/services/polymarketReferenceImport";

const GAMMA_BASE_URL = "https://gamma-api.polymarket.com";

type GammaWire = Record<string, unknown>;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slugs = (args.slugs ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (slugs.length === 0) {
    throw new Error("Provide --slugs slug-a,slug-b,slug-c");
  }

  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });
  if (!admin) {
    throw new Error("No admin user found for import actor.");
  }

  const imported: Array<Record<string, unknown>> = [];
  for (const slug of slugs) {
    const candidate = await fetchMarketBySlug(slug);
    const result = await upsertPolymarketReferenceMarket(
      {
        createEvents: true,
        event: candidate.event,
        market: {
          title: candidate.question,
          description: candidate.description,
          category: candidate.category,
          resolveTime: candidate.resolveTime,
          type: candidate.outcomes.length > 2 ? "MULTI_WINNER" : "BINARY",
          desiredStatus: "draft",
          externalMarketId: candidate.externalMarketId,
          conditionId: candidate.conditionId,
          externalSlug: candidate.slug,
          referenceSource: "polymarket",
          referenceMetadata: {
            importedFrom: "polymarket",
            importStatus: "pending_review",
            referenceOnly: true,
            tradable: false,
            mmEnabled: false,
            bestBid: candidate.bestBid,
            bestAsk: candidate.bestAsk,
            spread: candidate.spread,
            lastTradePrice: candidate.lastTradePrice,
            volume: candidate.volume,
            volume24hr: candidate.volume24hr,
            liquidity: candidate.liquidity,
            acceptingOrders: candidate.acceptingOrders,
          },
          outcomes: candidate.outcomes.map((outcome, index) => ({
            name: outcome.label,
            displayOrder: index,
            isTradable: false,
            referenceTokenId: outcome.tokenId,
            referenceOutcomeLabel: outcome.label,
            referenceMetadata: {
              outcomePrice: outcome.outcomePrice,
              tokenId: outcome.tokenId,
            },
          })),
        },
      },
      admin.id,
    );

    const updatedMarket = await prisma.market.update({
      where: { id: result.marketId },
      data: {
        isListed: true,
        referenceMetadata: buildImportedReferenceMetadata(
          { importedFrom: "polymarket" },
          {
            importStatus: "approved",
            referenceOnly: true,
            tradable: false,
            mmEnabled: args.mmEnabled === "true",
            reviewedAt: new Date().toISOString(),
            reviewedBy: admin.id,
            reviewNotes: "Approved for reference-only frontend visibility and dry-run quote planning.",
          },
        ),
      },
      include: {
        outcomes: {
          orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, name: true, referenceTokenId: true },
        },
      },
    });

    await prisma.outcome.updateMany({
      where: { marketId: updatedMarket.id },
      data: { isTradable: false },
    });

    imported.push({
      slug,
      localMarketId: updatedMarket.id,
      localOutcomeIds: updatedMarket.outcomes.map((outcome) => outcome.id),
      polymarketTokenIds: updatedMarket.outcomes.map((outcome) => outcome.referenceTokenId),
      mmEnabled: args.mmEnabled === "true",
      isListed: updatedMarket.isListed,
    });
  }

  const outputPath = args.output ?? path.resolve(process.cwd(), "test-logs", "polymarket-reference-imports.json");
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ importedAt: new Date().toISOString(), imported }, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ imported }, null, 2)}\n`);
}

async function fetchMarketBySlug(slug: string) {
  const url = new URL("/markets", GAMMA_BASE_URL);
  url.searchParams.set("slug", slug);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Gamma API request failed for ${slug}: ${response.status} ${response.statusText}`);
  }
  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload) || payload.length === 0 || typeof payload[0] !== "object" || !payload[0]) {
    throw new Error(`No Gamma market found for slug ${slug}`);
  }
  const market = payload[0] as GammaWire;
  return {
    externalMarketId: asString(market.id) ?? asString(market.marketId) ?? slug,
    conditionId: asString(market.conditionId),
    slug: asString(market.slug) ?? slug,
    question: asString(market.question) ?? asString(market.title) ?? slug,
    description: asString(market.description),
    category: asString(market.category),
    resolveTime: asString(market.endDate),
    bestBid: asNumber(market.bestBid),
    bestAsk: asNumber(market.bestAsk),
    spread: asNumber(market.spread),
    lastTradePrice: asNumber(market.lastTradePrice),
    volume: asNumber(market.volume ?? market.volumeNum),
    volume24hr: asNumber(market.volume24hr ?? market.volume24Hour ?? market.volume24h),
    liquidity: asNumber(market.liquidity ?? market.liquidityNum),
    acceptingOrders: market.acceptingOrders === true || market.acceptingOrders === "true",
    event: parseEvent(market),
    outcomes: parseOutcomes(market),
  };
}

function parseEvent(market: GammaWire) {
  const events = market.events;
  if (!Array.isArray(events) || !events[0] || typeof events[0] !== "object") {
    return null;
  }
  const event = events[0] as GammaWire;
  const title = asString(event.title) ?? asString(event.name);
  if (!title) return null;
  return {
    title,
    slug: asString(event.slug),
    description: asString(event.description),
    category: asString(event.category),
    status: asString(event.status),
    source: "polymarket",
    externalEventId: asString(event.id),
    externalSlug: asString(event.slug),
    image: asString(event.image),
    icon: asString(event.icon),
    metadata: event,
  };
}

function parseOutcomes(market: GammaWire) {
  const labels = parseStringArray(market.outcomes);
  const tokenIds = parseStringArray(market.clobTokenIds);
  const outcomePrices = parseNumberArray(market.outcomePrices);
  return labels.map((label, index) => ({
    label,
    tokenId: tokenIds[index] ?? null,
    outcomePrice: outcomePrices[index] ?? null,
  }));
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

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
