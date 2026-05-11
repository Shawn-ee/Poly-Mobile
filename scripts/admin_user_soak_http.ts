import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from '@/lib/canonicalAuth';
import { applyDeposit } from '@/server/services/ledger';

const prisma = new PrismaClient();
const BASE_URL = process.env.SOAK_BASE_URL ?? 'http://localhost:3000';
const LOG_DIR = path.join(process.cwd(), 'test-logs');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_PATH = path.join(LOG_DIR, `admin-user-http-soak-${RUN_ID}.log`);
const SUMMARY_PATH = path.join(LOG_DIR, `admin-user-http-soak-${RUN_ID}.summary.json`);

const USER_COUNT = Number(process.env.SOAK_USER_COUNT ?? '20');
const MAX_OPEN_ORDERS_PER_USER = Number(process.env.SOAK_MAX_OPEN_ORDERS_PER_USER ?? '6');
const OBSERVE_ONLY_PROBABILITY = Number(process.env.SOAK_OBSERVE_ONLY_PROBABILITY ?? '0.2');
const CANCEL_EXISTING_PROBABILITY = Number(process.env.SOAK_CANCEL_EXISTING_PROBABILITY ?? '0.35');
const PLACE_ORDER_PROBABILITY = Number(process.env.SOAK_PLACE_ORDER_PROBABILITY ?? '0.7');
const CANCEL_NEW_ORDER_PROBABILITY = Number(process.env.SOAK_CANCEL_NEW_ORDER_PROBABILITY ?? '0.12');
const MINT_PROBABILITY = Number(process.env.SOAK_MINT_PROBABILITY ?? '0.7');
const MAX_SOAK_MARKETS = Number(process.env.SOAK_MAX_MARKETS ?? '20');
const TAKER_PROBABILITY = Number(process.env.SOAK_TAKER_PROBABILITY ?? '0.35');
const FORCED_SELL_MAKER_PROBABILITY = Number(process.env.SOAK_FORCED_SELL_MAKER_PROBABILITY ?? '1');
const MAKER_CANCEL_NEW_ORDER_PROBABILITY = Number(process.env.SOAK_MAKER_CANCEL_NEW_ORDER_PROBABILITY ?? '0.03');
const TAKER_CANCEL_NEW_ORDER_PROBABILITY = Number(process.env.SOAK_TAKER_CANCEL_NEW_ORDER_PROBABILITY ?? '0.2');
const BUY_TAKER_CROSS_TICKS = Number(process.env.SOAK_BUY_TAKER_CROSS_TICKS ?? '2');
const SELL_TAKER_CROSS_TICKS = Number(process.env.SOAK_SELL_TAKER_CROSS_TICKS ?? '2');
const PRICE_TICK = 0.01;
const INITIAL_COMPLETE_SETS = Number(process.env.SOAK_INITIAL_COMPLETE_SETS ?? '40');
const INITIAL_MINTER_COUNT = Number(process.env.SOAK_INITIAL_MINTER_COUNT ?? '4');
const FORCED_CROSS_SELL_MAKER_COUNT = Number(process.env.SOAK_FORCED_CROSS_SELL_MAKER_COUNT ?? '2');
const FORCED_CROSS_BUY_TAKER_COUNT = Number(process.env.SOAK_FORCED_CROSS_BUY_TAKER_COUNT ?? '2');
const FORCED_SELL_PRICE_MIN = Number(process.env.SOAK_FORCED_SELL_PRICE_MIN ?? '0.51');
const FORCED_SELL_PRICE_MAX = Number(process.env.SOAK_FORCED_SELL_PRICE_MAX ?? '0.53');
const FORCED_BUY_PRICE_MIN = Number(process.env.SOAK_FORCED_BUY_PRICE_MIN ?? '0.55');
const FORCED_BUY_PRICE_MAX = Number(process.env.SOAK_FORCED_BUY_PRICE_MAX ?? '0.58');
const FORCED_CROSS_SIZE_MIN = Number(process.env.SOAK_FORCED_CROSS_SIZE_MIN ?? '0.6');
const FORCED_CROSS_SIZE_MAX = Number(process.env.SOAK_FORCED_CROSS_SIZE_MAX ?? '1.2');

async function log(event: string, payload: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload });
  await fs.appendFile(LOG_PATH, `${line}\n`, 'utf8');
}

async function httpJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

