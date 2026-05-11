import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { API_KEY_SCOPES, createApiCredential, updateApiCredential } from '@/lib/canonicalAuth';
import { applyDeposit } from '@/server/services/ledger';
import { POST as createMarket } from '@/app/api/admin/markets/create/route';
import { PATCH as patchAdminMarket } from '@/app/api/admin/markets/[id]/route';
import { POST as pauseMarket } from '@/app/api/admin/markets/pause/route';
import { GET as getMarketQuote } from '@/app/api/markets/[id]/quote/route';
import { POST as mintCompleteSet } from '@/app/api/orderbook/[marketId]/mint/route';
import { POST as createOrder, GET as listOrders } from '@/app/api/orders/route';
import { DELETE as cancelOrder } from '@/app/api/orders/[id]/route';
import { GET as getBalance } from '@/app/api/account/balance/route';
import { GET as getPositions } from '@/app/api/account/positions/route';
import { GET as getFills } from '@/app/api/fills/route';
import { POST as resolveMarket } from '@/app/api/admin/markets/resolve/route';
import { reconcileBalances } from '@/server/services/opsReconciliation';
import { reconcilePublicMarkets } from '@/server/services/opsReconciliation';
import { reconcileWithdrawals } from '@/server/services/opsReconciliation';

const prisma = new PrismaClient();
const LOG_DIR = path.join(process.cwd(), 'test-logs');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_PATH = path.join(LOG_DIR, `admin-user-soak-${RUN_ID}.log`);
const SUMMARY_PATH = path.join(LOG_DIR, `admin-user-soak-${RUN_ID}.summary.json`);
const ZERO = new Prisma.Decimal(0);

const requireAdmin = async () => ({ user: soakState.admin! });
const getUserId = async () => soakState.currentSessionUserId;
const emitMarketUpdate = async () => undefined;
const emitUserUpdate = async () => undefined;
const enforceSensitiveRateLimit = () => undefined;

const soakState: {
  admin: { id: string; username: string; email: string } | null;
  currentSessionUserId: string | null;
} = {
  admin: null,
  currentSessionUserId: null,
};

const originalModuleCache = new Map<string, unknown>();

function mockModule(modulePath: string, factory: unknown) {
  // @ts-ignore
  const resolved = require.resolve(modulePath);
  if (!originalModuleCache.has(resolved)) {
    // @ts-ignore
    originalModuleCache.set(resolved, require.cache[resolved]);
  }
  // @ts-ignore
  require.cache[resolved] = { exports: factory };
}

function applyRouteMocks() {
  mockModule('@/lib/admin', { requireAdmin });
  mockModule('@/lib/auth', { getUserId });
  mockModule('@/server/services/orderRateLimiter', {
    enforceSensitiveRateLimit,
    enforceOrderRateLimit: () => undefined,
  });
  mockModule('@/server/services/orderbookEvents', {
    emitMarketUpdate,
    emitUserUpdate,
  });
}

async function appendLog(event: string, payload: Record<string, unknown>) {
  const line = JSON.stringify({ ts: new Date().toISOString(), event, ...payload });
  await fs.appendFile(LOG_PATH, `${line}\n`, 'utf8');
}

async function ensureLogDir() {
  await fs.mkdir(LOG_DIR, { recursive: true });
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  };
}

