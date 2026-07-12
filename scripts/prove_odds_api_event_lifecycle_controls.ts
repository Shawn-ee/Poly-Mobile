import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { API_KEY_SCOPES, createApiCredential } from "@/lib/canonicalAuth";
import { cancelOrderAndUnlock } from "@/server/services/matching";
import { previewOrderbookSettlement } from "@/server/services/settlement";

const DEFAULT_BASE_URL = "http://127.0.0.1:3002";
const DEFAULT_EVENT_SLUG = "odds-api-single-soccer-test";
const DEFAULT_OUTPUT_PATH = "docs/mobile/harness/odds-api-live-runtime/event-lifecycle-controls-summary.redacted.json";

const argValue = (name: string) => {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const dec = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

async function writeJson(outputPath: string, value: unknown) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fetchRaw(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
}

async function createLocalCredential(prefix: string) {
  const suffix = randomUUID().slice(0, 8);
  const user = await prisma.user.create({
    data: {
      username: `${prefix}_${suffix}`,
      email: `${prefix}_${suffix}@local.test`,
      isAdmin: true,
    },
  });
  await prisma.userBalance.create({
    data: { userId: user.id, availableUSDC: dec("1000"), lockedUSDC: dec("0") },
  });
  const credential = await createApiCredential({
    userId: user.id,
    name: `${prefix} lifecycle proof`,
    scopes: API_KEY_SCOPES,
  });
  return { user, credential };
}

async function loadSelectedMarket(eventSlug: string, marketId?: string) {
  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      markets: {
        where: {
          ...(marketId ? { id: marketId } : {}),
          referenceSource: "sportsbook-odds",
          visibility: "PUBLIC",
          outcomes: { some: { isActive: true, isTradable: true, referenceTokenId: { not: null } } },
        },
        include: {
          outcomes: {
            where: { isActive: true, isTradable: true, referenceTokenId: { not: null } },
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  assert(event, `Event ${eventSlug} was not found.`);
  const market =
    event.markets.find((item) => item.marketType === "total_goals" && item.line?.toString() === "2.5") ??
    event.markets.find((item) => item.marketType === "spread") ??
    event.markets[0];
  assert(market, `Event ${eventSlug} has no sportsbook market.`);
  const outcome = market.outcomes[0];
  assert(outcome, `Market ${market.id} has no tradable outcome.`);
  return { event, market, outcome };
}

function orderBody(params: {
  marketId: string;
  outcomeId: string;
  side?: "BUY" | "SELL";
  price?: string;
  size?: string;
}) {
  return {
    marketId: params.marketId,
    outcomeId: params.outcomeId,
    side: params.side ?? "BUY",
    type: "LIMIT",
    price: params.price ?? "0.01",
    size: params.size ?? "1",
    contractSide: "YES",
  };
}

async function postOrder(params: {
  baseUrl: string;
  token: string;
  marketId: string;
  outcomeId: string;
  idempotencyKey: string;
}) {
  return fetchRaw(`${params.baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.idempotencyKey,
    },
    body: JSON.stringify(orderBody({ marketId: params.marketId, outcomeId: params.outcomeId })),
  });
}

async function cancelIfOpen(orderBodyValue: unknown, userId: string) {
  const order = (orderBodyValue as { order?: { id?: string; status?: string } } | null)?.order;
  if (!order?.id || !["OPEN", "PARTIAL"].includes(order.status ?? "")) return null;
  const result = await cancelOrderAndUnlock({ orderId: order.id, userId });
  return result.order;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run local lifecycle proof in production.");
  }

  const baseUrl = argValue("baseUrl") ?? DEFAULT_BASE_URL;
  const eventSlug = argValue("eventSlug") ?? DEFAULT_EVENT_SLUG;
  const marketId = argValue("marketId");
  const outputPath = argValue("output") ?? argValue("summaryPath") ?? DEFAULT_OUTPUT_PATH;
  const selected = await loadSelectedMarket(eventSlug, marketId);
  const originalMarket = {
    status: selected.market.status,
    isListed: selected.market.isListed,
    closeTime: selected.market.closeTime,
    resolvedOutcomeId: selected.market.resolvedOutcomeId,
    settlementStatus: selected.market.settlementStatus,
  };
  const actor = await createLocalCredential("odds_lifecycle_actor");

  const health = await fetchRaw(`${baseUrl}/api/health`);
  assert(health.ok && health.body?.status === "ok", `Backend health failed: ${JSON.stringify(health.body)}`);

  let liveOrder: Awaited<ReturnType<typeof postOrder>> | null = null;
  let liveCancel: Awaited<ReturnType<typeof cancelIfOpen>> | null = null;
  let pausedOrder: Awaited<ReturnType<typeof postOrder>> | null = null;
  let closedOrder: Awaited<ReturnType<typeof postOrder>> | null = null;
  let settlementPreview: Awaited<ReturnType<typeof previewOrderbookSettlement>> | null = null;

  try {
    await prisma.market.update({
      where: { id: selected.market.id },
      data: { status: "LIVE", isListed: true, resolvedOutcomeId: null, settlementStatus: null },
    });
    liveOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: selected.market.id,
      outcomeId: selected.outcome.id,
      idempotencyKey: `lifecycle-live-${randomUUID()}`,
    });
    assert(liveOrder.ok, `Expected LIVE market order to be accepted: ${JSON.stringify(liveOrder.body)}`);
    liveCancel = await cancelIfOpen(liveOrder.body, actor.user.id);

    await prisma.market.update({ where: { id: selected.market.id }, data: { status: "PAUSED" } });
    pausedOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: selected.market.id,
      outcomeId: selected.outcome.id,
      idempotencyKey: `lifecycle-paused-${randomUUID()}`,
    });

    await prisma.market.update({ where: { id: selected.market.id }, data: { status: "CLOSED" } });
    closedOrder = await postOrder({
      baseUrl,
      token: actor.credential.token,
      marketId: selected.market.id,
      outcomeId: selected.outcome.id,
      idempotencyKey: `lifecycle-closed-${randomUUID()}`,
    });

    settlementPreview = await previewOrderbookSettlement({
      marketId: selected.market.id,
      winningOutcomeId: selected.outcome.id,
    });
  } finally {
    await prisma.market.update({
      where: { id: selected.market.id },
      data: {
        status: originalMarket.status,
        isListed: originalMarket.isListed,
        closeTime: originalMarket.closeTime,
        resolvedOutcomeId: originalMarket.resolvedOutcomeId,
        settlementStatus: originalMarket.settlementStatus,
      },
    });
  }

  const restored = await prisma.market.findUnique({
    where: { id: selected.market.id },
    select: { status: true, isListed: true, resolvedOutcomeId: true, settlementStatus: true },
  });

  const pausedBody = JSON.stringify(pausedOrder?.body ?? {});
  const closedBody = JSON.stringify(closedOrder?.body ?? {});
  const checks = {
    backendHealth: health.ok && health.body?.status === "ok",
    liveOrderAccepted: liveOrder?.ok === true && liveOrder.body?.order?.marketId === selected.market.id,
    liveOrderCanceledOrFilled: liveOrder?.body?.order?.status === "FILLED" || liveCancel?.status === "CANCELED",
    pausedOrderRejected: pausedOrder?.status === 409 && pausedBody.includes("MARKET_UNAVAILABLE"),
    closedOrderRejected: closedOrder?.status === 409 && closedBody.includes("MARKET_UNAVAILABLE"),
    settlementPreviewNonMutating: settlementPreview?.mutation === "none",
    marketRestored: restored?.status === originalMarket.status && restored?.isListed === originalMarket.isListed,
  };

  const summary = {
    pass: Object.values(checks).every(Boolean),
    generatedAt: new Date().toISOString(),
    scope: "odds-api-one-event-lifecycle-controls",
    event: {
      id: selected.event.id,
      slug: selected.event.slug,
      title: selected.event.title,
      startTime: selected.event.startTime?.toISOString() ?? null,
    },
    selectedMarket: {
      id: selected.market.id,
      slug: selected.market.slug,
      title: selected.market.title,
      marketType: selected.market.marketType,
      marketGroupKey: selected.market.marketGroupKey,
      line: selected.market.line?.toString() ?? null,
      outcomeId: selected.outcome.id,
      outcomeName: selected.outcome.name,
    },
    originalMarket,
    restoredMarket: restored,
    lifecycle: {
      open: {
        marketStatus: "LIVE",
        orderStatus: liveOrder?.status ?? null,
        orderBody: liveOrder?.body ?? null,
        cleanup: liveCancel,
      },
      paused: {
        marketStatus: "PAUSED",
        orderStatus: pausedOrder?.status ?? null,
        orderBody: pausedOrder?.body ?? null,
      },
      closed: {
        marketStatus: "CLOSED",
        orderStatus: closedOrder?.status ?? null,
        orderBody: closedOrder?.body ?? null,
      },
      settlementPreview: settlementPreview,
      settlementExecution: {
        automaticOfficialResultSettlement: false,
        manualService: "previewOrderbookSettlement / resolveOrderbookMarket",
        adminRoute: "POST /api/admin/markets/resolve",
        executedInThisProof: false,
        reason: "This proof verifies readiness and non-mutating preview only; official soccer result ingestion is not wired.",
      },
    },
    routes: {
      health: "GET /api/health",
      order: "POST /api/orders",
      quote: "GET /api/markets/:marketId/quote",
      adminPause: "POST /api/admin/markets/pause",
      adminResolve: "POST /api/admin/markets/resolve",
    },
    checks,
    gaps: {
      p0: Object.entries(checks).filter(([, value]) => !value).map(([key]) => key),
      p1: [
        "automatic event close/suspend scheduler is not complete; lifecycle control is manual/local",
        "automatic official-result settlement is not complete; settlement preview/manual resolve service exists",
      ],
      p2: ["operator UI for lifecycle controls remains future admin/internal tooling"],
    },
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