function sessionCookie(userId: string) {
  return `poly_user_id=${userId}`;
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomChance(probability: number) {
  return Math.random() < probability;
}

function pickOne<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function decimal(value: number, places = 6) {
  return value.toFixed(places);
}

function clampPrice(value: number) {
  return Math.max(0.01, Math.min(0.99, value));
}

async function createAdmin() {
  const username = `soak_admin_${Date.now()}`;
  return prisma.user.create({
    data: {
      username,
      email: `${username}@test.local`,
      isAdmin: true,
    },
    select: { id: true, username: true },
  });
}

async function createUserAgent(index: number) {
  const username = `soak_http_user_${String(index).padStart(2, '0')}_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.local`,
      displayName: username,
    },
    select: { id: true, username: true },
  });

  await applyDeposit({
    eventKey: `soak-http-deposit:${user.id}`,
    userId: user.id,
    amount: '1000',
    chainId: 8453,
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    logIndex: index,
    token: 'USDC',
    referenceType: 'SOAK_HTTP',
    referenceId: user.id,
  });

  const created = await createApiCredential({ userId: user.id, name: username, scopes: [...API_KEY_SCOPES] });
  await updateApiCredential({
    userId: user.id,
    id: created.apiKey.id,
    body: {
      isDisabled: false,
      readOnly: false,
      maxOrderSize: '5.000000',
      maxOpenOrders: 20,
      maxDailySubmittedNotional: null,
      allowedMarketIds: [],
    },
  });

  return {
    userId: user.id,
    username: user.username,
    token: created.token,
    apiKeyId: created.apiKey.id,
  };
}

function roleForIndex(index: number): AgentRole {
  if (index <= 5) return 'SELL_MAKER';
  if (index <= 10) return 'BUY_MAKER';
  if (index <= 15) return 'BUY_TAKER';
  return 'SELL_TAKER_OR_OBSERVER';
}

type AgentRole = 'SELL_MAKER' | 'BUY_MAKER' | 'BUY_TAKER' | 'SELL_TAKER_OR_OBSERVER';
type Agent = Awaited<ReturnType<typeof createUserAgent>> & { role: AgentRole; isInitialMinter: boolean };

type OrdersResponse = { orders?: Array<{ id: string; side?: string; status?: string; marketId?: string; price?: string | number | null; outcomeId?: string }> };
type PositionsResponse = { items?: Array<{ outcomeId: string; shares: string | number; reservedShares?: string | number | null }> };

async function pruneOldSoakMarkets() {
  const markets = await prisma.market.findMany({
    where: { title: { startsWith: 'HTTP Soak Market' } },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (markets.length < MAX_SOAK_MARKETS) return;

  await log('market_cap_reached', {
    maxSoakMarkets: MAX_SOAK_MARKETS,
    existingSoakMarkets: markets.length,
    action: 'cap_reached_no_cleanup',
  });
}

async function createLiveMarket(adminId: string, round: number) {
  const cookie = sessionCookie(adminId);
  await pruneOldSoakMarkets();
  const createRes = await httpJson(`${BASE_URL}/api/admin/markets/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: `HTTP Soak Market ${round}`,
      description: `Continuous soak market ${round}`,
      resolveTime: new Date(Date.now() + 3600_000).toISOString(),
      visibility: 'PUBLIC',
      mechanism: 'ORDERBOOK',
      type: 'BINARY',
      tags: ['soak', 'http'],
    }),
  });
  if (createRes.status !== 200 || !(createRes.body as any)?.marketId) {
    throw new Error(`create market failed status=${createRes.status} body=${JSON.stringify(createRes.body)}`);
  }
  const marketId = (createRes.body as any).marketId as string;

  const patchRes = await httpJson(`${BASE_URL}/api/admin/markets/${marketId}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ title: `HTTP Soak Market ${round} Live` }),
  });
  if (patchRes.status !== 200) throw new Error(`patch failed status=${patchRes.status}`);

  const liveRes = await httpJson(`${BASE_URL}/api/admin/markets/pause`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ marketId, status: 'LIVE' }),
  });
  if (liveRes.status !== 200) throw new Error(`set live failed status=${liveRes.status} body=${JSON.stringify(liveRes.body)}`);

  const market = await prisma.market.findUniqueOrThrow({
    where: { id: marketId },
    include: { outcomes: { orderBy: { displayOrder: 'asc' } } },
  });
  return { marketId, yesOutcomeId: market.outcomes[0].id, noOutcomeId: market.outcomes[1].id };
}