async function createAdmin() {
  const username = `soak_admin_${Date.now()}`;
  const admin = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.local`,
      isAdmin: true,
    },
    select: { id: true, username: true, email: true },
  });
  soakState.admin = admin;
  return admin;
}

async function createUserAgent(index: number) {
  const username = `soak_user_${String(index).padStart(2, '0')}_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.local`,
      displayName: username,
    },
    select: { id: true, username: true },
  });

  await applyDeposit({
    eventKey: `soak-deposit:${user.id}`,
    userId: user.id,
    amount: '1000',
    chainId: 8453,
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
    logIndex: index,
    token: 'USDC',
    referenceType: 'SOAK',
    referenceId: user.id,
  });

  const created = await createApiCredential({
    userId: user.id,
    name: username,
    scopes: [...API_KEY_SCOPES],
  });

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

  return { userId: user.id, username: user.username, token: created.token, ordersPlaced: [] as string[] };
}

type Agent = Awaited<ReturnType<typeof createUserAgent>>;

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

async function createLiveMarket(round: number) {
  const createResponse = await createMarket(
    new NextRequest('http://localhost/api/admin/markets/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: `Soak Market ${round}`,
        description: `Continuous admin/user soak round ${round}`,
        resolveTime: new Date(Date.now() + 3600_000).toISOString(),
        visibility: 'PUBLIC',
        mechanism: 'ORDERBOOK',
        type: 'BINARY',
        tags: ['soak', 'admin', 'loop'],
      }),
    })
  );
  const createBody = await readJson(createResponse);
  if (createResponse.status !== 200 || !createBody?.marketId) {
    throw new Error(`create market failed status=${createResponse.status} body=${JSON.stringify(createBody)}`);
  }
  const marketId = createBody.marketId as string;

  const patchResponse = await patchAdminMarket(
    new NextRequest(`http://localhost/api/admin/markets/${marketId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: `Soak Market ${round} Live` }),
    }),
    { params: Promise.resolve({ id: marketId }) }
  );
  if (patchResponse.status !== 200) {
    throw new Error(`patch market failed status=${patchResponse.status}`);
  }

  const liveResponse = await pauseMarket(
    new NextRequest('http://localhost/api/admin/markets/pause', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ marketId, status: 'LIVE' }),
    })
  );
  const liveBody = await readJson(liveResponse);
  if (liveResponse.status !== 200) {
    throw new Error(`live market failed status=${liveResponse.status} body=${JSON.stringify(liveBody)}`);
  }

  const market = await prisma.market.findUniqueOrThrow({
    where: { id: marketId },
    include: { outcomes: { orderBy: { displayOrder: 'asc' } } },
  });
  const [yesOutcome, noOutcome] = market.outcomes;
  return { marketId, yesOutcomeId: yesOutcome.id, noOutcomeId: noOutcome.id };
}

async function userSessionMint(agent: Agent, marketId: string, quantity: string) {
  soakState.currentSessionUserId = agent.userId;
  try {
    const response = await mintCompleteSet(
      new NextRequest(`http://localhost/api/orderbook/${marketId}/mint`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quantity }),
      }),
      { params: Promise.resolve({ marketId }) }
    );
    const body = await readJson(response);
    return { status: response.status, body };
  } finally {
    soakState.currentSessionUserId = null;
  }
}

async function userGetQuote(agent: Agent, marketId: string, outcomeId: string) {
  soakState.currentSessionUserId = agent.userId;
  try {
    const response = await getMarketQuote(
      new NextRequest(`http://localhost/api/markets/${marketId}/quote?outcomeId=${outcomeId}`),
      { params: Promise.resolve({ id: marketId }) }
    );
    return { status: response.status, body: await readJson(response) };
  } finally {
    soakState.currentSessionUserId = null;
  }
}

async function userApiGet(token: string, url: string, fn: (req: NextRequest) => Promise<Response>) {
  const response = await fn(new NextRequest(url, { method: 'GET', headers: { Authorization: `Bearer ${token}` } }));
  return { status: response.status, body: await readJson(response) };
}

async function userPlaceOrder(agent: Agent, marketId: string, outcomeId: string, side: 'BUY' | 'SELL', price: string, size: string) {
  const response = await createOrder(
    new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: authHeaders(agent.token),
      body: JSON.stringify({ marketId, outcomeId, side, orderType: 'LIMIT', price, size }),
    })
  );
  const body = await readJson(response);
  return { status: response.status, body };
}

async function userCancelOrder(agent: Agent, orderId: string) {
  const response = await cancelOrder(
    new NextRequest(`http://localhost/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${agent.token}` },
    }),
    { params: Promise.resolve({ id: orderId }) }
  );
  return { status: response.status, body: await readJson(response) };
}

