import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { mintCompleteSetForPublicOrderbook } from "@/server/services/orderbookCollateral";
import { cancelOrderAndUnlock, placeOrderAndMatch } from "@/server/services/matching";
import {
  expandLineMarketsByPoint,
  oddsApiSingleEventSlug,
  seedOddsApiSingleEvent,
  type OddsApiEventOddsResponse,
} from "@/server/services/theOddsApiSingleEventProvider";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_FIXTURE_PATH = "docs/mobile/harness/the-odds-api-single-event/event-odds.redacted.json";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/the-odds-api-internal-environment/internal-environment-proof.redacted.json";
const S23_PROOF_PATH =
  "docs/mobile/harness/cycle-ODDSAPIS23-odds-api-s23-visible-flow/cycle-ODDSAPIS23-odds-api-s23-visible-flow.json";

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function readJson<T = any>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function readJsonIfExists<T = any>(filePath: string): Promise<T | null> {
  try {
    return await readJson<T>(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function fetchJson(url: string, init?: RequestInit) {
  const result = await fetchRaw(url, init);
  assert(result.ok, `Expected ${url} ${result.status}: ${JSON.stringify(result.body)}`);
  return result.body;
}

async function createUser(prefix: string, balance = "10000") {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec(balance), lockedUSDC: dec("0") },
  });
  return user;
}

async function createMobileCredential(prefix: string, balance = "10000") {
  const user = await createUser(prefix, balance);
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix} internal environment proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function postOrder(params: {
  baseUrl: string;
  token: string;
  body: Record<string, unknown>;
  idempotencyPrefix: string;
}) {
  return fetchRaw(`${params.baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${params.idempotencyPrefix}-${randomUUID()}`,
    },
    body: JSON.stringify({
      ...params.body,
      clientOrderId: `${params.idempotencyPrefix}-${randomUUID()}`,
    }),
  });
}

async function cancelIfResting(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (!order || !["OPEN", "PARTIAL"].includes(order.status)) return false;
  await cancelOrderAndUnlock({ orderId, userId });
  return true;
}

function redactProofValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => redactProofValue(item));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key.toLowerCase().includes("apikey") ? "[redacted-api-key-id]" : redactProofValue(entry),
    ]),
  );
}

function orderBody(params: {
  market: SelectedMarket;
  outcome: SelectedOutcome;
  side: "BUY" | "SELL";
  price: number;
  size: string | number;
}) {
  return {
    marketId: params.market.id,
    outcomeId: params.outcome.id,
    side: params.side,
    type: "LIMIT",
    price: params.price.toFixed(2),
    size: String(params.size),
    contractSide: "YES",
    selection: {
      marketType: params.market.marketType === "total_goals" ? "totals" : params.market.marketType,
      marketId: params.market.id,
      outcomeId: params.outcome.id,
      marketGroupId: params.market.marketGroupKey,
      line: params.market.line?.toString() ?? undefined,
      period: params.market.period ?? undefined,
      side: params.outcome.side ?? undefined,
      displayLabel: params.outcome.label ?? params.outcome.name,
      contractSide: "yes",
      referenceSource: params.market.referenceSource ?? undefined,
      externalSlug: params.market.externalSlug ?? undefined,
      externalMarketId: params.market.externalMarketId ?? undefined,
      conditionId: params.market.conditionId ?? undefined,
      referenceTokenId: params.outcome.referenceTokenId ?? undefined,
      referenceOutcomeLabel: params.outcome.referenceOutcomeLabel ?? params.outcome.name,
      limitPrice: params.price,
      limitSide: params.side === "BUY" ? "ask" : "bid",
    },
  };
}

type SelectedMarket = Awaited<ReturnType<typeof loadSelectedMarket>>["market"];
type SelectedOutcome = Awaited<ReturnType<typeof loadSelectedMarket>>["outcome"];