async function seedInitialMarketInventory(marketId: string, agents: Agent[]) {
  const minters = agents.filter((agent) => agent.isInitialMinter);
  if (minters.length === 0 || INITIAL_COMPLETE_SETS <= 0) return;

  const perMinter = INITIAL_COMPLETE_SETS / minters.length;
  for (const agent of minters) {
    const mintRes = await httpJson(`${BASE_URL}/api/orderbook/${marketId}/mint`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Cookie: sessionCookie(agent.userId),
      },
      body: JSON.stringify({ quantity: decimal(perMinter, 6) }),
    });

    await log('initial_inventory_mint', {
      marketId,
      user: agent.username,
      quantity: decimal(perMinter, 6),
      status: mintRes.status,
      body: mintRes.body,
    });

    if (mintRes.status !== 200) {
      throw new Error(`initial inventory mint failed user=${agent.username} status=${mintRes.status} body=${JSON.stringify(mintRes.body)}`);
    }
  }
}

async function fetchOpenOrders(agent: Agent, marketId: string) {
  const auth = { Authorization: `Bearer ${agent.token}` };
  const response = await httpJson(`${BASE_URL}/api/orders?marketId=${marketId}`, { headers: auth });
  const orders = (((response.body as OrdersResponse)?.orders) ?? []).filter((order) =>
    order && (order.status === 'OPEN' || order.status === 'PARTIAL')
  );
  return { response, orders };
}

async function cancelOrder(agent: Agent, orderId: string) {
  return httpJson(`${BASE_URL}/api/orders/${orderId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${agent.token}` },
  });
}