async function resolve(marketId: string, winningOutcomeId: string) {
  const response = await resolveMarket(
    new NextRequest('http://localhost/api/admin/markets/resolve', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ marketId, winningOutcomeId }),
    })
  );
  return { status: response.status, body: await readJson(response) };
}

async function runRound(round: number, agents: Agent[]) {
  const market = await createLiveMarket(round);
  await appendLog('round_market_live', { round, marketId: market.marketId });

  for (const agent of agents) {
    const mint = await userSessionMint(agent, market.marketId, '2.000000');
    await appendLog('mint', { round, user: agent.username, status: mint.status, body: mint.body });
  }

  for (let i = 0; i < agents.length; i += 1) {
    const agent = agents[i];
    const side = i % 2 === 0 ? 'BUY' : 'SELL';
    const outcomeId = i % 2 === 0 ? market.yesOutcomeId : market.noOutcomeId;
    const quote = await userGetQuote(agent, market.marketId, outcomeId);
    await appendLog('quote', { round, user: agent.username, status: quote.status });

    const price = side === 'BUY' ? '0.49' : '0.51';
    const placed = await userPlaceOrder(agent, market.marketId, outcomeId, side, price, '0.500000');
    await appendLog('place_order', { round, user: agent.username, side, status: placed.status, body: placed.body });
    const orderId = placed.body?.order?.id;
    if (placed.status === 200 && orderId) {
      agent.ordersPlaced.push(orderId);
    }
  }

  for (const agent of agents.slice(0, 10)) {
    const orderId = agent.ordersPlaced.shift();
    if (!orderId) continue;
    const canceled = await userCancelOrder(agent, orderId);
    await appendLog('cancel_order', { round, user: agent.username, status: canceled.status, body: canceled.body });
  }

  for (const agent of agents) {
    const [balance, positions, orders, fills] = await Promise.all([
      userApiGet(agent.token, 'http://localhost/api/account/balance', getBalance),
      userApiGet(agent.token, `http://localhost/api/account/positions?marketId=${market.marketId}`, getPositions),
      userApiGet(agent.token, `http://localhost/api/orders?marketId=${market.marketId}`, listOrders),
      userApiGet(agent.token, `http://localhost/api/fills?marketId=${market.marketId}`, getFills),
    ]);
    await appendLog('user_snapshot', {
      round,
      user: agent.username,
      balanceStatus: balance.status,
      positionsStatus: positions.status,
      ordersStatus: orders.status,
      fillsStatus: fills.status,
    });
  }

  const resolved = await resolve(market.marketId, market.yesOutcomeId);
  await appendLog('resolve_market', { round, status: resolved.status, body: resolved.body });

  const [balances, markets, withdrawals] = await Promise.all([
    reconcileBalances(),
    reconcilePublicMarkets(),
    reconcileWithdrawals(),
  ]);

  const summary = { round, marketId: market.marketId, balances, markets, withdrawals };
  await appendLog('round_summary', summary);

  if (!balances.pass || !markets.pass || !withdrawals.pass) {
    throw new Error(`round ${round} reconciliation failed: ${JSON.stringify(summary)}`);
  }

  return summary;
}

async function main() {
  applyRouteMocks();
  await ensureLogDir();
  await appendLog('run_start', { runId: RUN_ID });

  await createAdmin();
  const agents = await Promise.all(Array.from({ length: 20 }, (_, i) => createUserAgent(i + 1)));
  await appendLog('agents_ready', { count: agents.length });

  const rounds = Number(process.env.SOAK_ROUNDS ?? '1000');
  const delayMs = Number(process.env.SOAK_DELAY_MS ?? '1000');
  const summaries: unknown[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    try {
      const summary = await runRound(round, agents);
      summaries.push(summary);
      await fs.writeFile(SUMMARY_PATH, JSON.stringify({ runId: RUN_ID, roundsCompleted: round, summaries }, null, 2));
    } catch (error) {
      await appendLog('round_error', {
        round,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  await appendLog('run_complete', { rounds });
}

main()
  .catch(async (error) => {
    await appendLog('fatal', { error: error instanceof Error ? error.stack ?? error.message : String(error) }).catch(() => undefined);
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