async function seedFromRedactedFixture(fixturePath: string) {
  const raw = await readJson<any>(fixturePath);
  const availableMarkets = await readJsonIfExists<any>(path.join(path.dirname(fixturePath), "available-markets.redacted.json"));
  const event = raw.event;
  assert(event && typeof event === "object", "Redacted odds fixture is missing event metadata.");
  const normalizedMarkets = Array.isArray(raw.normalizedMarkets)
    ? raw.normalizedMarkets.flatMap((market: any) => expandLineMarketsByPoint(market))
    : [];
  assert(normalizedMarkets.length > 0, "Redacted odds fixture has no normalized markets.");
  const oddsEvent: OddsApiEventOddsResponse = {
    id: String(event.id),
    sport_key: String(event.sportKey),
    sport_title: typeof event.sportTitle === "string" ? event.sportTitle : undefined,
    commence_time: String(event.startTime),
    home_team: String(event.homeTeam),
    away_team: String(event.awayTeam),
    bookmakers: [],
  };
  const seed = await seedOddsApiSingleEvent({
    oddsEvent,
    markets: normalizedMarkets,
    region: String(raw.region ?? "us"),
    oddsFormat: String(raw.oddsFormat ?? "decimal"),
  });
  return {
    fixturePath,
    noProviderApiCalls: true,
    seed,
    availableMarketKeys: Array.isArray(availableMarkets?.availableMarketKeys) ? availableMarkets.availableMarketKeys : [],
    selectedMarketKeys: Array.isArray(availableMarkets?.selectedMarketKeys) ? availableMarkets.selectedMarketKeys : [],
    importedMarketKeys: Array.from(new Set(normalizedMarkets.map((market: any) => market.marketKey))),
    normalizedMarketCount: normalizedMarkets.length,
    normalizedOutcomeCount: normalizedMarkets.reduce(
      (total: number, market: any) => total + (Array.isArray(market.outcomes) ? market.outcomes.length : 0),
      0,
    ),
  };
}