async function runAgentRound(
  agent: Agent,
  marketId: string,
  outcomeIds: { yes: string; no: string },
  activeOutcomeId: string,
  forcedCrossMode: { forcedSellUserIds: Set<string>; forcedBuyUserIds: Set<string> }
) {
  const auth = { Authorization: `Bearer ${agent.token}` };
  const role: 'maker' | 'taker' = agent.role === 'BUY_TAKER' || agent.role === 'SELL_TAKER_OR_OBSERVER' ? 'taker' : 'maker';
  const isForcedSellMaker = forcedCrossMode.forcedSellUserIds.has(agent.userId);
  const isForcedBuyTaker = forcedCrossMode.forcedBuyUserIds.has(agent.userId);
  let outcomeId = activeOutcomeId;
  let side: 'BUY' | 'SELL' =
    agent.role === 'SELL_MAKER' || agent.role === 'SELL_TAKER_OR_OBSERVER'
      ? 'SELL'
      : 'BUY';
  let price = side === 'BUY' ? decimal(randomBetween(0.45, 0.49), 2) : decimal(randomBetween(0.51, 0.55), 2);
  let size = decimal(randomBetween(0.2, 1.2), 6);

  const balance = await httpJson(`${BASE_URL}/api/account/balance`, { headers: auth });
  const positions = await httpJson(`${BASE_URL}/api/account/positions?marketId=${marketId}`, { headers: auth });

  const positionItems = ((positions.body as PositionsResponse | null)?.items ?? []);
  const positionsByOutcome = new Map(
    positionItems.map((item) => [
      item.outcomeId,
      Math.max(0, Number(item.shares ?? 0) - Number(item.reservedShares ?? 0)),
    ])
  );

  const sellableOutcomes = Array.from(positionsByOutcome.entries()).filter(([, shares]) => shares > 0.05);
  const activeOutcomeSellableShares = positionsByOutcome.get(activeOutcomeId) ?? 0;
  if (agent.role === 'SELL_MAKER' && activeOutcomeSellableShares > 0.05) {
    outcomeId = activeOutcomeId;
    side = 'SELL';
    size = decimal(Math.min(Number(size), Math.max(0.05, activeOutcomeSellableShares * 0.8)), 6);
  } else if (agent.role === 'SELL_MAKER' && sellableOutcomes.length > 0) {
    const [sellOutcomeId, sellableShares] = pickOne(sellableOutcomes);
    outcomeId = sellOutcomeId;
    side = 'SELL';
    size = decimal(Math.min(Number(size), Math.max(0.05, sellableShares * 0.8)), 6);
  } else if (role === 'maker' && activeOutcomeSellableShares > 0.05 && randomChance(FORCED_SELL_MAKER_PROBABILITY)) {
    outcomeId = activeOutcomeId;
    side = 'SELL';
    size = decimal(Math.min(Number(size), Math.max(0.05, activeOutcomeSellableShares * 0.8)), 6);
  } else if (role === 'maker' && sellableOutcomes.length > 0 && randomChance(FORCED_SELL_MAKER_PROBABILITY)) {
    const [sellOutcomeId, sellableShares] = pickOne(sellableOutcomes);
    outcomeId = sellOutcomeId;
    side = 'SELL';
    size = decimal(Math.min(Number(size), Math.max(0.05, sellableShares * 0.8)), 6);
  }

  const availableShares = positionsByOutcome.get(outcomeId) ?? 0;

  if (side === 'SELL') {
    if (availableShares <= 0.05) {
      if (agent.role === 'SELL_MAKER') {
        return {
          behavior: 'observe_only' as const,
          planned: {
            role,
            side: 'SELL' as const,
            outcomeId,
            price: null,
            size: '0.000000',
            skippedReason: 'sell_inventory_unavailable',
          },
          balance,
          positions,
          quote: { status: 200, body: { skipped: true } },
          mint: null,
          openOrdersBefore: 0,
          canceledExisting: { canceled: 0, attempted: 0, statuses: [] },
          order: null,
          cancelNew: null,
          orders: { status: 200, body: { skipped: true } },
          fills: { status: 200, body: { skipped: true } },
        };
      }
      side = 'BUY';
      outcomeId = activeOutcomeId;
    } else {
      size = decimal(Math.min(Number(size), Math.max(0.05, availableShares * 0.8)), 6);
    }
  }

  price = side === 'BUY' ? decimal(randomBetween(0.45, 0.49), 2) : decimal(randomBetween(0.51, 0.55), 2);

  const quote = await httpJson(`${BASE_URL}/api/markets/${marketId}/quote?outcomeId=${outcomeId}`, {
    headers: { Cookie: sessionCookie(agent.userId) },
  });

  const quoteEntry = (((quote.body as any)?.quotes) ?? []).find((item: any) => item.outcomeId === outcomeId) ?? null;

  const openOrdersBefore = await fetchOpenOrders(agent, marketId);
  let canceledExisting: { canceled: number; attempted: number; statuses: number[] } = {
    canceled: 0,
    attempted: 0,
    statuses: [],
  };

  if (openOrdersBefore.orders.length > 0 &&
      (openOrdersBefore.orders.length >= MAX_OPEN_ORDERS_PER_USER || randomChance(CANCEL_EXISTING_PROBABILITY))) {
    const toCancel = openOrdersBefore.orders
      .slice(0, Math.max(1, Math.ceil(openOrdersBefore.orders.length / 2)));
    for (const order of toCancel) {
      const cancelRes = await cancelOrder(agent, order.id);
      canceledExisting.attempted += 1;
      canceledExisting.statuses.push(cancelRes.status);
      if (cancelRes.status === 200) canceledExisting.canceled += 1;
    }
  }

  let mint: { status: number; body: unknown } | null = null;
  if (randomChance(MINT_PROBABILITY)) {
    mint = await httpJson(`${BASE_URL}/api/orderbook/${marketId}/mint`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Cookie: sessionCookie(agent.userId) },
      body: JSON.stringify({ quantity: decimal(randomBetween(1, 3), 6) }),
    });
  }

  let behavior: 'observe_only' | 'place_order' = 'observe_only';
  let order: { status: number; body: unknown } | null = null;
  let cancelNew: { status: number; body: unknown } | null = null;

  const openOrdersCountAfterCleanup = Math.max(0, openOrdersBefore.orders.length - canceledExisting.canceled);
  const shouldObserveOnly =
    (agent.role === 'SELL_TAKER_OR_OBSERVER' ? randomChance(0.5) : randomChance(OBSERVE_ONLY_PROBABILITY)) ||
    openOrdersCountAfterCleanup >= MAX_OPEN_ORDERS_PER_USER;

  if ((isForcedSellMaker || isForcedBuyTaker) || (!shouldObserveOnly && randomChance(PLACE_ORDER_PROBABILITY))) {
    behavior = 'place_order';

    if (quoteEntry) {
      const bestAsk = Number(quoteEntry.bestAsk ?? 0);
      const bestBid = Number(quoteEntry.bestBid ?? 0);

      if (isForcedSellMaker && availableShares > 0.05) {
        side = 'SELL';
        outcomeId = activeOutcomeId;
        price = decimal(randomBetween(FORCED_SELL_PRICE_MIN, FORCED_SELL_PRICE_MAX), 2);
        size = decimal(Math.min(randomBetween(FORCED_CROSS_SIZE_MIN, FORCED_CROSS_SIZE_MAX), Math.max(0.05, availableShares * 0.8)), 6);
      } else if (role === 'maker') {
        if (agent.role === 'SELL_MAKER' && availableShares > 0.05) {
          side = 'SELL';
          price = decimal(bestBid > 0 ? clampPrice(bestBid + PRICE_TICK) : randomBetween(0.51, 0.55), 2);
          size = decimal(Math.min(Number(size), Math.max(0.05, availableShares * 0.8)), 6);
        } else if (side === 'BUY') {
          price = decimal(bestAsk > 0 ? clampPrice(bestAsk - PRICE_TICK) : randomBetween(0.45, 0.49), 2);
        } else {
          price = decimal(bestBid > 0 ? clampPrice(bestBid + PRICE_TICK) : randomBetween(0.51, 0.55), 2);
        }
      }

      if (isForcedBuyTaker) {
        side = 'BUY';
        outcomeId = activeOutcomeId;
        price = decimal(randomBetween(FORCED_BUY_PRICE_MIN, FORCED_BUY_PRICE_MAX), 2);
        size = decimal(randomBetween(FORCED_CROSS_SIZE_MIN, FORCED_CROSS_SIZE_MAX), 6);
      } else if (role === 'taker') {
        if (agent.role === 'BUY_TAKER') side = 'BUY';
        if (agent.role === 'SELL_TAKER_OR_OBSERVER') {
          side = activeOutcomeSellableShares > 0.05 ? 'SELL' : 'BUY';
          outcomeId = activeOutcomeId;
          if (side === 'SELL') {
            size = decimal(Math.min(Number(size), Math.max(0.05, activeOutcomeSellableShares * 0.7)), 6);
          }
        }

        if (side === 'BUY') {
          price = decimal(bestAsk > 0 ? clampPrice(bestAsk + BUY_TAKER_CROSS_TICKS * PRICE_TICK) : randomBetween(0.52, 0.58), 2);
        }

        if (side === 'SELL') {
          if (availableShares > 0.05) {
            price = decimal(bestBid > 0 ? clampPrice(bestBid - SELL_TAKER_CROSS_TICKS * PRICE_TICK) : randomBetween(0.42, 0.48), 2);
            size = decimal(Math.min(Number(size), Math.max(0.05, availableShares * 0.7)), 6);
          } else {
            side = 'BUY';
            price = decimal(bestAsk > 0 ? clampPrice(bestAsk + BUY_TAKER_CROSS_TICKS * PRICE_TICK) : randomBetween(0.52, 0.58), 2);
          }
        }
      }
    }

    order = await httpJson(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        ...auth,
        'content-type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ marketId, outcomeId, side, type: 'LIMIT', price, size }),
    });

    const orderId = (order.body as any)?.order?.id as string | undefined;
    const cancelProbability = role === 'maker' ? MAKER_CANCEL_NEW_ORDER_PROBABILITY : TAKER_CANCEL_NEW_ORDER_PROBABILITY;
    const shouldCancelNew = !isForcedSellMaker && !isForcedBuyTaker && randomChance(cancelProbability);
    if (orderId && shouldCancelNew) {
      cancelNew = await cancelOrder(agent, orderId);
    }
  }

  const orders = await httpJson(`${BASE_URL}/api/orders?marketId=${marketId}`, { headers: auth });
  const fills = await httpJson(`${BASE_URL}/api/fills?marketId=${marketId}`, { headers: auth });

  return {
    behavior,
    planned: { role, side, outcomeId, price, size },
    balance,
    positions,
    quote,
    mint,
    openOrdersBefore: openOrdersBefore.orders.length,
    canceledExisting,
    order,
    cancelNew,
    orders,
    fills,
  };
}

