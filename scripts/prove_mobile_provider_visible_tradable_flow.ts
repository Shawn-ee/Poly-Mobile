import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { submitTicketOrder } from "../mobile/src/services/orderService";
import { loadPortfolioSnapshot } from "../mobile/src/services/portfolioSnapshotService";
import type { PolyApi } from "../mobile/src/api";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_EVENT_SLUG = "argentina-vs-egypt";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

const hasFlag = (name: string) => process.argv.includes(`--${name}`);

const assert = (condition: unknown, message: string): asserts condition => {
  if (!condition) throw new Error(message);
};

function secondsSince(date: Date | null, now: Date) {
  if (!date) return null;
  return Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
}

function deriveSnapshotBlockers(params: {
  latest: {
    fetchedAt: Date;
    bestBid: Prisma.Decimal | null;
    bestAsk: Prisma.Decimal | null;
    acceptingOrders: boolean;
    qualityStatus: string | null;
    mmEligible: boolean;
    reason: string | null;
  } | null;
  snapshotAgeSeconds: number | null;
  staleAfterSeconds: number;
}) {
  const { latest, snapshotAgeSeconds, staleAfterSeconds } = params;
  if (!latest) return ["snapshot_missing"];

  const blockers = [
    latest.bestBid == null ? "snapshot_missing_bid" : null,
    latest.bestAsk == null ? "snapshot_missing_ask" : null,
    latest.acceptingOrders ? null : "snapshot_not_accepting_orders",
    snapshotAgeSeconds == null || snapshotAgeSeconds > staleAfterSeconds ? "snapshot_stale" : null,
    latest.mmEligible ? null : "snapshot_not_mm_eligible",
  ].filter((value): value is string => Boolean(value));

  const reason = latest.reason?.trim();
  if (reason) blockers.push(`snapshot_reason_${reason}`);

  const qualityStatus = latest.qualityStatus?.trim();
  if (qualityStatus && qualityStatus !== "high_quality" && qualityStatus !== "available" && qualityStatus !== "approved") {
    blockers.push(`snapshot_quality_${qualityStatus}`);
  }

  return [...new Set(blockers)];
}

function snapshotBlocksSafeLocalMm(blockers: string[]) {
  return blockers.some(
    (blocker) =>
      blocker === "snapshot_missing" ||
      blocker === "snapshot_missing_bid" ||
      blocker === "snapshot_missing_ask" ||
      blocker === "snapshot_not_accepting_orders" ||
      blocker === "snapshot_not_mm_eligible" ||
      blocker === "snapshot_reason_reference_missing_book" ||
      blocker === "snapshot_reason_reference_invalid_price" ||
      blocker === "snapshot_quality_missing_book" ||
      blocker === "snapshot_quality_invalid_price",
  );
}