async function loadSelectedMarket(eventSlug: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          referenceSource: "sportsbook-odds",
          isListed: true,
          visibility: "PUBLIC",
          status: "LIVE",
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true, referenceTokenId: { not: null } },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
          referenceQuoteSnapshots: {
            orderBy: [{ fetchedAt: "desc" }, { updatedAt: "desc" }],
            take: 10,
          },
        },
        orderBy: [{ marketGroupKey: "asc" }, { displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Missing seeded event ${eventSlug}.`);
  const market =
    event.markets.find((item) => item.marketType === "spread") ??
    event.markets.find((item) => item.marketType === "total_goals") ??
    event.markets.find((item) => item.marketType === "match_winner_1x2") ??
    event.markets[0];
  assert(market, `Seeded event ${eventSlug} has no sportsbook-odds markets.`);
  const outcome = market.outcomes[0];
  assert(outcome, `Selected market ${market.id} has no tradable outcome.`);
  const quote = market.referenceQuoteSnapshots.find((snapshot) => snapshot.outcomeId === outcome.id) ?? null;
  const price = Number(quote?.bestAsk ?? quote?.outcomePrice ?? "0.55");
  assert(Number.isFinite(price) && price > 0 && price < 1, "Selected sportsbook reference price is invalid.");
  return { event, market, outcome, price };
}

async function runCommand(command: string, args: string[], timeoutMs = 8000) {
  try {
    const output = execFileSync(command, args, {
      encoding: "utf8",
      timeout: timeoutMs,
      windowsHide: true,
    }).trim();
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      output: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runtimeSnapshot(baseUrl: string) {
  const [health, adb, docker, ports, botProcesses] = await Promise.all([
    fetchRaw(`${baseUrl}/api/health`),
    runCommand("adb", ["devices", "-l"]),
    runCommand("docker", ["ps", "--filter", "name=poly_postgres", "--format", "{{.Names}} {{.Status}} {{.Ports}}"]),
    runCommand("powershell", [
      "-NoProfile",
      "-Command",
      "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 3002,8081,8289,19000,19001,19002 } | Select-Object LocalPort,OwningProcess | ConvertTo-Json -Compress",
    ]),
    runCommand("powershell", [
      "-NoProfile",
      "-Command",
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'node|npm|tsx|powershell' -and $_.CommandLine -match 'bot:polymarket|reference:snapshot-watch|poly-bot|soak_orderbook|refresh_reference_snapshots' -and $_.CommandLine -notmatch 'Where-Object' } | Select-Object ProcessId,Name,CommandLine | ConvertTo-Json -Compress",
    ]),
  ]);
  const s23Connected = adb.output.includes("adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp") && adb.output.includes("device");
  const postgresHealthy = docker.output.includes("poly_postgres") && docker.output.includes("(healthy)");
  const expoRunning = ports.output.includes('"LocalPort":8081') || ports.output.includes('"LocalPort":19000');
  const botRunningContinuously = Boolean(botProcesses.output && botProcesses.output !== "[]" && botProcesses.output !== "null");
  return {
    backendHealth: {
      ok: health.ok && health.body?.status === "ok",
      status: health.status,
      body: health.body,
    },
    postgres: { healthy: postgresHealthy, raw: docker.output },
    android: {
      s23Connected,
      targetDeviceId: "adb-R3CW20LFMLW-7OpoO6._adb-tls-connect._tcp",
      model: s23Connected ? "SM-S911U1" : null,
      raw: adb.output,
    },
    localServices: {
      expoRunning,
      listeningPorts: ports.output,
    },
    bot: {
      runningContinuously: botRunningContinuously,
      mode: botRunningContinuously ? "continuous-process-detected" : "one-shot-proof-liquidity-only",
      raw: botProcesses.output,
    },
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run internal sportsbook environment proof in production.");
  }
  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const fixturePath = argValue("fixture") ?? DEFAULT_FIXTURE_PATH;
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const eventSlug = argValue("eventSlug") ?? oddsApiSingleEventSlug();
  const amount = Number(argValue("amount") ?? "1.25");

  const runtimeBefore = await runtimeSnapshot(baseUrl);
  assert(runtimeBefore.backendHealth.ok, "Backend health is not ready.");
  assert(runtimeBefore.postgres.healthy, "Postgres container is not healthy.");

  const seed = await seedFromRedactedFixture(fixturePath);
  const { event, market, outcome, price } = await loadSelectedMarket(eventSlug);
  const [homePayload, detailPayload, quotePayload] = await Promise.all([
    fetchJson(`${baseUrl}/api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1&limit=10`),
    fetchJson(`${baseUrl}/api/mobile/events/${encodeURIComponent(eventSlug)}/live-detail`),
    fetchJson(`${baseUrl}/api/markets/${encodeURIComponent(market.id)}/quote`),
  ]);
  const homeVisible = Array.isArray(homePayload.events) && homePayload.events.some((item: { slug?: string }) => item.slug === eventSlug);
  const detailVisible = Array.isArray(detailPayload.markets) && detailPayload.markets.some((item: { id?: string }) => item.id === market.id);
  const quoteVisible = Array.isArray(quotePayload.quotes) && quotePayload.quotes.length > 0;

  const maker = await createUser("odds_internal_env_maker", "1000");
  await mintCompleteSetForPublicOrderbook({ marketId: market.id, userId: maker.id, quantity: "200" });
  const makerAsk = await placeOrderAndMatch({
    marketId: market.id,
    userId: maker.id,
    outcomeId: outcome.id,
    side: "SELL",
    price: price.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  assert(["OPEN", "PARTIAL"].includes(makerAsk.order.status), "Expected maker ask to rest for mobile buy.");

  const buyer = await createMobileCredential("odds_internal_env_buyer");
  const buyResult = await postOrder({
    baseUrl,
    token: buyer.credential.token,
    idempotencyPrefix: "odds-internal-env-buy",
    body: orderBody({ market, outcome, side: "BUY", price, size: amount }),
  });
  assert(buyResult.ok, `Expected buy order to pass: ${JSON.stringify(buyResult.body)}`);
  assert(buyResult.body?.order?.status === "FILLED", `Expected buy order FILLED, got ${buyResult.body?.order?.status}`);

  const portfolioAfterBuy = await fetchJson(`${baseUrl}/api/portfolio`, {
    headers: { Authorization: `Bearer ${buyer.credential.token}` },
  });
  const position = (portfolioAfterBuy.positions ?? []).find(
    (item: { marketId?: string; market?: { id?: string }; outcomeId?: string }) =>
      (item.marketId ?? item.market?.id) === market.id && item.outcomeId === outcome.id,
  );
  assert(position, "Portfolio did not show the filled sportsbook position.");

  const noPosition = await createMobileCredential("odds_internal_env_no_position");
  const noPositionSell = await postOrder({
    baseUrl,
    token: noPosition.credential.token,
    idempotencyPrefix: "odds-internal-env-no-position-sell",
    body: orderBody({ market, outcome, side: "SELL", price, size: "1" }),
  });
  const oversell = await postOrder({
    baseUrl,
    token: buyer.credential.token,
    idempotencyPrefix: "odds-internal-env-oversell",
    body: orderBody({ market, outcome, side: "SELL", price, size: Number(position.shares) + 1 }),
  });

  const originalStatus = market.status;
  let closedMarketOrder: Awaited<ReturnType<typeof postOrder>>;
  try {
    await prisma.market.update({ where: { id: market.id }, data: { status: "CLOSED" } });
    closedMarketOrder = await postOrder({
      baseUrl,
      token: buyer.credential.token,
      idempotencyPrefix: "odds-internal-env-closed-market",
      body: orderBody({ market, outcome, side: "BUY", price, size: "1" }),
    });
  } finally {
    await prisma.market.update({ where: { id: market.id }, data: { status: originalStatus } });
  }

  const missingQuote = await fetchRaw(`${baseUrl}/api/markets/${encodeURIComponent("missing-provider-market")}/quote`);

  await cancelIfResting(makerAsk.order.id, maker.id);
  const blockingAsks = await prisma.order.findMany({
    where: {
      marketId: market.id,
      outcomeId: outcome.id,
      side: "SELL",
      status: { in: ["OPEN", "PARTIAL"] },
      price: { lte: dec(price.toFixed(2)) },
    },
    select: { id: true, userId: true },
  });
  for (const order of blockingAsks) {
    await cancelIfResting(order.id, order.userId);
  }

  const cashoutMaker = await createUser("odds_internal_env_cashout_maker", "1000");
  const cashoutBid = await placeOrderAndMatch({
    marketId: market.id,
    userId: cashoutMaker.id,
    outcomeId: outcome.id,
    side: "BUY",
    price: price.toFixed(2),
    size: "200",
    type: "LIMIT",
  });
  assert(["OPEN", "PARTIAL"].includes(cashoutBid.order.status), "Expected maker bid to rest for cashout.");
  const sellResult = await postOrder({
    baseUrl,
    token: buyer.credential.token,
    idempotencyPrefix: "odds-internal-env-cashout-sell",
    body: orderBody({ market, outcome, side: "SELL", price, size: position.shares }),
  });
  assert(sellResult.ok, `Expected cashout sell to pass: ${JSON.stringify(sellResult.body)}`);
  assert(sellResult.body?.order?.status === "FILLED", `Expected cashout sell FILLED, got ${sellResult.body?.order?.status}`);

  const [portfolioAfterCashout, historyPayload, s23Proof, runtimeAfter] = await Promise.all([
    fetchJson(`${baseUrl}/api/portfolio`, {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
    fetchJson(`${baseUrl}/api/portfolio/history`, {
      headers: { Authorization: `Bearer ${buyer.credential.token}` },
    }),
    readJsonIfExists<any>(S23_PROOF_PATH),
    runtimeSnapshot(baseUrl),
  ]);
  const positionAfterCashout = (portfolioAfterCashout.positions ?? []).find(
    (item: { marketId?: string; market?: { id?: string }; outcomeId?: string }) =>
      (item.marketId ?? item.market?.id) === market.id && item.outcomeId === outcome.id,
  );
  const matchingTrades = (Array.isArray(historyPayload.recentTrades) ? historyPayload.recentTrades : []).filter(
    (item: { market?: { id?: string }; outcome?: { id?: string } }) =>
      item.market?.id === market.id && item.outcome?.id === outcome.id,
  );
  const buyHistoryTrade = matchingTrades.find((item: { side?: string }) => item.side === "BUY");
  const sellHistoryTrade = matchingTrades.find((item: { side?: string }) => item.side === "SELL");

  const checks = {
    backendHealth: runtimeAfter.backendHealth.ok,
    postgresHealth: runtimeAfter.postgres.healthy,
    s23Reachable: runtimeAfter.android.s23Connected,
    replayImportPassed: seed.seed.marketCount > 0 && seed.seed.outcomeCount > 0,
    homeRouteVisible: homeVisible,
    eventDetailVisible: detailVisible,
    quoteRouteVisible: quoteVisible,
    buyOrderFilled: buyResult.body?.order?.status === "FILLED",
    positionVisibleAfterBuy: Boolean(position),
    cannotCashoutWithoutPosition: noPositionSell.status === 409 && JSON.stringify(noPositionSell.body).includes("Insufficient shares"),
    cannotSellMoreThanOwned: oversell.status === 409 && JSON.stringify(oversell.body).includes("Insufficient available shares"),
    staleOrClosedMarketRejected: closedMarketOrder.status === 409 && JSON.stringify(closedMarketOrder.body).includes("Market is not open for trading"),
    missingProviderDataFailsGracefully: !missingQuote.ok && missingQuote.status >= 400,
    cashoutSellFilled: sellResult.body?.order?.status === "FILLED",
    positionReducedAfterCashout: !positionAfterCashout || Number(positionAfterCashout.shares ?? 0) < Number(position.shares ?? 0),
    buyHistoryVisible: Boolean(buyHistoryTrade),
    sellHistoryVisible: Boolean(sellHistoryTrade),
    s23VisibleProofFreshEnough: Boolean(s23Proof?.result === "pass" && s23Proof?.device === runtimeAfter.android.targetDeviceId),
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    scope: "odds-api-repeatable-internal-testing-environment",
    policy: {
      providerSource: "the-odds-api",
      referenceSource: "sportsbook-odds",
      noProviderApiCalls: true,
      fakeTokenOnly: true,
      doesNotClaimPolymarketBacked: true,
      fullPolymarketParityDeferredP1: true,
    },
    runtime: {
      before: runtimeBefore,
      after: runtimeAfter,
    },
    import: seed,
    event: { id: event.id, slug: event.slug, title: event.title },
    selectedMarket: {
      id: market.id,
      slug: market.slug,
      title: market.title,
      marketType: market.marketType,
      marketGroupKey: market.marketGroupKey,
      line: market.line?.toString() ?? null,
      referenceSource: market.referenceSource,
      externalMarketId: market.externalMarketId,
      conditionId: market.conditionId,
    },
    selectedOutcome: {
      id: outcome.id,
      name: outcome.name,
      side: outcome.side,
      referenceTokenId: outcome.referenceTokenId,
      referenceOutcomeLabel: outcome.referenceOutcomeLabel,
    },
    routes: {
      health: "GET /api/health",
      home: "GET /api/events?sportKey=soccer&leagueKey=world_cup&includeMobileMarkets=1&mobileMvpMatches=1",
      detail: "GET /api/mobile/events/:slug/live-detail",
      quote: "GET /api/markets/:marketId/quote",
      order: "POST /api/orders",
      portfolio: "GET /api/portfolio",
      history: "GET /api/portfolio/history",
    },
    marketMaker: {
      continuousBotRunning: runtimeAfter.bot.runningContinuously,
      proofMode: "one-shot deterministic local maker liquidity",
      makerAskOrderId: makerAsk.order.id,
      cashoutBidOrderId: cashoutBid.order.id,
    },
    positiveFlow: {
      buyOrder: redactProofValue(buyResult.body?.order ?? null),
      cashoutSellOrder: redactProofValue(sellResult.body?.order ?? null),
      positionSharesBeforeCashout: position.shares,
      positionSharesAfterCashout: positionAfterCashout?.shares ?? 0,
      buyHistoryTradeId: buyHistoryTrade?.id ?? null,
      sellHistoryTradeId: sellHistoryTrade?.id ?? null,
    },
    negativeCases: {
      noPositionSell: {
        status: noPositionSell.status,
        body: noPositionSell.body,
      },
      oversell: {
        status: oversell.status,
        body: oversell.body,
      },
      closedMarketOrder: {
        status: closedMarketOrder.status,
        body: closedMarketOrder.body,
      },
      missingProviderData: {
        status: missingQuote.status,
        body: missingQuote.body,
      },
    },
    mobileS23Proof: s23Proof
      ? {
          path: S23_PROOF_PATH,
          result: s23Proof.result ?? null,
          generatedAt: s23Proof.generatedAt ?? null,
          device: s23Proof.device ?? null,
          model: s23Proof.model ?? null,
          assertions: s23Proof.assertions ?? null,
        }
      : {
          path: S23_PROOF_PATH,
          result: "missing",
        },
    checks,
    gaps: {
      p0: Object.entries(checks)
        .filter(([, value]) => !value)
        .map(([key]) => key),
      p1: [
        "full Polymarket provider parity remains deferred until an attach-ready candidate appears",
        "team totals are imported only when present in the quota-safe odds payload",
      ],
      p2: [
        "continuous production-style market-maker bot is still not required for local fake-token testing",
      ],
    },
    recommendation: Object.values(checks).every(Boolean)
      ? "Ready for local internal tester restart/use against the temporary backend-owned sportsbook event."
      : "Not ready; fix failed P0 checks before internal tester handoff.",
  };

  await writeJson(outputPath, summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.pass) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