async function resolveMarketRound(adminId: string, marketId: string, winningOutcomeId: string) {
  return httpJson(`${BASE_URL}/api/admin/markets/resolve`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Cookie: sessionCookie(adminId) },
    body: JSON.stringify({ marketId, winningOutcomeId }),
  });
}

async function main() {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await log('run_start', { runId: RUN_ID, baseUrl: BASE_URL, userCount: USER_COUNT });

  const admin = await createAdmin();
  const agents: Agent[] = [];
  for (let i = 0; i < USER_COUNT; i += 1) {
    const baseAgent = await createUserAgent(i + 1);
    agents.push({ ...baseAgent, role: roleForIndex(i + 1), isInitialMinter: i < INITIAL_MINTER_COUNT });
  }
  await log('actors_ready', {
    admin: admin.username,
    users: agents.length,
    roles: {
      SELL_MAKER: agents.filter((agent) => agent.role === 'SELL_MAKER').length,
      BUY_MAKER: agents.filter((agent) => agent.role === 'BUY_MAKER').length,
      BUY_TAKER: agents.filter((agent) => agent.role === 'BUY_TAKER').length,
      SELL_TAKER_OR_OBSERVER: agents.filter((agent) => agent.role === 'SELL_TAKER_OR_OBSERVER').length,
    },
  });

  const rounds = Number(process.env.SOAK_ROUNDS ?? '1000');
  const delayMs = Number(process.env.SOAK_DELAY_MS ?? '1000');
  const summaries: unknown[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    const live = await createLiveMarket(admin.id, round);
    const activeOutcomeId = randomChance(0.5) ? live.yesOutcomeId : live.noOutcomeId;
    const forcedSellUserIds = new Set(
      agents.filter((agent) => agent.role === 'SELL_MAKER' && agent.isInitialMinter).slice(0, FORCED_CROSS_SELL_MAKER_COUNT).map((agent) => agent.userId)
    );
    const forcedBuyUserIds = new Set(
      agents.filter((agent) => agent.role === 'BUY_TAKER').slice(0, FORCED_CROSS_BUY_TAKER_COUNT).map((agent) => agent.userId)
    );
    await log('market_live', {
      round,
      marketId: live.marketId,
      activeOutcomeId,
      forcedCross: {
        forcedSellUserIds: Array.from(forcedSellUserIds),
        forcedBuyUserIds: Array.from(forcedBuyUserIds),
        forcedSellPriceRange: [FORCED_SELL_PRICE_MIN, FORCED_SELL_PRICE_MAX],
        forcedBuyPriceRange: [FORCED_BUY_PRICE_MIN, FORCED_BUY_PRICE_MAX],
        forcedCrossSizeRange: [FORCED_CROSS_SIZE_MIN, FORCED_CROSS_SIZE_MAX],
      },
    });
    await seedInitialMarketInventory(live.marketId, agents);

    for (const agent of agents) {
      const result = await runAgentRound(
        agent,
        live.marketId,
        { yes: live.yesOutcomeId, no: live.noOutcomeId },
        activeOutcomeId,
        { forcedSellUserIds, forcedBuyUserIds }
      );
      await log('agent_round', {
        round,
        user: agent.username,
        behavior: result.behavior,
        agentRole: agent.role,
        planned: result.planned,
        balance: result.balance.status,
        positions: result.positions.status,
        quote: result.quote.status,
        mint: result.mint?.status ?? null,
        openOrdersBefore: result.openOrdersBefore,
        canceledExisting: result.canceledExisting,
        order: result.order?.status ?? null,
        orderBody: result.order?.body ?? null,
        cancelNew: result.cancelNew?.status ?? null,
        cancelNewBody: result.cancelNew?.body ?? null,
        orders: result.orders.status,
        fills: result.fills.status,
      });
    }

    const resolved = await resolveMarketRound(admin.id, live.marketId, live.yesOutcomeId);
    await log('resolve', { round, status: resolved.status, body: resolved.body });

    const adminSystem = await httpJson(`${BASE_URL}/api/admin/system`, {
      headers: { Cookie: sessionCookie(admin.id) },
    });

    const summary = {
      round,
      marketId: live.marketId,
      resolvedStatus: resolved.status,
      adminSystemStatus: adminSystem.status,
      reconciliation: (adminSystem.body as any)?.reconciliation ?? null,
    };
    summaries.push(summary);
    await fs.writeFile(SUMMARY_PATH, JSON.stringify({ runId: RUN_ID, roundsCompleted: round, summaries }, null, 2));
    await log('round_summary', summary);

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  await log('run_complete', { rounds });
}

main()
  .catch(async (error) => {
    await log('fatal', { error: error instanceof Error ? error.stack ?? error.message : String(error) }).catch(() => undefined);
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