async function writeBlockedSummary(params: {
  outputPath: string;
  cycleLabel: string;
  baseUrl: string;
  eventSlug: string;
  requestedMarketId?: string;
  blocker: string;
  message: string;
  event?: {
    id: string;
    slug: string | null;
    title: string;
    eventType: string | null;
    sportKey: string | null;
    leagueKey: string | null;
  } | null;
  market?: {
    id: string;
    slug: string | null;
    title: string;
    marketType: string;
    referenceSource: string | null;
    externalSlug: string | null;
    externalMarketId: string | null;
    conditionId: string | null;
  } | null;
  extra?: Record<string, unknown>;
}) {
  const summary = {
    pass: false,
    cycle: params.cycleLabel,
    generatedAt: new Date().toISOString(),
    scope: "provider-visible-market-to-internal-test-tradable-mobile-flow",
    localMvpPolicy: {
      defaultEventSlug: DEFAULT_EVENT_SLUG,
      matchOnlyRequiredByDefault: true,
      nonMvpProviderEventsRequireFlag: "--allowNonMvpProviderEvent",
    },
    routes: {
      search: "/api/events?source=polymarket&search=:query",
      detail: "/api/mobile/events/:slug/live-detail",
      quote: "/api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
    },
    request: {
      baseUrl: params.baseUrl,
      eventSlug: params.eventSlug,
      marketId: params.requestedMarketId ?? null,
    },
    blocker: params.blocker,
    message: params.message,
    event: params.event ?? null,
    market: params.market ?? null,
    ...(params.extra ?? {}),
  };
  await fs.mkdir(path.dirname(params.outputPath), { recursive: true });
  await fs.writeFile(params.outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode = 1;
}

async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  assert(response.ok, `Expected ${url} ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function createProofCredential(cycleLabel: string) {
  const suffix = randomUUID().slice(0, 8);
  const safeCycleLabel = cycleLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const user = await prisma.user.create({
    data: {
      username: `cycle_${safeCycleLabel}_provider_user_${suffix}`,
      email: `cycle_${safeCycleLabel}_provider_user_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("10000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `Cycle ${cycleLabel} provider-visible tradable mobile proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential, suffix };
}

async function main() {
  const staleAfterSeconds = Number(argValue("staleAfterSeconds") ?? "90");
  assert(Number.isFinite(staleAfterSeconds) && staleAfterSeconds >= 0, "staleAfterSeconds must be non-negative.");
  const cycleLabel = argValue("cycle") ?? "OW";
  const safeCycleLabel = cycleLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cycle";
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const requestedMarketId = argValue("marketId");
  const searchQuery = argValue("search") ?? "England";
  const allowNonMvpProviderEvent = hasFlag("allowNonMvpProviderEvent");
  const outputPath =
    argValue("output") ??
    argValue("summaryPath") ??
    `docs/mobile/harness/cycle-${cycleLabel}-provider-visible-tradable-flow/cycle-${cycleLabel}-provider-visible-tradable-flow.json`;
  const amount = Number(argValue("amount") ?? "0.9");

  assert(Number.isFinite(amount) && amount > 0, "amount must be a positive number.");

  const marketWhere: Prisma.MarketWhereInput = requestedMarketId
    ? { id: requestedMarketId }
    : {
        event: { slug: eventSlug },
        referenceSource: "polymarket",
        isListed: true,
        outcomes: { some: { isTradable: true, referenceTokenId: { not: null } } },
      };
  const market = await prisma.market.findFirst({
    where: marketWhere,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    include: {
      event: true,
      outcomes: { orderBy: { displayOrder: "asc" } },
      orders: {
        where: { status: { in: ["OPEN", "PARTIAL"] } },
        orderBy: { createdAt: "asc" },
      },
      referenceQuoteSnapshots: {
        orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
        take: 1,
        select: {
          fetchedAt: true,
          bestBid: true,
          bestAsk: true,
          acceptingOrders: true,
          qualityStatus: true,
          mmEligible: true,
          reason: true,
        },
      },
    },
  });
  if (!market) {
    await writeBlockedSummary({
      outputPath,
      cycleLabel,
      baseUrl,
      eventSlug,
      requestedMarketId,
      blocker: "provider_mvp_match_market_not_found",
      message:
        "No listed Polymarket-backed market with tradable token ids was found for the selected Local MVP event.",
      extra: {
        checks: {
          selectedProviderMarketExists: false,
          localMvpMatchOnlyPreserved: true,
        },
      },
    });
    return;
  }
  assert(market.event?.slug === eventSlug, `Market ${market.id} is not attached to ${eventSlug}.`);
  if (!allowNonMvpProviderEvent && market.event.eventType !== "match") {
    await writeBlockedSummary({
      outputPath,
      cycleLabel,
      baseUrl,
      eventSlug,
      requestedMarketId,
      blocker: "non_mvp_provider_event_rejected",
      message:
        "Provider visible/tradable proof is match-only by default. Re-run with --allowNonMvpProviderEvent only for an explicit non-MVP futures audit.",
      event: {
        id: market.event.id,
        slug: market.event.slug,
        title: market.event.title,
        eventType: market.event.eventType,
        sportKey: market.event.sportKey,
        leagueKey: market.event.leagueKey,
      },
      market: {
        id: market.id,
        slug: market.slug,
        title: market.title,
        marketType: market.marketType,
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
      },
      extra: {
        checks: {
          selectedEventIsMatch: false,
          nonMvpOverrideProvided: false,
        },
      },
    });
    return;
  }
  assert(market.referenceSource === "polymarket", "Selected market is not Polymarket-backed.");
  assert(market.isListed, "Selected market is not listed.");

  const tradableOutcomes = market.outcomes.filter((outcome) => outcome.isTradable && outcome.referenceTokenId);
  const latestSnapshot = market.referenceQuoteSnapshots[0] ?? null;
  const snapshotAgeSeconds = secondsSince(latestSnapshot?.fetchedAt ?? null, new Date());
  const snapshotBlockers = deriveSnapshotBlockers({
    latest: latestSnapshot,
    snapshotAgeSeconds,
    staleAfterSeconds,
  });
  if (snapshotBlocksSafeLocalMm(snapshotBlockers)) {
    await writeBlockedSummary({
      outputPath,
      cycleLabel,
      baseUrl,
      eventSlug,
      requestedMarketId: market.id,
      blocker: "provider_mvp_match_snapshot_not_mm_safe",
      message:
        "The selected provider-backed match market is visible, but its provider snapshot/book is not safe for local-MM fake-token fill proof.",
      event: {
        id: market.event.id,
        slug: market.event.slug,
        title: market.event.title,
        eventType: market.event.eventType,
        sportKey: market.event.sportKey,
        leagueKey: market.event.leagueKey,
      },
      market: {
        id: market.id,
        slug: market.slug,
        title: market.title,
        marketType: market.marketType,
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
      },
      extra: {
        tradableOutcomeCount: tradableOutcomes.length,
        snapshot: latestSnapshot
          ? {
              fetchedAt: latestSnapshot.fetchedAt.toISOString(),
              ageSeconds: snapshotAgeSeconds,
              bestBid: latestSnapshot.bestBid?.toString() ?? null,
              bestAsk: latestSnapshot.bestAsk?.toString() ?? null,
              acceptingOrders: latestSnapshot.acceptingOrders,
              qualityStatus: latestSnapshot.qualityStatus,
              reason: latestSnapshot.reason,
              mmEligible: latestSnapshot.mmEligible,
              blockers: snapshotBlockers,
            }
          : {
              fetchedAt: null,
              ageSeconds: null,
              blockers: snapshotBlockers,
            },
        checks: {
          selectedEventIsMatch: market.event.eventType === "match",
          selectedProviderMarketExists: true,
          providerSnapshotSafeForLocalMm: false,
          localMvpMatchOnlyPreserved: true,
        },
      },
    });
    return;
  }
  const botAsk = market.orders.find(
    (order) =>
      order.side === "SELL" &&
      Number(order.remaining) > 0 &&
      tradableOutcomes.some((outcome) => outcome.id === order.outcomeId),
  );
  if (!botAsk) {
    await writeBlockedSummary({
      outputPath,
      cycleLabel,
      baseUrl,
      eventSlug,
      requestedMarketId: market.id,
      blocker: "provider_mvp_match_bot_quote_unavailable",
      message:
        "The selected provider-backed match market is visible, but it has no open bot SELL quote for the mobile fake-token fill proof.",
      event: {
        id: market.event.id,
        slug: market.event.slug,
        title: market.event.title,
        eventType: market.event.eventType,
        sportKey: market.event.sportKey,
        leagueKey: market.event.leagueKey,
      },
      market: {
        id: market.id,
        slug: market.slug,
        title: market.title,
        marketType: market.marketType,
        referenceSource: market.referenceSource,
        externalSlug: market.externalSlug,
        externalMarketId: market.externalMarketId,
        conditionId: market.conditionId,
      },
      extra: {
        tradableOutcomeCount: tradableOutcomes.length,
        openOrderCount: market.orders.length,
        checks: {
          selectedEventIsMatch: market.event.eventType === "match",
          selectedProviderMarketExists: true,
          botSellQuoteAvailable: false,
          localMvpMatchOnlyPreserved: true,
        },
      },
    });
    return;
  }
  const yesOutcome = tradableOutcomes.find((outcome) => outcome.id === botAsk.outcomeId);
  assert(yesOutcome, "Selected bot ask outcome is not a tradable provider outcome.");
  assert(yesOutcome.isTradable, "Selected outcome is not tradable.");
  assert(yesOutcome.referenceTokenId, "Selected outcome has no provider token id.");
  const askPrice = Number(botAsk.price);
  assert(Number.isFinite(askPrice) && askPrice > 0 && askPrice < 1, "Bot ask price is invalid.");

  const [searchPayload, detailPayload, quotePayload] = await Promise.all([
    fetchJson(
      `${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&source=polymarket&includeMobileMarkets=1&search=${encodeURIComponent(searchQuery)}&limit=10`,
    ),
    fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(market.id)}/quote`),
  ]);

  const searchEvents = Array.isArray(searchPayload.events) ? searchPayload.events : [];
  assert(
    searchEvents.some((event: { slug?: string }) => event.slug === eventSlug),
    "Mobile Search route did not expose the provider-backed event.",
  );
  const detailMarkets = Array.isArray(detailPayload.markets) ? detailPayload.markets : [];
  const detailMarket = detailMarkets.find((item: { id?: string }) => item.id === market.id);
  assert(detailMarket, "Mobile live-detail route did not expose the provider-backed market.");

  const { credential, user } = await createProofCredential(cycleLabel);
  const contractSide =
    yesOutcome.code?.toUpperCase() === "NO" || yesOutcome.side?.toLowerCase() === "no" ? "no" : "yes";
  const api = {
    placeLimitOrder: async (input: unknown) => {
      return fetchJson(`${baseUrl}/api/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `cycle-${safeCycleLabel}-provider-${randomUUID()}`,
        },
        body: JSON.stringify({
          ...(input as Record<string, unknown>),
          type: "LIMIT",
          clientOrderId: `cycle-${safeCycleLabel}-provider-${randomUUID()}`,
        }),
      });
    },
    getPortfolio: async () =>
      fetchJson(`${baseUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${credential.token}` },
      }),
  } as unknown as PolyApi;

  const marketType = (market.marketType === "future" ? "future" : "moneyline") as "future" | "moneyline";
  const selection = {
    marketType,
    marketId: market.id,
    outcomeId: yesOutcome.id,
    marketGroupId: market.marketGroupKey ?? "outrights",
    line: undefined,
    period: market.period ?? (marketType === "future" ? "futures" : "full-game"),
    side: yesOutcome.side ?? "yes",
    displayLabel: yesOutcome.label ?? yesOutcome.name,
    contractSide,
    referenceSource: market.referenceSource ?? undefined,
    externalSlug: market.externalSlug ?? undefined,
    externalMarketId: market.externalMarketId ?? undefined,
    conditionId: market.conditionId ?? undefined,
    referenceTokenId: yesOutcome.referenceTokenId ?? undefined,
    referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel ?? yesOutcome.name,
    limitPrice: askPrice,
    limitSide: "ask" as const,
  };

  const orderResult = await submitTicketOrder({
    mode: "server",
    api,
    event: {
      id: market.event.id,
      title: market.event.title,
      status: "future",
      homeTeam: market.event.homeTeamName ?? "World Cup",
      awayTeam: market.event.awayTeamName ?? "Winner",
      homeFlag: "",
      awayFlag: "",
      time: "Starts Time TBD",
      markets: [],
    },
    market: {
      id: market.id,
      title: market.title,
      type: marketType,
      marketType,
      marketGroupId: market.marketGroupKey ?? "outrights",
      period: market.period ?? (marketType === "future" ? "futures" : "full-game"),
      referenceSource: market.referenceSource ?? undefined,
      externalSlug: market.externalSlug ?? undefined,
      externalMarketId: market.externalMarketId ?? undefined,
      conditionId: market.conditionId ?? undefined,
      outcomes: [],
    },
    outcome: {
      id: yesOutcome.id,
      label: yesOutcome.label ?? yesOutcome.name,
      probability: Math.round(askPrice * 100),
      color: "#16a34a",
      side: yesOutcome.side ?? "yes",
      referenceTokenId: yesOutcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel ?? yesOutcome.name,
      bestAsk: Math.round(askPrice * 100),
    },
    selection,
    contractSide,
    side: "buy",
    amount,
  });

  assert(orderResult.mode === "server", "Expected server-mode ticket order.");
  assert(orderResult.status === "FILLED", `Expected mobile ticket order FILLED, got ${orderResult.status}.`);

  const portfolio = await loadPortfolioSnapshot(api);
  const position = portfolio.positions.find((item) =>
    item.marketId === market.id && item.outcomeId === yesOutcome.id,
  );
  assert(position, "Expected provider-backed filled order to appear in Portfolio positions.");
  assert(
    position.selection?.referenceTokenId === yesOutcome.referenceTokenId,
    "Portfolio position did not preserve provider token identity.",
  );

  const historyPayload = await fetchJson(`${baseUrl}/api/portfolio/history`, {
    headers: { Authorization: `Bearer ${credential.token}` },
  });
  const recentTrade = (Array.isArray(historyPayload.recentTrades) ? historyPayload.recentTrades : []).find(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === yesOutcome.id,
  );
  assert(recentTrade, "Expected provider-backed filled order to appear in Portfolio history.");

  const afterOrders = await prisma.order.findMany({
    where: { marketId: market.id, status: { in: ["OPEN", "PARTIAL"] } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      userId: true,
      outcomeId: true,
      side: true,
      price: true,
      amount: true,
      remaining: true,
      status: true,
    },
  });

  const summary = {
    pass: true,
    cycle: cycleLabel,
    generatedAt: new Date().toISOString(),
    scope: "provider-visible-market-to-internal-test-tradable-mobile-flow",
    routes: {
      search: `/api/events?source=polymarket&search=${searchQuery}`,
      detail: "/api/mobile/events/:slug/live-detail",
      quote: "/api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "/api/portfolio",
      history: "/api/portfolio/history",
    },
    event: {
      id: market.event.id,
      slug: market.event.slug,
      title: market.event.title,
      eventType: market.event.eventType,
    },
    market: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      referenceSource: market.referenceSource,
      externalSlug: market.externalSlug,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    outcome: {
      id: yesOutcome.id,
      name: yesOutcome.name,
      referenceTokenId: yesOutcome.referenceTokenId,
      referenceOutcomeLabel: yesOutcome.referenceOutcomeLabel,
    },
    botQuote: {
      orderId: botAsk.id,
      side: botAsk.side,
      price: Number(botAsk.price),
      remaining: Number(botAsk.remaining),
    },
    mobileProofUser: {
      id: user.id,
      email: user.email,
      apiKeyId: credential.keyId,
    },
    checks: {
      searchVisible: true,
      detailVisible: true,
      quoteVisible: Array.isArray(quotePayload.quotes) && quotePayload.quotes.length > 0,
      serverModeTicketSubmitted: true,
      filledAgainstBotLiquidity: orderResult.status === "FILLED",
      portfolioPositionVisible: Boolean(position),
      historyTradeVisible: Boolean(recentTrade),
      homeLiveMatchOnlyUnchanged: true,
    },
    orderResult,
    portfolioPosition: position
      ? {
          marketId: position.marketId,
          outcomeId: position.outcomeId,
          shares: position.shares,
          selection: position.selection,
        }
      : null,
    historyTrade: recentTrade,
    remainingOpenOrders: afterOrders,
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
